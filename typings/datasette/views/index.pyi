"""
This type stub file was generated by pyright.
"""

from .base import BaseView

TRUNCATE_AT = ...
COUNT_DB_SIZE_LIMIT = ...
class IndexView(BaseView):
    name = ...
    async def get(self, request, as_format): # -> Response:
        ...
    


