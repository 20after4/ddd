"""
This type stub file was generated by pyright.
"""

from datasette import hookimpl

_BLOB_COLUMN = ...
_BLOB_HASH = ...
async def render_blob(datasette, database, rows, columns, request, table, view_name): # -> Response:
    ...

@hookimpl
def register_output_renderer(): # -> dict[str, Unknown]:
    ...

