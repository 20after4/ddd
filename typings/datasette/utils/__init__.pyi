"""
This type stub file was generated by pyright.
"""

import asyncio
import click
import base64
import hashlib
import inspect
import json
import markupsafe
import mergedeep
import os
import re
import shlex
import tempfile
import time
import types
import shutil
import urllib
import yaml
from contextlib import contextmanager
from collections import Counter, OrderedDict, namedtuple
from .shutil_backport import copytree
from .sqlite import sqlite3, supports_table_xinfo

reserved_words = ...
APT_GET_DOCKERFILE_EXTRAS = ...
SPATIALITE_PATHS = ...
HASH_LENGTH = ...
Column = ...
async def await_me_maybe(value):
    ...

def urlsafe_components(token): # -> list[Unknown]:
    """Splits token on commas and URL decodes each component"""
    ...

def path_from_row_pks(row, pks, use_rowid, quote=...): # -> str:
    """Generate an optionally URL-quoted unique identifier
    for a row from its primary keys."""
    ...

def compound_keys_after_sql(pks, start_index=...): # -> str:
    ...

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj): # -> tuple[Unknown, ...] | list[Any] | str | dict[str, Unknown] | Any:
        ...
    


@contextmanager
def sqlite_timelimit(conn, ms): # -> Generator[None, None, None]:
    ...

class InvalidSql(Exception):
    ...


allowed_sql_res = ...
allowed_pragmas = ...
disallawed_sql_res = ...
def validate_sql_select(sql): # -> None:
    ...

def append_querystring(url, querystring): # -> str:
    ...

def path_with_added_args(request, args, path=...):
    ...

def path_with_removed_args(request, args, path=...):
    ...

def path_with_replaced_args(request, args, path=...):
    ...

_css_re = ...
_boring_keyword_re = ...
def escape_css_string(s): # -> str:
    ...

def escape_sqlite(s): # -> str:
    ...

def make_dockerfile(files, metadata_file, extra_options, branch, template_dir, plugins_dir, static, install, spatialite, version_note, secret, environment_variables=..., port=..., apt_get_extras=...): # -> str:
    ...

@contextmanager
def temporary_docker_directory(files, name, metadata, extra_options, branch, template_dir, plugins_dir, static, install, spatialite, version_note, secret, extra_metadata=..., environment_variables=..., port=..., apt_get_extras=...): # -> Generator[str, None, None]:
    ...

def detect_primary_keys(conn, table): # -> list[Any]:
    """Figure out primary keys for a table."""
    ...

def get_outbound_foreign_keys(conn, table): # -> list[dict[str, Unknown]]:
    ...

def get_all_foreign_keys(conn): # -> dict[Unknown, Unknown]:
    ...

def detect_spatialite(conn): # -> bool:
    ...

def detect_fts(conn, table): # -> None:
    """Detect if table has a corresponding FTS virtual table and return it"""
    ...

def detect_fts_sql(table): # -> str:
    ...

def detect_json1(conn=...): # -> bool:
    ...

def table_columns(conn, table): # -> list[Any]:
    ...

def table_column_details(conn, table): # -> list[Column]:
    ...

filter_column_re = ...
def filters_should_redirect(special_args): # -> list[Unknown]:
    ...

whitespace_re = ...
def is_url(value): # -> bool:
    """Must start with http:// or https:// and contain JUST a URL"""
    ...

css_class_re = ...
css_invalid_chars_re = ...
def to_css_class(s): # -> str:
    """
    Given a string (e.g. a table name) returns a valid unique CSS class.
    For simple cases, just returns the string again. If the string is not a
    valid CSS class (we disallow - and _ prefixes even though they are valid
    as they may be confused with browser prefixes) we strip invalid characters
    and add a 6 char md5 sum suffix, to make sure two tables with identical
    names after stripping characters don't end up with the same CSS class.
    """
    ...

def link_or_copy(src, dst): # -> None:
    ...

def link_or_copy_directory(src, dst): # -> None:
    ...

def module_from_path(path, name): # -> ModuleType:
    ...

async def resolve_table_and_format(table_and_format, table_exists, allowed_formats=...): # -> tuple[Unknown, None] | tuple[Unknown, Unknown]:
    ...

def path_with_format(*, request=..., path=..., format=..., extra_qs=..., replace_format=...): # -> str:
    ...

class CustomRow(OrderedDict):
    def __init__(self, columns, values=...) -> None:
        ...
    
    def __getitem__(self, key):
        ...
    
    def __iter__(self): # -> Generator[Unknown, None, None]:
        ...
    


def value_as_boolean(value): # -> bool:
    ...

class ValueAsBooleanError(ValueError):
    ...


class WriteLimitExceeded(Exception):
    ...


class LimitedWriter:
    def __init__(self, writer, limit_mb) -> None:
        ...
    
    async def write(self, bytes): # -> None:
        ...
    


class EscapeHtmlWriter:
    def __init__(self, writer) -> None:
        ...
    
    async def write(self, content): # -> None:
        ...
    


_infinities = ...
def remove_infinites(row): # -> list[Unknown | float | None]:
    ...

class StaticMount(click.ParamType):
    name = ...
    def convert(self, value, param, ctx): # -> tuple[Unknown, Unknown]:
        ...
    


def format_bytes(bytes): # -> str:
    ...

_escape_fts_re = ...
def escape_fts(query): # -> str:
    ...

class MultiParams:
    def __init__(self, data) -> None:
        ...
    
    def __repr__(self): # -> str:
        ...
    
    def __contains__(self, key): # -> bool:
        ...
    
    def __getitem__(self, key):
        ...
    
    def keys(self): # -> _dict_keys[Unknown, Unknown]:
        ...
    
    def __iter__(self): # -> Generator[Unknown, None, None]:
        ...
    
    def __len__(self): # -> int:
        ...
    
    def get(self, name, default=...):
        """Return first value in the list, if available"""
        ...
    
    def getlist(self, name): # -> list[Any]:
        """Return full list"""
        ...
    


class ConnectionProblem(Exception):
    ...


class SpatialiteConnectionProblem(ConnectionProblem):
    ...


def check_connection(conn): # -> None:
    ...

class BadMetadataError(Exception):
    ...


def parse_metadata(content): # -> Any:
    ...

def call_with_supported_arguments(fn, **kwargs):
    ...

async def async_call_with_supported_arguments(fn, **kwargs):
    ...

def actor_matches_allow(actor, allow): # -> bool:
    ...

async def check_visibility(datasette, actor, action, resource, default=...): # -> tuple[Literal[False], Literal[False]] | tuple[Unknown, bool]:
    """Returns (visible, private) - visible = can you see it, private = can others see it too"""
    ...

def resolve_env_secrets(config, environ): # -> str | dict[Unknown, Unknown] | list[Unknown]:
    """Create copy that recursively replaces {"$env": "NAME"} with values from environ"""
    ...

def display_actor(actor): # -> str:
    ...

class SpatialiteNotFound(Exception):
    ...


def find_spatialite(): # -> str:
    ...

async def initial_path_for_datasette(datasette):
    """Return suggested path for opening this Datasette, based on number of DBs and tables"""
    ...

class PrefixedUrlString(str):
    def __add__(self, other): # -> PrefixedUrlString:
        ...
    
    def __str__(self) -> str:
        ...
    
    def __getattribute__(self, name): # -> Any:
        ...
    


class StartupError(Exception):
    ...

