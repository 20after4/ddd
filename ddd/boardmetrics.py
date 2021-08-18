#!/usr/bin/python3

import io
import json
import pathlib
import sqlite3 as sqlite3
import subprocess
import sys
from collections import deque
from operator import itemgetter
from typing import Mapping

import click
from rich import inspect, pretty
from rich.console import Console
from rich.pretty import pprint

from ddd.data import PropertyMatcher
from ddd.mw import MWVersion, version
from ddd.phab import Conduit
from ddd.phobjects import (
    PHID,
    DataCache,
    PHIDRef,
    PHObject,
    PHObjectEncoder,
    sqlite_connect,
    sqlite_insert_statement,
)

metrics = {}


class ObjectMetrics(object):
    """Used to track how long a task exists in each workboard column"""

    phid: PHID
    metrics: dict = {}

    def __init__(self, id):
        self.id = id
        self.metrics = {}
        self.started = None
        self.last_column = None

    def metric(self, metric_name: str):
        metric_name = str(metric_name)
        if metric_name not in self.metrics:
            self.metrics[metric_name] = {"start": 0, "end": 0}
        return self.metrics[metric_name]

    def start(self, metric: str, value: int):
        if self.started:
            if metric == self.started:
                return
            record = self.metric(self.started)
            record["next"] = metric
            self.end(value)

        record = self.metric(metric)
        record["start"] = value
        self.set_if_earlier("start", value)
        self.started = metric
        self.last_column = metric

    def end(self, value: int):
        if self.started is not None:
            metric = self.started
            record = self.metric(metric)
            record["end"] = value
            record["duration"] = value - record["start"]

        self.set_if_later("end", value)
        self.started = None

    def set_if_later(self, metric: str, value: int):
        record = self.metric(metric)
        if value > record["end"]:
            record["end"] = value
            if record["start"] == 0:
                record["start"] = record["end"]

    def set_if_earlier(self, metric: str, value: int):
        record = self.metric(metric)
        if value < record["start"]:
            record["start"] = value
            if record["end"] == 0:
                record["end"] = record["start"]

    def duration(self, metric):
        """Calculate the duration of the metric"""
        record = self.metric(metric)
        start = record["start"] if "start" in record else self.metrics["start"]
        end = record["end"] if "end" in record else self.metrics["end"]
        return end - start

    def lead(self):
        return self.metrics["start"] - self.metrics["start"]

    def all(self):
        total = 0
        for metric, record in self.metrics.items():
            if isinstance(record, dict) and "duration" in record:
                total += record["duration"]
                next_metric = record["next"] if "next" in record else None
                yield [
                    self.id,
                    metric,
                    record["start"],
                    record["end"],
                    record["duration"],
                    next_metric,
                ]


def MetricsFor(id) -> ObjectMetrics:
    global metrics
    if id not in metrics:
        metrics[id] = ObjectMetrics(id)
    return metrics[id]


