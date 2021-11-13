
from datasette.app import Datasette
from datasette.database import Database
from datasette.utils.asgi import Request


async def init_context(datasette:Datasette, db:Database, request:Request, context):
    return context