#!/usr/bin/python3

import io
import json
import pathlib
import sqlite3
import subprocess
import sys
from datetime import datetime, timedelta
from pprint import pprint
from sqlite3 import Connection
from typing import Iterable, Optional, Sized

import click
from rich.console import Console
from ddd import console
import typer
from rich.status import Status
from sqlite_utils.db import Database, chunks
from typer import Option, Typer

from ddd.boardmetrics_mapper import maptransactions
from ddd.boardmetrics_schema import Config, config
from ddd.phab import Conduit
from ddd.phobjects import PHID, DataCache, PHObject, PHObjectEncoder, Project, init_caches

thisdir = pathlib.Path(__file__).parent
mock_default = thisdir / ".." / "test" / "transactions.json"
all_tables = ["columns", "events", "column_metrics", "task_metrics", "phobjects", "all"]


cli = Typer(callback=config, no_args_is_help=True, invoke_without_command=True)


def cache_tasks(conduit:Conduit, cache:DataCache, tasks:list, sts):
    ids =  ', '.join(tasks)
    with cache.con as db:
        rows = db.execute(f'select id from Task where id in ({ids})')
        already_cached_ids = set([row[0] for row in rows])
        uncached_ids = set(tasks) - already_cached_ids

        r = conduit.maniphest_search(constraints={"ids": uncached_ids})
        r.fetch_all(sts)

    new_instances = []
    for task in r.data:
        task.save()
        # instance = PHObject.instance(phid=PHID(key), data=vals, save=True)
        # new_instances.append(instance)

    # cache.store_all(r.data)


def cache_projects(conduit: Conduit, cache, sts, project):

    def store_projects(r):
        r.fetch_all(sts)

        for p in r.data:
            # console.log(p.data)
            p.save()

        cache.store_all(r.data)

    if project == 'all':
        r = conduit.project_search(constraints={"maxDepth": 2})
        store_projects(r)
    else:
        if not isinstance(project, list):
            r = conduit.project_search(constraints={"ancestors": [project]})
            store_projects(r)
            project = [project]
        r = conduit.project_search(constraints={"phids": project})
        store_projects(r)




@cli.command()
def cache_columns(ctx: typer.Context, project: str = Option("all")):
    """
    Download data about columns from Phabricator and cache it locally.
    Do this once to avoid making dozens of api requests when mapping
    transactions to metrics.
    """
    config = ctx.meta["config"]  # type: Config
    PHObject.db = config.db
    config.console.log("Fetching workboard column details from phabricator.")
    if project == "all":
        r = config.phab.project_columns()
    else:
        r = config.phab.project_columns(project=PHID(project))
    count = 0
    with config.console.status("[bold green]Fetching more pages...") as sts:
        r.fetch_all(sts)

    proxy_phids = []

    with config.console.status(
        "[bold green]Saving to sqlite..."
    ) as sts, config.db.conn as conn:
        total = len(r.data)
        pct = 0
        for col in r.data:
            count += 1
            col.save()
            if col['proxyPHID']:
                proxy_phids.append(col['proxyPHID'])
            # col.project.save()
            if round((count / total) * 100) > pct:
                pct = round((count / total) * 100)
                sts.update(
                    f"Saved [bold green]{count}[/bold green] ([bold blue]{pct}%[/bold blue]) Project Columns."
                )

    config.console.log(f"Fetched & cached {count} Project Columns.")
    config.db.conn.commit()
    config.console.log("Updating phobjects cache.")
    _, cache = init_caches(config.db, config.phab)
    PHObject.resolve_phids(config.phab, cache)

    with config.console.status("[bold green]Fetching projects") as sts:
        cache_projects(config.phab, cache, sts, project)
        cache_projects(config.phab, cache, sts, proxy_phids)



