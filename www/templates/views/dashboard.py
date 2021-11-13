
from datasette.app import Datasette
from datasette.database import Database
from datasette.utils.asgi import Request, Forbidden, NotFound, Response
import urllib.parse
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


async def init_context(datasette:Datasette, db:Database, request:Request, context):
    config = datasette.plugin_config("datasette-dashboards") or {}
    slug = urllib.parse.unquote(request.url_vars["slug"])
    try:
        dashboard = config[slug]
    except KeyError:
        raise NotFound(f"Dashboard not found: {slug}")

    dbs = set([chart["db"] for chart in dashboard["charts"].values() if "db" in chart])
    database: Database = None  # type: ignore
    for db in dbs:
        try:
            database = datasette.get_database(db)
        except KeyError:
            raise NotFound(f"Database does not exist: {db}")
        await check_permission_execute_sql(request, datasette, database)
    context['dashboard'] = dashboard
    context['slug'] = slug
    return context
