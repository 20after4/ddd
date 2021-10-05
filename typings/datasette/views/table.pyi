"""
This type stub file was generated by pyright.
"""

from .base import DataView

LINK_WITH_LABEL = ...
LINK_WITH_VALUE = ...
class Row:
    def __init__(self, cells) -> None:
        ...
    
    def __iter__(self): # -> Iterator[Unknown]:
        ...
    
    def __getitem__(self, key):
        ...
    
    def display(self, key): # -> None:
        ...
    
    def __str__(self) -> str:
        ...
    


class RowTableShared(DataView):
    async def columns_to_select(self, db, table, request): # -> list[Unknown]:
        ...
    
    async def sortable_columns_for_table(self, database, table, use_rowid): # -> set[Unknown]:
        ...
    
    async def expandable_columns(self, database, table): # -> list[Unknown]:
        ...
    
    async def display_columns_and_rows(self, database, table, description, rows, link_column=..., truncate_cells=...): # -> tuple[list[dict[str, Unknown]], list[Unknown]]:
        """Returns columns, rows for specified table - including fancy foreign key treatment"""
        ...
    


class TableView(RowTableShared):
    name = ...
    async def post(self, request, db_name, table_and_format): # -> Response | tuple[dict[str, Unknown], () -> Coroutine[Any, Any, dict[str, Unknown]], list[str]] | tuple[dict[str, Unknown], () -> Coroutine[Any, Any, dict[str, Unknown]], list[str], Literal[400, 200]]:
        ...
    
    async def data(self, request, database, hash, table, default_labels=..., _next=..., _size=...): # -> Response | tuple[dict[str, Unknown], () -> Coroutine[Any, Any, dict[str, Unknown]], list[str]] | tuple[dict[str, Unknown], () -> Coroutine[Any, Any, dict[str, Unknown]], list[str], Literal[400, 200]] | tuple[dict[str, Unknown], () -> Coroutine[Any, Any, dict[str, Unknown]], tuple[str, Literal['table.html']]]:
        ...
    


class RowView(RowTableShared):
    name = ...
    async def data(self, request, database, hash, table, pk_path, default_labels=...): # -> tuple[dict[str, Unknown], () -> Coroutine[Any, Any, dict[str, Unknown]], tuple[str, Literal['row.html']]]:
        ...
    
    async def foreign_key_tables(self, database, table, pk_values): # -> list[Unknown]:
        ...
    


