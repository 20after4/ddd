
import urllib.parse
from collections import defaultdict
from pathlib import Path
import re
import yaml
from datasette.app import Datasette
from datasette.database import Database
from datasette.utils.asgi import Forbidden, NotFound, Request, Response
from ddd import console
from jinja2.utils import Markup


async def check_permission_instance(request, datasette):
    if (
        await datasette.permission_allowed(
            request.actor,
            "view-instance",
            default=None,
        )
    ) is False:
        raise Forbidden("view-instance denied")


async def check_permission_execute_sql(request, datasette, database):
    if (
        await datasette.permission_allowed(
            request.actor,
            "execute-sql",
            resource=database,
            default=None,
        )
    ) is False:
        raise Forbidden("execute-sql denied")

class DashboardTab(object):
    id:str
    label:str
    charts:dict

    def __init__(self, id:str, label=None):
        self.charts = {}
        self.id = id
        if label is None:
            self.label = id
        else:
            self.label = label

class DashboardLayout(object):
    config:dict
    tabs:dict

    def __init__(self,config:dict):
        self.config = config
        self.tabs = {}
        for id,label in self.config['tabs'].items():
            self.tab(id,label)

        for chartid, chart in self.config['charts'].items():
            tabid = chart.get('tab', 'default')
            if tabid == 'hidden':
                continue
            tab = self.tab(tabid)
            tab.charts[chartid] = chart


    def tab(self, id:str, label=None)->DashboardTab:
        tab = self.tabs.get(id, None)
        if (tab is None):
            tab = DashboardTab(id, label)
            self.tabs[id] = tab
        return tab

    def getTab(self, key:str):
        return self.tabs[key]

    def getChart(self, tabid:str, chartid:str):
        return self.tabs[tabid][chartid]

async def populate_chart_query(datasette, database, request, queries, chart):
    """
    Reference 'canned queries' by specifying a canned query name in the
    chart definition metadata.
    """
    if "query" in chart and chart["query"] in queries.keys():
        query = queries.get(chart["query"], None)
        if query:
            chart["query"] = query["sql"]



async def init_context(datasette:Datasette, db:Database, request:Request, context):
    config = datasette.plugin_config("datasette-dashboards") or {}
    slug = urllib.parse.unquote(request.url_vars["slug"])
    try:
        dashboard = config[slug]
    except KeyError:
        raise NotFound(f"Dashboard not found: {slug}")

    queries = await datasette.get_canned_queries(db.name, request.actor) # type: ignore
    pattern = re.compile(':([\w_]+)')
    for id,q in queries.items():
        params = {}
        for match in pattern.finditer(q['sql']):
            sql_param = match.group(1)
            params[sql_param] = True

        q['params'] = [k for k in params.keys()]
        console.log(q['params'])


    views_path:Path = context['views_path']
    charts_path:Path = views_path / 'charts'
    for chartfile in charts_path.glob("*.yaml"):
        with chartfile.open() as chart:
            try:
                chartdata = yaml.safe_load(chart)
            except yaml.YAMLError:
                raise Exception("Chart is not valid YAML")
            #await populate_chart_query(datasette, db, request, queries, chartdata)
            console.log(chartdata)
            filename = chartfile.stem + '.html'
            htmlfile = charts_path / filename
            if htmlfile.exists():
                chartdata['html'] = htmlfile.read_text()
            dashboard["charts"][chartfile.stem] = chartdata


    dbs = set([chart["db"] for chart in dashboard["charts"].values() if "db" in chart])
    database: Database = None  # type: ignore
    for db in dbs:
        try:
            database = datasette.get_database(db)
        except KeyError:
            raise NotFound(f"Database does not exist: {db}")
        await check_permission_execute_sql(request, datasette, database)

    context['dashboard'] = dashboard
    context['queries'] = queries
    context['layout'] = DashboardLayout(dashboard)
    context['slug'] = slug

    return context