def maptransactions(
    project_phid,
    transactions: Mapping,
    con: sqlite3.Connection,
    console: Console,
    phab: Conduit,
):
    mapper = PropertyMatcher()

    # functions decorated with @ttype will take a transaction object and distill
    # it down to just the information we care about.
    # add new functions to match other transaction types.
    # ids = [id for id in tasks.keys()]

    @mapper("transactionType=core:edge", "meta.edge:type=41")
    def edge(t):
        """
        edge transactions point to related objects such as subtasks,
        mentioned tasks and project tags.
        The type of relationship is specified by an integer in
        meta['edge:type']. Edge type constants are defined in
        the enum `ddd.phobjects.EdgeType`
        """
        oldValue = [p for p in t["oldValue"]]
        newValue = [p for p in t["newValue"]]
        move = ["projects", "global", oldValue, newValue]
        return [move]

    @mapper("transactionType=core:edge", "meta.edge:type=51")
    def mention_this(t):
        return [
            ["mention-this", None, t["taskID"], PHIDRef(taskid)]
            for taskid in t["newValue"]
        ]

    @mapper("transactionType=core:edge", "meta.edge:type=52")
    def mention_task(t):
        return [
            ["mention", None, t["taskID"], PHIDRef(taskid)] for taskid in t["newValue"]
        ]

    @mapper("transactionType=core:edge", "meta.edge:type=3")
    def subtask(t):
        removed = [p for p in t["oldValue"] if p not in t["newValue"]]
        added = [p for p in t["newValue"] if p not in t["oldValue"]]
        res = []
        for r in removed:
            res.append(["removed_subtask", None, t["taskID"], PHIDRef(r)])

        for a in added:
            res.append(["added_subtask", None, t["taskID"], PHIDRef(a)])
        return res

    # @mapper("transactionType=unblock")
    def unblock(t):
        pass

    @mapper("transactionType=status")
    def status(t):
        return [("status", "global", t["oldValue"], t["newValue"])]

    # @mapper("transactionType=core:create")
    def create(t):
        return [("status", "global", None, "open")]

    @mapper("transactionType=core:columns")
    def columns(t):
        newv = t["newValue"]
        res = []
        for obj in newv:
            # if obj["boardPHID"] != project_phid:
            #    continue

            tocol = str(obj["columnPHID"])
            if obj["fromColumnPHIDs"]:
                [fromcol] = obj["fromColumnPHIDs"]
                fromcol = str(fromcol)
            else:
                fromcol = None

            res.append(("columns", PHIDRef(obj["boardPHID"]), fromcol, tocol))

        return res

    metrics = {}
    days = 60 * 60 * 24
    datapoints = deque()
    insert_stmt = None

    for taskid, t in transactions.items():
        st = sorted(t, key=itemgetter("dateCreated"))
        task_metrics = MetricsFor(taskid)
        metrics[taskid] = task_metrics
        for record in st:
            ts = int(record["dateCreated"])
            trnsid = record["transactionID"]

            for row in mapper.run(record):
                what, project, old, new = row
                task_metrics.set_if_earlier("start", ts)
                task_metrics.set_if_later("end", ts)

                if what == "projects":
                    if project_phid in new:
                        task_metrics.start(project_phid, ts)
                        for project in new:
                            if project not in old:
                                datapoints.append(
                                    (trnsid, ts, project, None, taskid, what, 1)
                                )
                    elif project_phid in old:
                        task_metrics.end(ts)
                        for project in old:
                            if project not in new:
                                datapoints.append(
                                    (trnsid, ts, project, None, taskid, what, -1)
                                )

                elif what == "columns":
                    if old:
                        datapoints.append((trnsid, ts, project, old, taskid, what, -1))
                    if new:
                        datapoints.append((trnsid, ts, project, new, taskid, what, 1))
                        task_metrics.start(new, ts)
                elif what == "status":

                    if (old == "open" or old == "stalled") and not (
                        new == "open" or new == "stalled"
                    ):
                        if task_metrics.last_column:
                            datapoints.append(
                                (
                                    trnsid,
                                    ts,
                                    project_phid,
                                    task_metrics.last_column,
                                    taskid,
                                    what,
                                    -1,
                                )
                            )
                        task_metrics.end(ts)
                    elif new == "open" and task_metrics.last_column:
                        datapoints.append(
                            (
                                trnsid,
                                ts,
                                project_phid,
                                task_metrics.last_column,
                                taskid,
                                what,
                                1,
                            )
                        )

                event = {
                    "ts": ts,
                    "task": taskid,
                    "user": record["authorPHID"],
                    "event": what,
                    "project": project,
                    "old": old,
                    "new": new,
                }
                if insert_stmt is None:
                    insert_stmt = sqlite_insert_statement("events", event, replace=True)
                con.execute(insert_stmt, event)
    con.commit()
    return datapoints


thisdir = pathlib.Path(__file__).parent
mock_default = thisdir / ".." / "test" / "transactions.json"

all_tables = ["columns", "events", "column_metrics", "task_metrics", "phobjects", "all"]


