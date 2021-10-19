from dataclasses import dataclass, field
import sqlite3
from ddd.phobjects import sqlite_connect
from pathlib import Path
from typing import Optional
from rich.console import Console
from typer import Option, Context
from ddd.phab import Conduit

from sqlite_utils.db import Database


@dataclass
class Config:
    phab: Conduit = field(init=True)
    db_path: Optional[Path] = field(init=True)
    db: Database = field(init=False, repr=False)
    console: Console = field(init=False, repr=False)

    def __post_init__(self):
        self.console = Console(stderr=True)
        __builtins__["console"] = self.console
        path = self.db_path if isinstance(self.db_path, Path) else Path("./metrics.db")
        con = sqlite_connect(str(path.resolve()))

        self.db = Database(con)
        self.create_sql_schema()

    def create_sql_schema(self):
        db = self.db
        # sqlite db schema:
        self.console.log(f"Creating db schema in {self.db_path}")
        schema = f"""
            --sql
            CREATE TABLE IF NOT EXISTS column_metrics (trnsid, ts, project phid, column phid, task, type, value);
            --sql
            CREATE INDEX IF NOT EXISTS column_ts on column_metrics(column, ts);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS ts_column_task on column_metrics(ts, column, task);
            --sql
            CREATE TABLE IF NOT EXISTS task_metrics(task, metric phid, state, ts datetime, ts2 datetime, duration seconds);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS task_metric ON task_metrics(task, metric, state, ts);
            --sql
            CREATE TABLE IF NOT EXISTS events(ts, task, project phid, user phid, event, old, new);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS events_pk on events(ts, task, project, event, old, new);
            --sql
            CREATE INDEX IF NOT EXISTS events_project on events(event, project, old, new);
            --sql
            DROP VIEW IF EXISTS view_column_metrics;
            --sql
            CREATE VIEW IF NOT EXISTS
                view_column_metrics AS
            SELECT
                printf('T%u',c.task) AS task,
                c.ts AS ts,
                datetime(c.ts, 'unixepoch', 'start of month') as month_start,
                datetime(c.ts, 'unixepoch', 'weekday 1', 'start of day', '-7 days') as week_start,
                p.column_phid as column_phid,
                p.column_name AS column_name,
                p.project_phid as project_phid,
                p.project_name as project_name,
                p.status as column_hidden,
                sum(c.value) OVER w AS task_count,
                c.value as value

            FROM column_metrics c, columns p
            WHERE
                c.column=p.column_phid
            WINDOW w AS ( PARTITION BY c.column ORDER BY c.ts, -c.value)
            ORDER BY
                c.column, c.ts;

            --sql
            DROP VIEW IF EXISTS months;
            --sql
            CREATE VIEW IF NOT EXISTS
                months AS
                WITH RECURSIVE dates(date) AS (
                    VALUES(date('now', 'start of month', '-48 months'))
                    UNION ALL
                    SELECT date(date, '+1 month')
                    FROM dates
                    WHERE date <= date('now')
                )
                SELECT date FROM dates;

            --sql
            DROP VIEW IF EXISTS weeks;
            --sql
            CREATE VIEW IF NOT EXISTS
                weeks AS
                WITH RECURSIVE dates(date) AS (
                    VALUES(date('now', 'weekday 1', '-1344 days'))
                    UNION ALL
                    SELECT date(date, '+7 days')
                    FROM dates
                    WHERE date <= date('now')
                )
                SELECT date FROM dates;
            --sql
            DROP VIEW IF EXISTS days;
            --sql
            CREATE VIEW IF NOT EXISTS
                days AS
                WITH RECURSIVE dates(date) AS (
                    VALUES(date('now', '-365 days'))
                    UNION ALL
                    SELECT date(date, '+1 days')
                    FROM dates
                    WHERE date <= date('now')
                )
                SELECT date FROM dates;
            --sql
            DROP VIEW IF EXISTS task_project_weeks;
            --sql
            CREATE VIEW IF NOT EXISTS
                task_project_weeks AS
            SELECT
                t.task,
                t.metric,
                t.state,
                coalesce(w.date, date(t.ts, 'unixepoch', 'weekday 1')) as weekdate
            FROM task_metrics t
            LEFT JOIN days w ON w.date > t.ts AND w.date < t.ts2;

            --sql
            DROP VIEW IF EXISTS task_metrics_summary;
            --sql
            CREATE VIEW IF NOT EXISTS
                task_metrics_summary AS
            SELECT
                task,
                count(*) as transactions,
                datetime(min(ts), 'unixepoch') as first_ts,
                datetime(max(ts2), 'unixepoch') as last_ts,
                sum(duration)/(60*60) as duration_in_hours,
                sum(duration)/(60*60*24) as duration_in_days
            FROM task_metrics
            GROUP by task, metric;

            --sql
            DROP VIEW IF EXISTS project_tasks_per_week;
            --sql
            CREATE VIEW IF NOT EXISTS
                project_tasks_per_week AS
            SELECT
                 count(task) AS task,
                 metric, p.name as project_name,
                 date(ts, 'unixepoch', 'weekday 1') as week,
                 sum(duration) as duration
            FROM
                task_metrics m
            JOIN
                Project p
            ON m.metric=p.phid
            GROUP BY metric, week
            ORDER BY week;

        """
        try:
            db.executescript(schema)
        except sqlite3.IntegrityError:
            self.console.log("IntegrityError while initializing database schema.")
            raise


def config(
    ctx: Context,
    db: Optional[Path] = Option(Path("./metrics.db"), envvar="DDD_DB"),
):
    ctx.meta["config"] = Config(Conduit(), db)
