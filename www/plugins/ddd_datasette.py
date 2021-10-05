import ddd
from ddd.phab import Conduit
import inspect
from pprint import pprint
from typing import Dict, NewType, Type, TypeVar
from ddd.phobjects import PHID, PHIDRef, PHObject
from datasette import hookimpl
from importlib import import_module
from datasette.app import Datasette, Database

Query = NewType('Query', str)


class QueryListBase:
    _queries: dict
    _database: str

    def __init_subclass__(cls):
        cls._querylists = {}  # type: ignore


class QueryList(QueryListBase):

    _querylists: Dict[str, Type]

    def __init_subclass__(cls, database=None):
        if database is None:
            return None
        cls._database = database
        cls._queries = {
            key: val
            for (key, val) in inspect.getmembers(cls) if not key.startswith('_')
        }
        QueryList._querylists[database] = cls


class TrainQueryList(QueryList, database='train'):
    train_blockers_joined = Query(
        """--sql
        select
         s.tid,
         s.phid,
         s.metric,
         s.added, s.removed, s.count, p.*, group_concat(b.relid) as related
        from train_summary s
        left join train_props p on s.tid=p.tid
        left join train_blockers b on s.phid = b.phid and s.metric = b.metric
        where p.key='version' and p.value=:version
        group by s.phid, s.metric
        order by p.value desc;
        """
    )

    train_summary_for_version = Query(
        """--sql
        with v as (select tid from train_props p where p.key='version' and p.value=:version)
        select
         s.tid, s.phid, s.metric, s.added, s.removed, s.count
        from train_summary s
        where s.tid in (select tid from v);
        """
    )

    train_properties_for_version = Query(
        """--sql
        select tid, key, actor, value from train_props
        where tid in (select tid from train_props p where p.key='version' and p.value=:version)
        order by key,value desc;
        """
    )

    train_details_for_version = Query(
        """--sql
        SELECT relid FROM train_blockers
        WHERE metric=:metric AND phid IN (
            SELECT phid FROM train_props p
            WHERE p.key='version' AND p.value=:version
        );
        """
    )


class MetricsQueryList(QueryList, database='metrics'):
    column_events = Query(
        """--sql
        SELECT
            c.project_name,
            c.column_name       AS new_column,
            d.column_name       AS old_column,
            count(task)         AS count,
            date(ts, 'unixepoch', 'start of month') AS month,
            datetime(ts, 'unixepoch') AS timestamp,
            e.task,
            e.project,
            e.user,
            e.event,
            e.old,
            e.new
        FROM events e
        JOIN columns c ON e.new = c.column_phid
        JOIN columns d ON e.old = d.column_phid
        WHERE event = 'columns'
        GROUP BY
             old, new, month
        ORDER BY
             count desc
        LIMIT 50;
    """
    )

    columns_rollup = Query(
        """--sql
        SELECT
        date(ts, 'unixepoch', 'start of month') as month,
        count(distinct user) as people,
        count(distinct old) as source_count,
        count(*) as rows,
        group_concat(task, ', ') as tasks,
        group_concat(user, ', ') as users,
        group_concat(old, ', ') as sources,
        group_concat(new, ', ') as destinations,
        group_concat(datetime(ts, 'unixepoch'), ', ') as times
        FROM events
        WHERE event in ('columns', 'projects') and :project in (project, old, new)
        GROUP BY month
        ORDER BY ts;
    """
    )

    project_events = Query(
        """--sql
        SELECT
            date(ts, 'unixepoch', 'start of month') as month,
            count(distinct task) as tasks,
            count(distinct user) as people,
            count(distinct old) as sources,
            new as column
        FROM events
        WHERE event in ('columns', 'projects') and project=:project
        GROUP BY month,column ORDER BY month;
    """)

    projects_and_subprojects = Query(
        """--sql
       with phidtree as (
            SELECT
                phid
            FROM
                Project
            WHERE
                :project IN (phid, parent)
        )
        SELECT
            count(distinct task) as count,
            state,
            metric,
            p.name,
            w.date as week,
            date(t.ts2, 'unixepoch') as end_ts
        FROM
            task_metrics t left join Project p on t.metric=p.phid left join weeks w on w.date >= date(t.ts, 'unixepoch') and w.date <= date(t.ts2, 'unixepoch')

        WHERE metric IN (SELECT * FROM phidtree)

        GROUP BY state, metric, week
        order by end_ts;
    """)


@hookimpl
def extra_template_vars(datasette: Datasette):

    async def ddd(datasource, args=None):
        module = import_module(datasource)
        db = datasette.get_database('metrics')
        return await (module.run(db, args))

    async def train_stats(version):
        db = datasette.get_database('train')  # type: Database

        cur = await (
            db.execute(TrainQueryList.train_properties_for_version, {"version": version})
        )

        stats = {"participants": {}}

        for idx,key,actor,value in cur.rows:
            stats['task'] = f'T{idx}'
            if actor == '*':
                stats[key] = value
            else:
                if key not in stats:
                    stats[key] = {}
                stats[key][actor]=PHObject.instance(actor)
                if key in ('resolvers', 'unblockers', 'commenters'):
                    if actor in stats['participants']:
                        stats['participants'][actor] += int(value)
                    else:
                        stats['participants'][actor] = int(value)




        # pprint(stats)
        cur = await (
         db.execute(TrainQueryList.train_blockers_joined, {"version": version})
        )

        for row in cur.rows:
            stats[row['metric']] = (row['added'], row['removed'], row['count'])

        PHObject.resolve_phids(Conduit())
        pprint(stats)
        return stats

    async def instance(phid:PHID):
        if phid[0:2] == '["' and phid[-2:] == '"]':
            phid = phid[2:-2]
        return PHObject.instance(phid)

    return {"ddd": ddd, "train": train_stats, "PHObject": instance}


@hookimpl
def canned_queries(datasette: Datasette, database: str):
    if database in QueryList._querylists:
        return QueryList._querylists[database]._queries
    return None


@hookimpl
async def render_custom_dashboard_chart(chart_display):
    return "<h3>test <b>1</b> 2 3</h3>"