@click.command()
@click.option(
    "--project",
    default="PHID-PROJ-uier7rukzszoewbhj7ja",
    metavar="PHID",
    help="PHID of the project to fetch.",
)
@click.option(
    "--mock",
    help="Skip calling the Phabricator API and instead use test data from a file.",
    is_flag=False,
    flag_value=mock_default,
    type=click.Path(exists=True, dir_okay=False),
)
@click.option(
    "--db",
    nargs=1,
    required=False,
    default="./metrics.db",
    help="Path to sqlite database.",
    show_default=True,
    type=click.Path(),
)
@click.option(
    "--dump",
    nargs=1,
    help="Dump metrics in the specified format. Supported formats: json, csv.",
    required=False,
    metavar="FORMAT",
)
@click.option(
    "--table",
    nargs=1,
    help="With --dump, specifies which table to dump. Default=all",
    required=False,
    metavar="TABLE",
    default="all",
    type=click.Choice(all_tables, case_sensitive=True),
)
@click.option(
    "--cache-columns",
    help="Download and cache column names for a project.",
    is_flag=True,
)
def main(project, mock, db, dump, table, cache_columns):
    """Gather workboard metrics from Phabricator"""
    console = Console(stderr=True)
    db_path = db

    table = [t for t in all_tables if t != "all"] if table == "all" else [table]

    if dump == "csv":
        for t in table:
            console.log(f"Dumping {t} as csv")
            res = subprocess.run(
                ["sqlite3", "--csv", "--header", db_path, f"SELECT * from {t}"]
            )
            sys.exit(res.returncode)

    phab = Conduit()

    # project_phid = "PHID-PROJ-q7wvv5i67p7tbg2kuret"
    project_phid = project
    column_keys = (
        "project",
        "phid",
        "name",
        "status",
        "proxyPHID",
        "dateCreated",
        "dateModified",
    )
    column_names = ",".join(column_keys)

    console.log(f"Opening db: {db_path}")
    con = sqlite_connect(db_path)
    with con:
        console.log("Creating db schema.")
        # sqlite db schema:

        con.executescript(
            f"""
            --sql
            CREATE TABLE IF NOT EXISTS column_metrics (trnsid, ts, project phid, column phid, task, type, value);
            --sql
            CREATE TABLE IF NOT EXISTS columns({column_names});
            --sql
            CREATE INDEX IF NOT EXISTS ts_column_value on column_metrics(column, task, ts, value);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS trnsid on column_metrics(ts, column, task, value);
            --sql
            CREATE TABLE IF NOT EXISTS task_metrics(task, metric phid, next_metric phid, ts, ts2, duration);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS task_metric ON task_metrics(task, metric);
            --sql
            CREATE TABLE IF NOT EXISTS events(ts, task, project phid, user phid, event, old, new);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS events_pk on events(ts, task, event);
            --sql
            CREATE VIEW IF NOT EXISTS
                view_column_metrics AS
            SELECT
                c.ts AS ts,
                p.name AS column_name,
                sum(c.value) OVER w AS task_count,
                printf('T%u',c.task) AS task,
                c.project AS project_phid,
                c.column AS column_phid,
                group_concat(
                    printf('T%u',c.task),
                    " "
                ) FILTER(WHERE c.value > 0) OVER w AS tasks
            FROM column_metrics c, phobjects p
            WHERE
                c.type = 'columns'
            AND c.column=p.phid
            WINDOW w AS ( PARTITION BY c.column ORDER BY c.ts, -c.value)
            ORDER BY
                c.column, c.ts;
        """
        )

    if cache_columns:
        console.log(f"Cache columns for project {project_phid}")

        placeholders = DataCache.placeholders(len(column_keys))
        cur = con.execute("select distinct(column) from column_metrics;")
        all_columns = [str(c[0]) for c in cur.fetchall()]

        r = phab.project_columns(column_phids=all_columns)
        r.fetch_all()
        data = r.data
        rows = [[str(col[key]) for key in column_keys] for col in data]
        # console.log(rows)
        cur = con.executemany(
            f"REPLACE INTO columns ({column_names}) values ({placeholders})", rows
        )
        con.commit()

    with console.status("[bold green]Processing...") as status:
        if mock:
            console.log(f"Running with mock data from [bold blue]{mock}")
            with io.open(mock) as jsonfile:
                transactions = json.load(jsonfile)
                transactions = transactions["result"]
        else:
            console.log(f"finding all tasks for the project [bold blue]{project_phid}")
            r = phab.request(
                "maniphest.project.task.transactions",
                {"project": project_phid},
            )
            transactions = r.result

        console.log("Processing task transactions.")
        # now collect all of the formatted transaction details

    sts = console.status("[bold green]Processing column_metrics...")
    with con, sts:

        datapoints = maptransactions(project_phid, transactions, con, console, phab)

        console.log("Inserting workboard column metrics")
        count = 0
        total = len(datapoints)
        for metric in datapoints:
            count += 1
            if count % 10 == 0:
                sts.update(f"[bold green]Inserting {count} of {total} data points.")
            con.execute(
                "REPLACE INTO column_metrics (trnsid, ts, project, column, task, type, value) VALUES (?, ?, ?, ?, ?, ?, ?)",
                metric,
            )
        console.log(f"Inserted [bold green]{count}[/bold green] column_metrics.")

    sts = console.status("[bold green]Processing task_metrics...")
    # and collect the task metrics
    metric_totals = [row for obj in metrics.values() for row in obj.all()]
    with con, sts:
        console.log(
            f"Inserting [bold green]{len(metric_totals)}[/bold green] task metrics"
        )

        con.executemany(
            "REPLACE INTO task_metrics (task, metric, ts, ts2, duration, next_metric) VALUES (?, ?, ?, ?, ?, ?)",
            metric_totals,
        )

    if dump:
        with con:
            console.log("Querying metrics")
            cur = con.execute(
                """--sql
                SELECT
                        c.name,
                        m.trnsid,
                        m.ts,
                        m.project,
                        m.column,
                        m.task,
                        m.type,
                        m.value
                    FROM column_metrics m
                    JOIN columns c ON m.`column`=c.phid
                    where m.project=? and m.column != m.project and m.value > 0
                    order by m.column, ts
            """,
                [project_phid],
            )
            column_metrics = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]

            cur = con.execute(
                """
                SELECT m.*, c.name from task_metrics m
                LEFT JOIN columns c on m.metric=c.phid
                """
            )
            task_metrics = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]

            cur = con.execute(
                """
                SELECT e.* FROM events e
                """
            )

            events = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]
            cache = DataCache(db)
            phobs = PHObject.resolve_phids(phab, cache)

            if dump in ("js", "json"):
                if dump == "js":
                    print("function metrics() { return ", end="")
                encoder = PHObjectEncoder()
                outstr = ""
                for output in encoder.iterencode(
                    {
                        "columns": column_metrics,
                        "tasks": task_metrics,
                        "events": events,
                        "phids": {key: val.data for key, val in phobs.items()},
                    }
                ):
                    outstr += output
                print(outstr, end="")
                if dump == "js":
                    print("; }")
                print("")
    con.close()


if __name__ == "__main__":
    main()
