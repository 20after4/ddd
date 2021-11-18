from dataclasses import dataclass, field
import sqlite3
from ddd.phobjects import sqlite_connect
from pathlib import Path
from typing import Callable, Optional, Union
from rich.console import Console
from typer.params import Option
from typer.models import Context
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
            CREATE TABLE IF NOT EXISTS task_metrics(task int, metric phid, state, ts datetime, ts2 datetime, duration seconds);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS task_metric ON task_metrics(ts, task, metric, state);
            --sql
            CREATE INDEX IF NOT EXISTS task_metrics_ts on task_metrics(ts, ts2)
            --sql
            CREATE INDEX IF NOT EXISTS task_metrics_metric on task_metrics(task, metric);
            --sql
            CREATE INDEX IF NOT EXISTS task_metrics_metric_state ON task_metrics(metric, state) WHERE state='tagged'
            --sql
            CREATE TABLE IF NOT EXISTS events(ts datetime, task int, project phid, user phid, event, old text, new text);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS events_pk on events(ts, task, project, event, old, new);
            --sql
            CREATE INDEX IF NOT EXISTS events_project on events(project, event);
            --sql
            CREATE INDEX IF NOT EXISTS events_task on events(task, new);
            --sql
            CREATE INDEX IF NOT EXISTS events_event on events(event, task);
            --sql
            CREATE INDEX IF NOT EXISTS events_new on events(event, new);
            --sql
            CREATE INDEX IF NOT EXISTS events_user on events(user, event);
            --sql
            CREATE INDEX IF NOT EXISTS events_ts on events(ts);
            --sql
            CREATE TABLE IF NOT EXISTS Project (
            name TEXT,
            status TEXT,
            phid TEXT PRIMARY KEY,
            dateCreated DATETIME,
            dateModified DATETIME,
            id INTEGER,
            uri TEXT,
            typeName TEXT,
            type TEXT,
            fullName TEXT,
            slug TEXT,
            subtype TEXT,
            milestone TEXT,
            depth INTEGER,
            parent phid,
            icon TEXT,
            color TEXT,
            spacePHID phid,
            policy TEXT,
            description TEXT,
            [custom.custom:repository] TEXT,
            [custom.sprint:start] TEXT,
            [custom.sprint:end] TEXT,
            [attachments] TEXT
            );
            --sql
            CREATE INDEX IF NOT EXISTS Project_hasparent on Project(parent) where parent is not null;
            --sql
            CREATE INDEX IF NOT EXISTS Project_isopen on Project(status) where status='open';
            --sql
            CREATE INDEX IF NOT EXISTS Project_phid_parent on Project(phid, status) where status='open';
            --sql
            CREATE INDEX IF NOT EXISTS Project_parent_status on Project(parent, status);
            --sql
            CREATE INDEX IF NOT EXISTS Project_root on Project(parent, status) where parent is null and status='open';
            --sql
            CREATE TABLE IF NOT EXISTS ProjectColumn (
                name TEXT,
                status TEXT,
                phid TEXT PRIMARY KEY,
                dateCreated DATETIME,
                dateModified DATETIME,
                proxyPHID phid,
                project phid,
                isDefaultColumn INTEGER,
                policy TEXT,
                id INTEGER,
                type TEXT,
                attachments TEXT
                );
            --sql
            CREATE INDEX IF NOT EXISTS ProjectColumn_status on ProjectColumn(status);
            --sql
            CREATE INDEX IF NOT EXISTS ProjectColumn_project on ProjectColumn(project);
            --sql
            CREATE INDEX IF NOT EXISTS ProjectColumn_proxyPHID on ProjectColumn(proxyPHID) where proxyPHID is not null;
            --sql
            CREATE INDEX IF NOT EXISTS ProjectColumn_isDefaultColumn on ProjectColumn(isDefaultColumn) where isDefaultColumn=1;
            --sql
            CREATE TABLE IF NOT EXISTS [columns] (
                [project_name] TEXT,
                [column_name] TEXT,
                [project_phid] TEXT,
                [column_phid] TEXT PRIMARY KEY,
                [status] TEXT,
                [proxyPHID] TEXT,
                [dateCreated] TEXT,
                [dateModified] TEXT,
                [is_default] TEXT
            );
            --sql
            CREATE INDEX IF NOT EXISTS columns_project on columns(project_phid, proxyPHID) where proxyPHID is not null
            --sql
            CREATE TABLE IF NOT EXISTS [Task] (
                [name] TEXT,
                [status] TEXT,
                [phid] TEXT PRIMARY KEY,
                [dateCreated] INTEGER,
                [dateModified] INTEGER,
                [description] TEXT,
                [authorPHID] TEXT,
                [ownerPHID] TEXT,
                [priority] TEXT,
                [points] TEXT,
                [subtype] TEXT,
                [closerPHID] TEXT,
                [dateClosed] INTEGER,
                [spacePHID] TEXT,
                [policy] TEXT,
                [custom.deadline.due] TEXT,
                [custom.train.status] TEXT,
                [custom.train.backup] TEXT,
                [custom.external_reference] TEXT,
                [custom.release.version] TEXT,
                [custom.release.date] TEXT,
                [custom.security_topic] TEXT,
                [custom.risk.summary] TEXT,
                [custom.risk.impacted] TEXT,
                [custom.risk.rating] TEXT,
                [custom.requestor.affiliation] TEXT,
                [custom.error.reqid] TEXT,
                [custom.error.stack] TEXT,
                [custom.error.url] TEXT,
                [custom.error.id] TEXT,
                [custom.points.final] TEXT,
                [custom.deadline.start] TEXT,
                [id] INTEGER,
                [type] TEXT,
                [attachments] TEXT
            );
            --sql
            CREATE INDEX IF NOT EXISTS task_id on Task(id);
            --sql
            CREATE INDEX IF NOT EXISTS task_phid on Task(phid);
            --sql
            CREATE INDEX IF NOT EXISTS task_owner on Task(ownerPHID);
            --sql
            CREATE INDEX IF NOT EXISTS task_author on Task(authorPHID);
            --sql
            CREATE INDEX IF NOT EXISTS task_closer on Task(closerPHID);
            --sql
            CREATE INDEX IF NOT EXISTS task_closed on Task(dateClosed);
            --sql
            CREATE INDEX IF NOT EXISTS task_created on Task(dateCreated);
            --sql
            DROP VIEW IF EXISTS view_task_cycletime;
            --sql
            CREATE VIEW IF NOT EXISTS
                view_task_cycletime
            AS
            SELECT
                task,
                min(start_date) AS start,
                max(start_date) AS end,
                (max(ts) - min(ts))/3600 AS hours,
                (max(ts) - min(ts))/86400 AS days
            FROM (
                SELECT
                    task,
                    ts,
                    datetime(ts, 'unixepoch') AS start_date
                FROM
                    task_metrics
                WHERE
                    metric IN ('startofwork', 'endofwork')
                ORDER BY
                    task, metric=='startofwork' DESC
                )
            GROUP BY task;
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
                    VALUES(date('now', 'weekday 0', '-1095 days'))
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
                COALESCE(w.date, DATE(t.ts, 'unixepoch', 'weekday 0')) AS weekdate
            FROM task_metrics t
            LEFT JOIN days w ON w.date > t.ts AND w.date < t.ts2;

            --sql
            DROP VIEW IF EXISTS task_metrics_summary;
            --sql
            CREATE VIEW IF NOT EXISTS
                task_metrics_summary AS
            SELECT
                task,
                COUNT(*) as transactions,
                DATETIME(MIN(ts), 'unixepoch') AS first_ts,
                DATETIME(MAX(ts2), 'unixepoch') AS last_ts,
                SUM(duration)/(60*60) AS duration_in_hours,
                SUM(duration)/(60*60*24) AS duration_in_days
            FROM task_metrics
            GROUP by task, metric;

            --sql
            DROP VIEW IF EXISTS project_tasks_per_week;
            --sql
            CREATE VIEW IF NOT EXISTS
                project_tasks_per_week AS
            SELECT
                 COUNT(task) AS task,
                 metric, p.name AS project_name,
                 DATE(ts, 'unixepoch', 'weekday 1') AS week,
                 SUM(duration) AS duration
            FROM
                task_metrics m
            JOIN
                Project p
            ON m.metric=p.phid
            GROUP BY metric, week
            ORDER BY week;
            --sql
            DROP VIEW IF EXISTS `enabled_columns_and_milestones`;
            --sql
            CREATE VIEW IF NOT EXISTS
                enabled_columns_and_milestones AS
            SELECT
                c.name,
                c.project AS project,
                c.phid AS phid,
                c.proxyPHID AS milestone_phid,
                p.uri AS milestone_uri
            FROM ProjectColumn c
            LEFT JOIN
             Project p
                ON c.proxyPHID = p.phid
                AND p.status != 'closed'
            WHERE
              CAST(c.status as int) = 0;
            --sql
            CREATE VIEW IF NOT EXISTS ActiveProjectsView AS WITH RECURSIVE pp(phid, name, path, root) AS
            (
                SELECT
                phid,name,name AS path, phid AS root
                FROM
                Project
                WHERE
                parent IS NULL AND status='open'
                UNION ALL
                SELECT
                Project.phid,
                Project.name AS name,
                pp.path||':'||Project.name AS path,
                pp.root AS root
                FROM Project
                JOIN pp ON Project.parent = pp.phid AND status='open'
            )
            SELECT
                pp.path AS path,
                pp.root AS root,
                Project.fullName AS label,
                Project.name AS name,
                Project.phid AS key,
                Project.phid AS phid,
                Project.parent AS parent,
                Project.uri AS href,
                Project.depth AS depth,
                Project.slug AS slug
            FROM
                Project
            JOIN
                pp
            ON
                Project.phid=pp.phid AND status='open'
            ORDER BY
                path;
            --sql
            DROP TABLE IF EXISTS `ActiveProjectsCache`;
            --sql
            CREATE TABLE IF NOT EXISTS ActiveProjectsCache AS SELECT * FROM `ActiveProjectsView`;
            --sql
            CREATE INDEX IF NOT EXISTS ActiveProjects_root on ActiveProjectsCache(root);
            --sql
            CREATE UNIQUE INDEX IF NOT EXISTS ActiveProjects_phid on ActiveProjectsCache(phid);
            --sql
            CREATE INDEX IF NOT EXISTS ActiveProjects_parent on ActiveProjectsCache(parent);
            --sql
            analyze;
        """
        BoolStr = Union[bool,str]
        OptionalStr = Optional[str]
        def RecreateSQL(what:Callable, name:str, ON:OptionalStr=None, AS:OptionalStr=None, UNIQUE:BoolStr=""):
            nonlocal db
            ON = f"ON {ON} " if ON else ""
            AS = f"AS {AS} " if AS else ""
            sql = f"""
                    DROP {what()} IF EXISTS {name};
                    CREATE {what(withQualifiers=True)} {name} {ON}{AS};
                    """
            sql = [line.strip() + ";" for line in sql.split(";")]
            sql = "\n".join(sql)
            sql.splitlines()
            try:
                self.console.log(sql)
                db.executescript(sql)
            except Exception as e:
                self.console.log(f"Error executing sql: {e}", "This is the SQL that failed: {sql}")
                raise

        def ON(sql) -> str:
            return f"ON {sql}"

        def AS(sql) -> str:
            return f"AS {sql}"

        def WHAT(what:str, unique=False) -> Callable:
            qualifiers = "UNIQUE " if unique else ""
            def index(withQualifiers=False) -> str:
                nonlocal qualifiers
                qualifiers = qualifiers if withQualifiers else ""
                return f"{qualifiers}{what}"
            return index

        def TABLE(unique=False) -> Callable:
            return WHAT("TABLE", unique)

        def INDEX(unique=False) -> Callable:
            return WHAT("INDEX", unique)

        try:
            schemas = schema.split('--sql')
            for schema in schemas:
                db.executescript(schema)
        except Exception:
            self.console.log("IntegrityError while initializing database schema.")
            self.console.log("Schema section that failed: ", schema)
            raise

        RecreateSQL(TABLE(), "ActiveProjectsCache", AS="SELECT * FROM `ActiveProjectsView`")
        RecreateSQL(INDEX(), "ActiveProjects_root", ON="ActiveProjectsCache(root)")
        RecreateSQL(INDEX(unique=True), "ActiveProjects_phid", ON="ActiveProjectsCache(phid)")
        RecreateSQL(INDEX(), "ActiveProjects_parent", ON="ActiveProjectsCache(parent)")


def config(
    ctx: Context,
    db: Optional[Path] = Option(Path("./metrics.db"), envvar="DDD_DB"),
):
    ctx.meta["config"] = Config(Conduit(), db)
