"""
This type stub file was generated by pyright.
"""

from asgiref.sync import async_to_sync

class TestResponse:
    def __init__(self, httpx_response) -> None:
        ...
    
    @property
    def status(self):
        ...
    
    @property
    def headers(self):
        ...
    
    @property
    def body(self):
        ...
    
    @property
    def cookies(self): # -> dict[Unknown, Unknown]:
        ...
    
    def cookie_was_deleted(self, cookie): # -> bool:
        ...
    
    @property
    def json(self): # -> Any:
        ...
    
    @property
    def text(self):
        ...
    


class TestClient:
    max_redirects = ...
    def __init__(self, ds) -> None:
        ...
    
    def actor_cookie(self, actor):
        ...
    
    @async_to_sync
    async def get(self, path, allow_redirects=..., redirect_count=..., method=..., cookies=...): # -> TestResponse:
        ...
    
    @async_to_sync
    async def post(self, path, post_data=..., body=..., allow_redirects=..., redirect_count=..., content_type=..., cookies=..., headers=..., csrftoken_from=...): # -> TestResponse:
        ...
    
    @async_to_sync
    async def request(self, path, allow_redirects=..., redirect_count=..., method=..., cookies=..., headers=..., post_body=..., content_type=...): # -> TestResponse:
        ...
    


