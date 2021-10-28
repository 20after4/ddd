"""
This type stub file was generated by pyright.
"""

from datasette.database import Database, Results
from .utils.asgi import NotFound

app_root = ...
SQLITE_LIMIT_ATTACHED = ...
Setting = ...
SETTINGS = ...
DEFAULT_SETTINGS = ...
async def favicon(request, send): # -> None:
    ...

class Datasette:
    INFO = ...
    WARNING = ...
    ERROR = ...
    def __init__(self, files, immutables=..., cache_headers=..., cors=..., inspect_data=..., metadata=..., sqlite_extensions=..., template_dir=..., plugins_dir=..., static_mounts=..., memory=..., config=..., secret=..., version_note=..., config_dir=..., pdb=..., crossdb=...) -> None:
        ...

    async def refresh_schemas(self): # -> None:
        ...

    @property
    def urls(self): # -> Urls:
        ...

    async def invoke_startup(self): # -> None:
        ...

    def sign(self, value, namespace=...): # -> _t_str_bytes:
        ...

    def unsign(self, signed, namespace=...): # -> Any:
        ...

    def get_database(self, name=...) -> Database:
        ...

    def add_database(self, db, name=...):
        ...

    def add_memory_database(self, memory_name) -> Database:
        ...

    def remove_database(self, name): # -> None:
        ...

    def setting(self, key): # -> Any | None:
        ...

    def config_dict(self): # -> dict[Any, Any | None]:
        ...

    def metadata(self, key=..., database=..., table=..., fallback=...): # -> dict[Unknown, Unknown] | None:
        """
        Looks up metadata, cascading backwards from specified level.
        Returns None if metadata value is not found.
        """
        ...

    def plugin_config(self, plugin_name, database=..., table=..., fallback=...): # -> str | dict[Unknown, Unknown] | list[Unknown] | None:
        """Return config for plugin, falling back from specified database/table"""
        ...

    def app_css_hash(self): # -> str:
        ...

    async def get_canned_queries(self, database_name, actor): # -> dict[Unknown, Unknown]:
        ...

    async def get_canned_query(self, database_name, query_name, actor): # -> None:
        ...

    def update_with_inherited_metadata(self, metadata): # -> None:
        ...

    def add_message(self, request, message, type=...): # -> None:
        ...

    async def permission_allowed(self, actor, action, resource=..., default=...):
        """Check permissions using the permissions_allowed plugin hook"""
        ...

    async def execute(self, db_name:str, sql:str, params=..., truncate=..., custom_time_limit=..., page_size=..., log_sql_errors=...) -> Results:
        ...

    async def expand_foreign_keys(self, database:str, table:str, column:str, values): # -> dict[tuple[str, Any], str]:
        """Returns dict mapping (column, value) -> label"""
        ...

    def absolute_url(self, request, path):
        ...

    def table_metadata(self, database, table): # -> dict[Unknown, Unknown]:
        """Fetch table-specific metadata."""
        ...

    async def render_template(self, templates, context=..., request=..., view_name=...): # -> str:
        ...

    def app(self): # -> AsgiLifespan:
        """Returns an ASGI app function that serves the whole of Datasette"""
        ...



class DatasetteRouter:
    def __init__(self, datasette, routes) -> None:
        ...

    async def __call__(self, scope, receive, send): # -> None:
        ...

    async def route_path(self, scope, receive, send, path): # -> None:
        ...

    async def handle_404(self, request, send, exception=...): # -> None:
        ...

    async def handle_500(self, request, send, exception): # -> None:
        ...



_cleaner_task_str_re = ...
def wrap_view(view_fn, datasette): # -> (request: Unknown, send: Unknown) -> Coroutine[Any, Any, Unknown | None]:
    ...

def permanent_redirect(path, forward_query_string=..., forward_rest=...): # -> (request: Unknown, send: Unknown) -> Coroutine[Any, Any, Unknown | None]:
    ...

_curly_re = ...
def route_pattern_from_filepath(filepath): # -> Pattern[str]:
    ...

class NotFoundExplicit(NotFound):
    ...


class DatasetteClient:
    def __init__(self, ds) -> None:
        ...

    async def get(self, path, **kwargs): # -> Response:
        ...

    async def options(self, path, **kwargs): # -> Response:
        ...

    async def head(self, path, **kwargs): # -> Response:
        ...

    async def post(self, path, **kwargs): # -> Response:
        ...

    async def put(self, path, **kwargs): # -> Response:
        ...

    async def patch(self, path, **kwargs): # -> Response:
        ...

    async def delete(self, path, **kwargs): # -> Response:
        ...

    async def request(self, method, path, **kwargs): # -> Response:
        ...