@cli.command()
def map(
    ctx: typer.Context,
    project: str = Option(None),
    task_ids: Optional[str] = Option(None),
    mock: Optional[str] = Option(None),
    cache_objects: Optional[bool] = Option(False),
    linear: Optional[bool] = Option(False),
    after: Optional[int] = Option(0),
    pages: Optional[int] = Option(1),
):
    """Gather workboard metrics from Phabricator"""
    config = ctx.meta["config"]  # type: Config
    phab = config.phab
    db = config.db  # type: Database
    db_path = config.db_path
    console = config.console
    project_phid = project

    all_projects:set[Project]

    try:
        kvcache, cache = init_caches(db, phab)
    except sqlite3.OperationalError as err:
        console.print_exception()
        console.log("Your metrics.db appears to be missing some tables.")
        console.log("If this is the first run with a new database, then")
        console.log("you need to run [bold]dddcli metrics cache-columns[/bold] first.")
        raise typer.Exit(1)

    with console.status("[bold green]Fetching input...") as status:
        if mock:
            console.log(f"Running with mock data from [bold blue]{mock}[/bold blue]")
            with io.open(mock) as jsonfile:
                transactions = json.load(jsonfile)
                transactions = transactions["result"]
        elif linear:
            task_ids = []
            arg={
                "queryKey":"all",
                "order": ['id'],
                "attachments": {
                    "projects": True
                },
                "limit":100
            }
            if after:
                arg['after'] = after
            r = phab.request("maniphest.search", arg
            )
            if pages and pages > 1:
                for i in range(pages):
                    console.log("Fetching next page", r.cursor)
                    r.next_page()

            for task in r.data:
                task_ids.append(task.id)
                task.save()

        if not project_phid and not task_ids:
            console.log("Either A project phid or a list of tasks are required.")
            return False

        console.log(
            f"Fetching tasks and transactions for the project [bold blue]{project_phid}[bold blue]"
        )

        if project_phid:
            arg = {"project": project_phid, "task_ids": task_ids}
            arg = {k: arg[k] for k in ("project", "task_ids") if arg[k] is not None}

            r = phab.request(
                "maniphest.project.task.transactions",
                arg,
            )
        else:
            r = phab.request(
                "maniphest.gettasktransactions",
                {"ids": task_ids},
            )

        transactions = r.result

    # now collect all of the formatted transaction details
    with db.conn as conn, console.status(
        "Processing  [bold blue]transactions[/bold blue]..."
    ) as sts:
        conn  # type: Connection
        datapoints, all_projects, all_metrics, taskids = maptransactions(
            project_phid, transactions, conn, console, phab, sts, kvcache
        )

    load_data_with_progress(
        db.conn,
        console,
        "column_metrics",
        "REPLACE INTO column_metrics (trnsid, ts, project, column, task, type, value) VALUES (?, ?, ?, ?, ?, ?, ?)",
        datapoints,
    )

    with console.status("[bold green]Processing task_metrics...") as sts:
        task_metric_rows = []
        for metric in all_metrics:
            #if metric.last:
            #    metric.end(datetime.now().timestamp())
            last_ended_at = None
            for span in metric.spans:
                if last_ended_at and last_ended_at >= span.start:
                    span.start = last_ended_at + timedelta(seconds=1)

                if not span.end or span.end == 0 or span.end <= span.start:
                    span.end = span.start + timedelta(seconds=1)
                row = (
                    metric.task,
                    metric.value,
                    span.state,
                    span.start,
                    span.end,
                    span.duration(),
                )
                last_ended_at = span.end
                task_metric_rows.append(row)

    load_data_with_progress(
        db.conn,
        console,
        "task_metrics",
        "REPLACE INTO task_metrics (task, metric, state, ts, ts2, duration) VALUES (?, ?, ?, ?, ?, ?)",
        task_metric_rows,
    )

    # for proj in all_projects:
    #     console.log(proj)
    #     for metric in proj.all_metrics().values():
    #         console.log(metric)

    with console.status("Updating [bold]phobjects[/bold].") as sts:
        if not linear:
            cache_tasks(config.phab, cache, taskids, sts)
        PHObject.resolve_phids(config.phab, cache)
    console.log("Updated phobjects. All done!")


