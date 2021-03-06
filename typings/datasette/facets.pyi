"""
This type stub file was generated by pyright.
"""

from datasette import hookimpl

def load_facet_configs(request, table_metadata): # -> dict[Unknown, Unknown]:
    ...

@hookimpl
def register_facet_classes(): # -> list[Unknown]:
    ...

class Facet:
    type = ...
    def __init__(self, ds, request, database, sql=..., table=..., params=..., metadata=..., row_count=...) -> None:
        ...
    
    def get_configs(self): # -> list[Any]:
        ...
    
    def get_querystring_pairs(self):
        ...
    
    def get_facet_size(self):
        ...
    
    async def suggest(self): # -> list[Unknown]:
        ...
    
    async def facet_results(self):
        ...
    
    async def get_columns(self, sql, params=...):
        ...
    
    async def get_row_count(self):
        ...
    


class ColumnFacet(Facet):
    type = ...
    async def suggest(self): # -> list[Unknown]:
        ...
    
    async def facet_results(self): # -> tuple[dict[Unknown, Unknown], list[Unknown]]:
        ...
    


class ArrayFacet(Facet):
    type = ...
    async def suggest(self): # -> list[Unknown]:
        ...
    
    async def facet_results(self): # -> tuple[dict[Unknown, Unknown], list[Unknown]]:
        ...
    


class DateFacet(Facet):
    type = ...
    async def suggest(self): # -> list[Unknown]:
        ...
    
    async def facet_results(self): # -> tuple[dict[Unknown, Unknown], list[Unknown]]:
        ...
    


