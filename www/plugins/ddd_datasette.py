import html
import inspect
import importlib.util
import datetime
from pathlib import Path
from pprint import pprint
from typing import Dict, Mapping, NewType, Type

from datasette.app import Datasette
from datasette.hookspecs import hookimpl
from datasette.utils import parse_metadata
from datasette.utils.asgi import Request, Response, NotFound
import urllib
import urllib.parse
from ddd import console

from ddd.phobjects import PHID
from jinja2 import Template
from jinja2.utils import Markup, escape

@hookimpl
def extra_css_urls():
    return [
        {
            "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
            "sri": "sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3",
        }
    ]


# @hookimpl
# def extra_js_urls(datasette):
#     return [
#         {
#             "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
#             "sri": "sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
#         }
#     ]

# @hookimpl
# def extra_body_script():
#  return {
#      "module": True,
#      "script": """import {projectSearcher} from '/static/build/autocomplete.js';
#       projectSearcher()"""
# }

class DashboardView:
    pass

class QueryView(DashboardView):
    pass

class InternalError(Exception):
    status = 500

_models = {}

async def ddd_view(datasette:Datasette, request, scope, send, receive):
    """
    Render a "view" template with variables supplied by evaluating a "model" python
    script. I guess that makes this the controller.
    """

    _models = {}
    page:str = request.url_vars["page"]
    views_path = Path(__file__).parent.parent / "templates" / "views"
    if page not in _models:
        model_page = page + '.py'
        model_file = views_path / model_page

        if model_file.absolute().exists():
            # import the model module
            spec = importlib.util.spec_from_file_location("module.name", model_file.absolute())
            if (spec):
                try:
                    model_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(model_module) # type: ignore
                    model_module.__name__ = f'ddd.model.{page}'
                    _models[page] = model_module
                except Exception as e:
                    raise InternalError(e)

    if page not in _models:
        raise NotFound()

    db = datasette.get_database('metrics')
    context = {
        "base_url": datasette.urls.path('/'),
        "views_path": views_path,
        "console": console,
        "request": request,
        **request.url_vars
    }
    # augment the context with data from the model
    context = await _models[page].init_context( #type: ignore
        datasette,
        db,
        request,
        context=context)
    if ('template_name' in context):
        template_name = context['template_name']
    else:
        template_name = f"views/{page}.html"
    console.log('template name: ',template_name)
    try:
        output = await datasette.render_template(template_name, context, request, page)
        return Response.html(output)
    except Exception as e:
        raise NotFound(e)


@hookimpl
def register_routes():
    """return a list of routes, e.g.
    [ (path_regex, callback), ]
    """

    def r(*parts, prefix='^/-/'):
        """Compose a route entry from several path fragments"""
        return prefix + "/".join(parts) + "/?$"
    def v(name):
        """Compose regex fragment that captures one path level as a named variable"""
        return f"(?P<{name}>[a-zA-Z0-9\\-]+)"
    def optional(part):
        """Mark a path segment as optional by wrapping it with ()?"""
        return f"?({part})?"

    return [
         (r('ddd', v('page'), optional(v('slug'))), ddd_view)
    ]


def A(href, label, target=None):
    if target:
        target = f' target="{target}"'
    return Markup(
        '<a class="phid" title="{label}" href="{href}"{target}>{label}</a>'.format(
            href=escape(href), label=escape(label or "") or "&nbsp;",
            target=target
        )
    )

def getoneof(somedict, listofkeys, default=""):
    for i in listofkeys:
        if i in somedict:
            return somedict[i]
    return default

def dashboard_link(object):
    uri = getoneof(object, ['uri','url','href'], "")
    return A(href=uri, label=object['name'])

def build_url(params):
    return urllib.parse.urlencode(params)

# @hookimpl
# def menu_links(datasette, actor):
#     if actor and actor.get("id") == "root":
#         return [
#             {"href": datasette.urls.path("/-/edit-schema"), "label": "Edit schema"},
#         ]


@hookimpl
def extra_template_vars(template:str, database:str, table:str, columns:str, view_name:str, request:Request, datasette:Datasette):
    queries = canned_queries(datasette, database)

    async def execute_sql(sql, args=None, database=None):
        db = datasette.get_database(database)
        if sql in queries:
            sql = queries[sql]
        return (await db.execute(sql, args)).rows

    def icon(name, size=24):
        return Markup(f'<svg class="icon{size}" style="width:{size};height:{size}"><use xlink:href="{datasette.urls.path("/static/icons.svg")}#icon-{name}"></svg>')

    return {
        "sql": execute_sql,
        "timestamp": datetime.datetime.fromtimestamp,
        "tsdate": datetime.date.fromtimestamp,
        "dashboard_link": dashboard_link,
        "icon": icon,
        "build_url": build_url
    }


# def magic_phid(key, request):
#     return 'mmodell'


# @hookimpl
# def register_magic_parameters(datasette):
#     return [
#         ("phid", magic_phid),
#     ]


@hookimpl
def canned_queries(datasette: Datasette, database: str) -> Mapping[str, str]:
    # load "canned queries" from the filesystem under
    #  www/sql/db/query_name.sql
    queries = {}

    sqldir = Path(__file__).parent.parent / "sql"
    if database:
        sqldir = sqldir / database

    if not sqldir.is_dir():
        return queries

    for f in sqldir.glob('*.sql'):
        try:
            sql = f.read_text('utf8').strip()
            if not len(sql):
                log(f"Skipping empty canned query file: {f}")
                continue
            queries[f.stem] = { "sql": sql }
        except OSError as err:
            log(err)

    return queries


Query = NewType('Query', str)


def log(err):
    console.log(err)


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
            old as source,
            new as column
        FROM events
        WHERE event in ('columns', 'projects') and project=:project
        GROUP BY month,column,source ORDER BY month;
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

