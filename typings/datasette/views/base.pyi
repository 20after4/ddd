"""
This type stub file was generated by pyright.
"""

ureg = ...
class DatasetteError(Exception):
    def __init__(self, message, title=..., error_dict=..., status=..., template=..., message_is_html=...) -> None:
        ...
    


class BaseView:
    ds = ...
    def __init__(self, datasette) -> None:
        ...
    
    async def head(self, *args, **kwargs):
        ...
    
    async def check_permission(self, request, action, resource=...): # -> None:
        ...
    
    async def check_permissions(self, request, permissions): # -> None:
        """permissions is a list of (action, resource) tuples or 'action' strings"""
        ...
    
    def database_color(self, database): # -> Literal['ff0000']:
        ...
    
    async def options(self, request, *args, **kwargs): # -> Response:
        ...
    
    async def post(self, request, *args, **kwargs): # -> Response:
        ...
    
    async def put(self, request, *args, **kwargs): # -> Response:
        ...
    
    async def patch(self, request, *args, **kwargs): # -> Response:
        ...
    
    async def delete(self, request, *args, **kwargs): # -> Response:
        ...
    
    async def dispatch_request(self, request, *args, **kwargs): # -> Any:
        ...
    
    async def render(self, templates, request, context=...): # -> Response:
        ...
    
    @classmethod
    def as_view(cls, *class_args, **class_kwargs): # -> (request: Unknown, send: Unknown) -> Coroutine[Any, Any, Any]:
        ...
    


class DataView(BaseView):
    name = ...
    re_named_parameter = ...
    async def options(self, request, *args, **kwargs): # -> Response:
        ...
    
    def redirect(self, request, path, forward_querystring=..., remove_args=...): # -> Response:
        ...
    
    async def data(self, request, database, hash, **kwargs):
        ...
    
    async def resolve_db_name(self, request, db_name, **kwargs): # -> tuple[Unknown, Unknown | Literal['000'], Unknown, Unknown] | tuple[Unknown, Unknown | Literal['000'], Unknown, None]:
        ...
    
    def get_templates(self, database, table=...): # -> None:
        ...
    
    async def get(self, request, db_name, **kwargs): # -> Response | AsgiStream:
        ...
    
    async def as_csv(self, request, database, hash, **kwargs): # -> Response | AsgiStream:
        ...
    
    async def get_format(self, request, database, args): # -> tuple[Unknown | str | None, Unknown]:
        """Determine the format of the response from the request, from URL
        parameters or from a file extension.

        `args` is a dict of the path components parsed from the URL by the router.
        """
        ...
    
    async def view_get(self, request, database, hash, correct_hash_provided, **kwargs): # -> Response | AsgiStream:
        ...
    
    def set_response_headers(self, response, ttl):
        ...
    