def load_data_with_progress(
    conn: Connection,
    console: Console,
    table_name,
    sql: str,
    rows: Iterable,
    chunksize=100,
):
    sts = console.status(
        f"Inserting/updating sqlite table [bold blue]{table_name}[/bold blue]"
    )
    with conn, sts:
        count = 0
        try:
            total = len(rows)  # type: ignore
        except:
            total = 0
        for chunk in chunks(rows, chunksize):
            cursor = conn.executemany(sql, chunk)
            count += cursor.rowcount
            sts.update(
                f"Updating [bold green]({count}/{total})[/bold green] {table_name}"
            )
        console.log(
            f"Inserted [bold green]{count}/[/bold green] into {table_name} rows."
        )


@cli.command()
def dump(
    ctx: typer.Context,
    format: str = Option("csv", help="Format to export. [csv, json or js]"),
    table=Option(
        "all", help="With format=csv: Dump raw table (or 'all' for all tables)"
    ),
    project: Optional[str] = Option(
        None, help="Limits the dump to column metrics for a given project."
    ),
):
    """
    Dump data from sqlite to csv or json.
    """
    config = ctx.meta["config"]
    console = config.console
    phab = config.phab
    db_path = config.db_path
    db = config.db
    kvcache, cache = init_caches(db, phab)

    table = [t for t in all_tables if t != "all"] if table == "all" else [table]

    if format == "csv":
        for t in table:
            console.log(f"Dumping {t} as csv")
            res = subprocess.run(
                ["sqlite3", "--csv", "--header", db_path, f"SELECT * from {t}"]
            )
            sys.exit(res.returncode)
    elif format not in ("js", "json"):
        console.log(f'Invalid format: {format}. Must be one of "csv", "js" or "json"')
        sys.exit(1)

    console.log("[bold green]Dumping metrics...")
    with db.conn as conn:
        conn  # type: Connection
        cur = conn.execute(
            """--sql
            SELECT
                c.column_name,
                m.trnsid,
                m.ts,
                m.project,
                m.column,
                m.task,
                m.type,
                m.value
            FROM column_metrics m
            JOIN columns c ON m.`column`=c.column_phid
            where m.project=? and m.column != m.project and m.value > 0
            order by m.column, ts;
        """,
            [project],
        )
        column_metrics = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]

        cur = db.conn.execute(
            """
            SELECT m.*, c.column_name from task_metrics m
            LEFT JOIN columns c on m.metric=c.column_phid
            """
        )
        task_metrics = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]

        cur = db.conn.execute(
            """
            SELECT e.* FROM events e
            """
        )

        events = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]
        period_modifier = "weekday 0"

        cur = db.conn.execute(
            f"""--sql
            select datetime(ts, 'unixepoch') as dt,
                column_name as col,
                column_hidden as col_hidden,
                project,
                first_value(task_count) over w as start_of_period,
                min(task_count) over w as min_tasks ,
                avg(task_count) over w as avg_tasks ,
                max(task_count) over w as max_tasks ,
                last_value(task_count) over w as end_of_period,
                date(ts,'unixepoch', '{period_modifier}') as period
            from view_column_metrics
            group by col,period
            WINDOW w AS ( PARTITION BY column_name order by date(ts,'unixepoch', '{period_modifier}'))
            order by ts, column_name;
            """,
        )
        column_summary = [{k: row[k] for k in row.keys()} for row in cur.fetchall()]

        phobs = PHObject.resolve_phids(phab, cache)

        if format == "js":
            print("function metrics() { return ", end="")
        encoder = PHObjectEncoder()
        outstr = ""
        for output in encoder.iterencode(
            {
                "columns": column_metrics,
                "tasks": task_metrics,
                "events": events,
                "phids": {key: val.data for key, val in phobs.items()},
                "column_summary": column_summary,
            }
        ):
            outstr += output
        print(outstr, end="")
        if format == "js":
            print("; }")
        print("")


def main():
    cli()
    # typer.run(map)


if __name__ == "__main__":
    main()
