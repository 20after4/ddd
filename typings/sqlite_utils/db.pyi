"""
This type stub file was generated by pyright.
"""

import contextlib
import pathlib
import sqlite3
from typing import Any, Callable, Dict, Generator, Iterable, List, Optional, Set, Tuple, Union
from typing_extensions import TypeAlias

SQLITE_MAX_VARS = ...
_quote_fts_re = ...
_virtual_table_using_re = ...
Column = ...
ColumnDetails = ...
ForeignKey = ...
Index = ...
XIndex = ...
XIndexColumn = ...
Trigger = ...

ForeignKeysType:TypeAlias = ...
#Union[Iterable[str], Iterable[ForeignKey], Iterable[Tuple[str, str]], Iterable[Tuple[str, str, str]], Iterable[Tuple[str, str, str, str]]],

class Default:
    ...


DEFAULT:Default = ...
COLUMN_TYPE_MAPPING:Dict[type,str] = ...

class AlterError(Exception):
    "Error altering table"
    ...


class NoObviousTable(Exception):
    "Could not tell which table this operation refers to"
    ...


class BadPrimaryKey(Exception):
    "Table does not have a single obvious primary key"
    ...


class NotFoundError(Exception):
    "Record not found"
    ...


class PrimaryKeyRequired(Exception):
    "Primary key needs to be specified"
    ...


class InvalidColumns(Exception):
    "Specified columns do not exist"
    ...


class DescIndex(str):
    ...


class BadMultiValues(Exception):
    "With multi=True code must return a Python dictionary"
    def __init__(self, values) -> None:
        ...



_COUNTS_TABLE_CREATE_SQL = ...
class Database:
    """
    Wrapper for a SQLite database connection that adds a variety of useful utility methods.

    To create an instance::

        # create data.db file, or open existing:
        db = Database("data.db")
        # Create an in-memory database:
        dB = Database(memory=True)

    - ``filename_or_conn`` - String path to a file, or a ``pathlib.Path`` object, or a
      ``sqlite3`` connection
    - ``memory`` - set to ``True`` to create an in-memory database
    - ``recreate`` - set to ``True`` to delete and recreate a file database (**dangerous**)
    - ``recursive_triggers`` - defaults to ``True``, which sets ``PRAGMA recursive_triggers=on;`` -
      set to ``False`` to avoid setting this pragma
    - ``tracer`` - set a tracer function (``print`` works for this) which will be called with
      ``sql, parameters`` every time a SQL query is executed
    - ``use_counts_table`` - set to ``True`` to use a cached counts table, if available. See
      :ref:`python_api_cached_table_counts`.
    """
    _counts_table_name = ...
    use_counts_table = ...
    conn:sqlite3.Connection = ...

    def __init__(self, filename_or_conn: Union[str, pathlib.Path, sqlite3.Connection] = ..., memory: bool = ..., recreate: bool = ..., recursive_triggers: bool = ..., tracer: Callable = ..., use_counts_table: bool = ...) -> None:
        ...

    @contextlib.contextmanager
    def tracer(self, tracer: Callable = ...): # -> Generator[Database, None, None]:
        """
        Context manager to temporarily set a tracer function - all executed SQL queries will
        be passed to this.

        The tracer function should accept two arguments: ``sql`` and ``parameters``

        Example usage::

            with db.tracer(print):
                db["creatures"].insert({"name": "Cleo"})

        See :ref:`python_api_tracing`.
        """
        ...

    def __getitem__(self, table_name: str) -> Union[Table, View]:
        """
        ``db[table_name]`` returns a :class:`.Table` object for the table with the specified name.
        If the table does not exist yet it will be created the first time data is inserted into it.
        """
        ...

    def __repr__(self) -> str:
        ...

    def register_function(self, fn: Callable = ..., deterministic: bool = ..., replace: bool = ...): # -> (fn: Unknown) -> Unknown | None:
        """
        ``fn`` will be made available as a function within SQL, with the same name and number
        of arguments. Can be used as a decorator::

            @db.register
            def upper(value):
                return str(value).upper()

        The decorator can take arguments::

            @db.register(deterministic=True, replace=True)
            def upper(value):
                return str(value).upper()

        - ``deterministic`` - set ``True`` for functions that always returns the same output for a given input
        - ``replace`` - set ``True`` to replace an existing function with the same name - otherwise throw an error

        See :ref:`python_api_register_function`.
        """
        ...

    def register_fts4_bm25(self): # -> None:
        "Register the ``rank_bm25(match_info)`` function used for calculating relevance with SQLite FTS4."
        ...

    def attach(self, alias: str, filepath: Union[str, pathlib.Path]): # -> None:
        """
        Attach another SQLite database file to this connection with the specified alias, equivalent to::

            ATTACH DATABASE 'filepath.db' AS alias
        """
        ...

    def query(self, sql: str, params: Optional[Union[Iterable, dict]] = ...) -> Generator[dict, None, None]:
        "Execute ``sql`` and return an iterable of dictionaries representing each row."
        ...

    def execute(self, sql: str, parameters: Optional[Union[Iterable, dict]] = ...) -> sqlite3.Cursor:
        "Execute SQL query and return a ``sqlite3.Cursor``."
        ...

    def executescript(self, sql: str) -> sqlite3.Cursor:
        "Execute multiple SQL statements separated by ; and return the ``sqlite3.Cursor``."
        ...

    def table(self, table_name: str, **kwargs) -> Table:
        "Return a table object, optionally configured with default options."
        ...

    def quote(self, value: str) -> str:
        "Apply SQLite string quoting to a value, including wrappping it in single quotes."
        ...

    def quote_fts(self, query: str) -> str:
        "Escape special characters in a SQLite full-text search query"
        ...

    def table_names(self, fts4: bool = ..., fts5: bool = ...) -> List[str]:
        "A list of string table names in this database."
        ...

    def view_names(self) -> List[str]:
        "A list of string view names in this database."
        ...

    @property
    def tables(self) -> List[Table]:
        "A list of Table objects in this database."
        ...

    @property
    def views(self) -> List[View]:
        "A list of View objects in this database."
        ...

    @property
    def triggers(self) -> List[Trigger]:
        "A list of ``(name, table_name, sql)`` tuples representing triggers in this database."
        ...

    @property
    def triggers_dict(self) -> Dict[str, str]:
        "A ``{trigger_name: sql}`` dictionary of triggers in this database."
        ...

    @property
    def schema(self) -> str:
        "SQL schema for this database"
        ...

    @property
    def journal_mode(self) -> str:
        "Current ``journal_mode`` of this database."
        ...

    def enable_wal(self): # -> None:
        "Set ``journal_mode`` to ``'wal'`` to enable Write-Ahead Log mode."
        ...

    def disable_wal(self): # -> None:
        "Set ``journal_mode`` back to ``'delete'`` to disable Write-Ahead Log mode."
        ...

    def enable_counts(self): # -> None:
        """
        Enable trigger-based count caching for every table in the database, see
        :ref:`python_api_cached_table_counts`.
        """
        ...

    def cached_counts(self, tables: Optional[Iterable[str]] = ...) -> Dict[str, int]:
        """
        Return ``{table_name: count}`` dictionary of cached counts for specified tables, or
        all tables if ``tables`` not provided.
        """
        ...

    def reset_counts(self): # -> None:
        "Re-calculate cached counts for tables."
        ...

    def execute_returning_dicts(self, sql: str, params: Optional[Union[Iterable, dict]] = ...) -> List[dict]:
        ...

    def resolve_foreign_keys(self, name: str, foreign_keys: ForeignKeysType) -> List[ForeignKey]:
        ...

    def create_table_sql(self, name: str, columns: Dict[str, Any], pk: Optional[Any] = ..., foreign_keys: Optional[ForeignKeysType] = ..., column_order: Optional[List[str]] = ..., not_null: Iterable[str] = ..., defaults: Optional[Dict[str, Any]] = ..., hash_id: Optional[Any] = ..., extracts: Optional[Union[Dict[str, str], List[str]]] = ...) -> str:
        "Returns the SQL ``CREATE TABLE`` statement for creating the specified table."
        ...

    def create_table(self, name: str, columns: Dict[str, Any], pk: Optional[Any] = ..., foreign_keys: Optional[ForeignKeysType] = ..., column_order: Optional[List[str]] = ..., not_null: Iterable[str] = ..., defaults: Optional[Dict[str, Any]] = ..., hash_id: Optional[Any] = ..., extracts: Optional[Union[Dict[str, str], List[str]]] = ...) -> Table:
        """
        Create a table with the specified name and the specified ``{column_name: type}`` columns.

        See :ref:`python_api_explicit_create`.
        """
        ...

    def create_view(self, name: str, sql: str, ignore: bool = ..., replace: bool = ...): # -> Database:
        """
        Create a new SQL view with the specified name - ``sql`` should start with ``SELECT ...``.

        - ``ignore`` - set to ``True`` to do nothing if a view with this name already exists
        - ``replace`` - set to ``True`` to replace the view if one with this name already exists
        """
        ...

    def m2m_table_candidates(self, table: str, other_table: str) -> List[str]:
        """
        Given two table names returns the name of tables that could define a
        many-to-many relationship between those two tables, based on having
        foreign keys to both of the provided tables.
        """
        ...

    def add_foreign_keys(self, foreign_keys: Iterable[Tuple[str, str, str, str]]): # -> None:
        """
        See :ref:`python_api_add_foreign_keys`.

        ``foreign_keys`` should be a list of  ``(table, column, other_table, other_column)``
        tuples, see :ref:`python_api_add_foreign_keys`.
        """
        ...

    def index_foreign_keys(self): # -> None:
        "Create indexes for every foreign key column on every table in the database."
        ...

    def vacuum(self): # -> None:
        "Run a SQLite ``VACUUM`` against the database."
        ...



class Queryable:
    def exists(self) -> bool:
        "Does this table or view exist yet?"
        ...

    def __init__(self, db, name) -> None:
        ...

    def count_where(self, where: str = ..., where_args: Optional[Union[Iterable, dict]] = ...) -> int:
        "Executes ``SELECT count(*) FROM table WHERE ...`` and returns a count."
        ...

    def execute_count(self): # -> int:
        ...

    @property
    def count(self) -> int:
        "A count of the rows in this table or view."
        ...

    @property
    def rows(self) -> Generator[dict, None, None]:
        "Iterate over every dictionaries for each row in this table or view."
        ...

    def rows_where(self, where: str = ..., where_args: Optional[Union[Iterable, dict]] = ..., order_by: str = ..., select: str = ..., limit: int = ..., offset: int = ...) -> Generator[dict, None, None]:
        """
        Iterate over every row in this table or view that matches the specified where clause.

        - ``where`` - a SQL fragment to use as a ``WHERE`` clause, for example ``age > ?`` or ``age > :age``.
        - ``where_args`` - a list of arguments (if using ``?``) or a dictionary (if using ``:age``).
        - ``order_by`` - optional column or fragment of SQL to order by.
        - ``select`` - optional comma-separated list of columns to select.
        - ``limit`` - optional integer number of rows to limit to.
        - ``offset`` - optional integer for SQL offset.

        Returns each row as a dictionary. See :ref:`python_api_rows` for more details.
        """
        ...

    def pks_and_rows_where(self, where: str = ..., where_args: Optional[Union[Iterable, dict]] = ..., order_by: str = ..., limit: int = ..., offset: int = ...) -> Generator[Tuple[Any, Dict], None, None]:
        "Like ``.rows_where()`` but returns ``(pk, row)`` pairs - ``pk`` can be a single value or tuple."
        ...

    @property
    def columns(self) -> List[Column]:
        "List of :ref:`Columns <reference_db_other_column>` representing the columns in this table or view."
        ...

    @property
    def columns_dict(self) -> Dict[str, Any]:
        "``{column_name: python-type}`` dictionary representing columns in this table or view."
        ...

    @property
    def schema(self) -> str:
        "SQL schema for this table or view."
        ...



class Table(Queryable):
    "Tables should usually be initialized using the ``db.table(table_name)`` or ``db[table_name]`` methods."
    last_rowid: Optional[int] = ...
    last_pk: Optional[Any] = ...
    def __init__(self, db: Database, name: str, pk: Optional[Any] = ..., foreign_keys: Optional[ForeignKeysType] = ..., column_order: Optional[List[str]] = ..., not_null: Iterable[str] = ..., defaults: Optional[Dict[str, Any]] = ..., batch_size: int = ..., hash_id: Optional[Any] = ..., alter: bool = ..., ignore: bool = ..., replace: bool = ..., extracts: Optional[Union[Dict[str, str], List[str]]] = ..., conversions: Optional[dict] = ..., columns: Optional[Union[Dict[str, Any]]] = ...) -> None:
        ...

    def __repr__(self) -> str:
        ...

    @property
    def count(self) -> int:
        "Count of the rows in this table - optionally from the table count cache, if configured."
        ...

    def exists(self) -> bool:
        ...

    @property
    def pks(self) -> List[str]:
        "Primary key columns for this table."
        ...

    @property
    def use_rowid(self) -> bool:
        "Does this table use ``rowid`` for its primary key (no other primary keys are specified)?"
        ...

    def get(self, pk_values: Union[list, tuple, str, int]) -> dict:
        """
        Return row (as dictionary) for the specified primary key.

        Primary key can be a single value, or a tuple for tables with a compound primary key.

        Raises ``NotFoundError`` if a matching row cannot be found.
        """
        ...

    @property
    def foreign_keys(self) -> List[ForeignKey]:
        "List of foreign keys defined on this table."
        ...

    @property
    def virtual_table_using(self) -> Optional[str]:
        "Type of virtual table, or ``None`` if this is not a virtual table."
        ...

    @property
    def indexes(self) -> List[Index]:
        "List of indexes defined on this table."
        ...

    @property
    def xindexes(self) -> List[XIndex]:
        "List of indexes defined on this table using the more detailed ``XIndex`` format."
        ...

    @property
    def triggers(self) -> List[Trigger]:
        "List of triggers defined on this table."
        ...

    @property
    def triggers_dict(self) -> Dict[str, str]:
        "``{trigger_name: sql}`` dictionary of triggers defined on this table."
        ...

    def create(self, columns: Dict[str, Any], pk: Optional[Any] = ..., foreign_keys: Optional[ForeignKeysType] = ..., column_order: Optional[List[str]] = ..., not_null: Iterable[str] = ..., defaults: Optional[Dict[str, Any]] = ..., hash_id: Optional[Any] = ..., extracts: Optional[Union[Dict[str, str], List[str]]] = ...) -> Table:
        """
        Create a table with the specified columns.

        See :ref:`python_api_explicit_create` for full details.
        """
        ...

    def transform(self, *, types=..., rename=..., drop=..., pk=..., not_null=..., defaults=..., drop_foreign_keys=..., column_order=...) -> Table:
        """
        Apply an advanced alter table, including operations that are not supported by
        ``ALTER TABLE`` in SQLite itself.

        See :ref:`python_api_transform` for full details.
        """
        ...

    def transform_sql(self, *, types=..., rename=..., drop=..., pk=..., not_null=..., defaults=..., drop_foreign_keys=..., column_order=..., tmp_suffix=...) -> List[str]:
        "Returns a list of SQL statements that would be executed in order to apply this transformation."
        ...

    def extract(self, columns: Union[str, Iterable[str]], table: Optional[str] = ..., fk_column: Optional[str] = ..., rename: Optional[Dict[str, str]] = ...) -> Table:
        """
        Extract specified columns into a separate table.

        See :ref:`python_api_extract` for details.
        """
        ...

    def create_index(self, columns: Iterable[Union[str, DescIndex]], index_name: Optional[str] = ..., unique: bool = ..., if_not_exists: bool = ...): # -> Table:
        """
        Create an index on this table.

        - ``columns`` - a single columns or list of columns to index. These can be strings or,
          to create an index using the column in descending order, ``db.DescIndex(column_name)`` objects.
        - ``index_name`` - the name to use for the new index. Defaults to the column names joined on ``_``.
        - ``unique`` - should the index be marked as unique, forcing unique values?
        - ``if_not_exists`` - only create the index if one with that name does not already exist.

        See :ref:`python_api_create_index`.
        """
        ...

    def add_column(self, col_name: str, col_type=..., fk=..., fk_col=..., not_null_default=...): # -> Table:
        "Add a column to this table. See :ref:`python_api_add_column`."
        ...

    def drop(self, ignore: bool = ...): # -> None:
        "Drop this table. ``ignore=True`` means errors will be ignored."
        ...

    def guess_foreign_table(self, column: str) -> str:
        """
        For a given column, suggest another table that might be referenced by this
        column should it be used as a foreign key.

        For example, a column called ``tag_id`` or ``tag`` or ``tags`` might suggest
        a ``tag`` table, if one exists.

        If no candidates can be found, raises a ``NoObviousTable`` exception.
        """
        ...

    def guess_foreign_column(self, other_table: str):
        ...

    def add_foreign_key(self, column: str, other_table: Optional[str] = ..., other_column: Optional[str] = ..., ignore: bool = ...): # -> Table:
        """
        Alter the schema to mark the specified column as a foreign key to another table.

        - ``column`` - the column to mark as a foreign key.
        - ``other_table`` - the table it refers to - if omitted, will be guessed based on the column name.
        - ``other_column`` - the column on the other table it - if omitted, will be guessed.
        - ``ignore`` - set this to ``True`` to ignore an existing foreign key - otherwise a ``AlterError`` will be raised.
        """
        ...

    def enable_counts(self): # -> None:
        """
        Set up triggers to update a cache of the count of rows in this table.

        See :ref:`python_api_cached_table_counts` for details.
        """
        ...

    @property
    def has_counts_triggers(self) -> bool:
        "Does this table have triggers setup to update cached counts?"
        ...

    def enable_fts(self, columns: Iterable[str], fts_version: str = ..., create_triggers: bool = ..., tokenize: Optional[str] = ..., replace: bool = ...): # -> Table:
        """
        Enable SQLite full-text search against the specified columns.

        - ``columns`` - list of column names to include in the search index.
        - ``fts_version`` - FTS version to use - defaults to ``FTS5`` but you may want ``FTS4`` for older SQLite versions.
        - ``create_triggers`` - should triggers be created to keep the search index up-to-date? Defaults to ``False``.
        - ``tokenize`` - custom SQLite tokenizer to use, for example ``"porter"`` to enable Porter stemming.
        - ``replace`` - should any existing FTS index for this table be replaced by the new one?

        See :ref:`python_api_fts` for more details.
        """
        ...

    def populate_fts(self, columns: Iterable[str]) -> Table:
        """
        Update the associated SQLite full-text search index with the latest data from the
        table for the specified columns.
        """
        ...

    def disable_fts(self) -> Table:
        "Remove any full-text search index and related triggers configured for this table."
        ...

    def rebuild_fts(self): # -> Table:
        "Run the ``rebuild`` operation against the associated full-text search index table."
        ...

    def detect_fts(self) -> Optional[str]:
        "Detect if table has a corresponding FTS virtual table and return it"
        ...

    def optimize(self) -> Table:
        "Run the ``optimize`` operation against the associated full-text search index table."
        ...

    def search_sql(self, columns: Optional[Iterable[str]] = ..., order_by: Optional[str] = ..., limit: Optional[int] = ..., offset: Optional[int] = ...) -> str:
        "Return SQL string that can be used to execute searches against this table."
        ...

    def search(self, q: str, order_by: Optional[str] = ..., columns: Optional[Iterable[str]] = ..., limit: Optional[int] = ..., offset: Optional[int] = ..., quote: bool = ...) -> Generator[dict, None, None]:
        """
        Execute a search against this table using SQLite full-text search, returning a sequence of
        dictionaries for each row.

        - ``q`` - terms to search for
        - ``order_by`` - defaults to order by rank, or specify a column here.
        - ``columns`` - list of columns to return, defaults to all columns.
        - ``limit`` - optional integer limit for returned rows.
        - ``offset`` - optional integer SQL offset.
        - ``quote`` - apply quoting to disable any special characters in the search query

        See :ref:`python_api_fts_search`.
        """
        ...

    def value_or_default(self, key, value): # -> Any | None:
        ...

    def delete(self, pk_values: Union[list, tuple, str, int, float]) -> Table:
        "Delete row matching the specified primary key."
        ...

    def delete_where(self, where: str = ..., where_args: Optional[Union[Iterable, dict]] = ...) -> Table:
        "Delete rows matching specified where clause, or delete all rows in the table."
        ...

    def update(self, pk_values: Union[list, tuple, str, int, float], updates: Optional[dict] = ..., alter: bool = ..., conversions: Optional[dict] = ...) -> Table:
        """
        Execute a SQL ``UPDATE`` against the specified row.

        - ``pk_values`` - the primary key of an individual record - can be a tuple if the
          table has a compound primary key.
        - ``updates`` - a dictionary mapping columns to their updated values.
        - ``alter`` - set to ``True`` to add any missing columns.
        - ``conversions`` - optional dictionary of SQL functions to apply during the update, for example
          ``{"mycolumn": "upper(?)"}``.

        See :ref:`python_api_update`.
        """
        ...

    def convert(self, columns: Union[str, List[str]], fn: Callable, output: Optional[str] = ..., output_type: Optional[Any] = ..., drop: bool = ..., multi: bool = ..., where: Optional[str] = ..., where_args: Optional[Union[Iterable, dict]] = ..., show_progress: bool = ...): # -> Table | None:
        """
        Apply conversion function ``fn`` to every value in the specified columns.

        - ``columns`` - a single column or list of string column names to convert.
        - ``fn`` - a callable that takes a single argument, ``value``, and returns it converted.
        - ``output`` - optional string column name to write the results to (defaults to the input column).
        - ``output_type`` - if the output column needs to be created, this is the type that will be used
          for the new column.
        - ``drop`` - boolean, should the original column be dropped once the conversion is complete?
        - ``multi`` - boolean, if ``True`` the return value of ``fn(value)`` will be expected to be a
          dictionary, and new columns will be created for each key of that dictionary.
        - ``where`` - a SQL fragment to use as a ``WHERE`` clause to limit the rows to which the conversion
          is applied, for example ``age > ?`` or ``age > :age``.
        - ``where_args`` - a list of arguments (if using ``?``) or a dictionary (if using ``:age``).
        - ``show_progress`` - boolean, should a progress bar be displayed?

        See :ref:`python_api_convert`.
        """
        ...

    def build_insert_queries_and_params(self, extracts, chunk, all_columns, hash_id, upsert, pk, conversions, num_records_processed, replace, ignore): # -> list[tuple[str, list[Unknown]]]:
        ...

    def insert_chunk(self, alter, extracts, chunk, all_columns, hash_id, upsert, pk, conversions, num_records_processed, replace, ignore): # -> None:
        ...

    def insert(self, record: Dict[str, Any], pk=..., foreign_keys=..., column_order: Optional[Union[List[str], Default]] = ..., not_null: Optional[Union[Set[str], Default]] = ..., defaults: Optional[Union[Dict[str, Any], Default]] = ..., hash_id: Optional[Union[str, Default]] = ..., alter: Optional[Union[bool, Default]] = ..., ignore: Optional[Union[bool, Default]] = ..., replace: Optional[Union[bool, Default]] = ..., extracts: Optional[Union[Dict[str, str], List[str], Default]] = ..., conversions: Optional[Union[Dict[str, str], Default]] = ..., columns: Optional[Union[Dict[str, Any], Default]] = ...) -> Table:
        """
        Insert a single record into the table. The table will be created with a schema that matches
        the inserted record if it does not already exist, see :ref:`python_api_creating_tables`.

        - ``record`` - required: a dictionary representing the record to be inserted.

        The other parameters are optional, and mostly influence how the new table will be created if
        that table does not exist yet.

        Each of them defaults to ``DEFAULT``, which indicates that the default setting for the current
        ``Table`` object (specified in the table constructor) should be used.

        - ``pk`` - if creating the table, which column should be the primary key.
        - ``foreign_keys`` - see :ref:`python_api_foreign_keys`.
        - ``column_order`` - optional list of strings specifying a full or partial column order
          to use when creating the table.
        - ``not_null`` - optional set of strings specifying columns that should be ``NOT NULL``.
        - ``defaults`` - optional dictionary specifying default values for specific columns.
        - ``hash_id`` - optional name of a column to create and use as a primary key, where the
          value of thet primary key will be derived as a SHA1 hash of the other column values
          in the record. ``hash_id="id"`` is a common column name used for this.
        - ``alter`` - boolean, should any missing columns be added automatically?
        - ``ignore`` - boolean, if a record already exists with this primary key, ignore this insert.
        - ``replace`` - boolean, if a record already exists with this primary key, replace it with this new record.
        - ``extracts`` - a list of columns to extract to other tables, or a dictionary that maps
          ``{column_name: other_table_name}``. See :ref:`python_api_extracts`.
        - ``conversions`` - dictionary specifying SQL conversion functions to be applied to the data while it
          is being inserted, for example ``{"name": "upper(?)"}``. See :ref:`python_api_conversions`.
        - ``columns`` - dictionary over-riding the detected types used for the columns, for example
          ``{"age": int, "weight": float}``.
        """
        ...

    def insert_all(self, records, pk=..., foreign_keys=..., column_order=..., not_null=..., defaults=..., batch_size=..., hash_id=..., alter=..., ignore=..., replace=..., truncate=..., extracts=..., conversions=..., columns=..., upsert=...) -> Table:
        """
        Like ``.insert()`` but takes a list of records and ensures that the table
        that it creates (if table does not exist) has columns for ALL of that data.
        """
        ...

    def upsert(self, record, pk=..., foreign_keys=..., column_order=..., not_null=..., defaults=..., hash_id=..., alter=..., extracts=..., conversions=..., columns=...) -> Table:
        """
        Like ``.insert()`` but performs an ``UPSERT``, where records are inserted if they do
        not exist and updated if they DO exist, based on matching against their primary key.

        See :ref:`python_api_upsert`.
        """
        ...

    def upsert_all(self, records, pk=..., foreign_keys=..., column_order=..., not_null=..., defaults=..., batch_size=..., hash_id=..., alter=..., extracts=..., conversions=..., columns=...) -> Table:
        """
        Like ``.upsert()`` but can be applied to a list of records.
        """
        ...

    def add_missing_columns(self, records: Iterable[Dict[str, Any]]) -> Table:
        ...

    def lookup(self, column_values: Dict[str, Any]): # -> Any | None:
        """
        Create or populate a lookup table with the specified values.

        ``db["Species"].lookup({"name": "Palm"})`` will create a table called ``Species``
        (if one does not already exist) with two columns: ``id`` and ``name``. It will
        set up a unique constraint on the ``name`` column to guarantee it will not
        contain duplicate rows.

        It well then inserts a new row with the ``name`` set to ``Palm`` and return the
        new integer primary key value.

        See :ref:`python_api_lookup_tables` for more details.
        """
        ...

    def m2m(self, other_table: Union[str, Table], record_or_iterable: Optional[Union[Iterable[Dict[str, Any]], Dict[str, Any]]] = ..., pk: Optional[Union[Any, Default]] = ..., lookup: Optional[Dict[str, Any]] = ..., m2m_table: Optional[str] = ..., alter: bool = ...): # -> Table:
        """
        After inserting a record in a table, create one or more records in some other
        table and then create many-to-many records linking the original record and the
        newly created records together.

        For example::

            db["dogs"].insert({"id": 1, "name": "Cleo"}, pk="id").m2m(
                "humans", {"id": 1, "name": "Natalie"}, pk="id"
            )

        See :ref:`python_api_m2m` for details.

        - ``other_table`` - the name of the table to insert the new records into.
        - ``record_or_iterable`` - a single dictionary record to insert, or a list of records.
        - ``pk`` - the primary key to use if creating ``other_table``.
        - ``lookup`` - same dictionary as for ``.lookup()``, to create a many-to-many lookup table.
        - ``m2m_table`` - the string name to use for the many-to-many table, defaults to creating
          this automatically based on the names of the two tables.
        - ``alter`` - set to ``True`` to add any missing columns on ``other_table`` if that table
          already exists.
        """
        ...

    def analyze_column(self, column: str, common_limit: int = ..., value_truncate=..., total_rows=...) -> ColumnDetails:
        """
        Return statistics about the specified column.

        See :ref:`python_api_analyze_column`.
        """
        ...



class View(Queryable):
    def exists(self): # -> Literal[True]:
        ...

    def __repr__(self): # -> str:
        ...

    def drop(self, ignore=...): # -> None:
        ...

    def enable_fts(self, *args, **kwargs):
        ...



def chunks(sequence, size): # -> Generator[chain[Unknown], None, None]:
    ...

def jsonify_if_needed(value): # -> float | str:
    ...

def resolve_extracts(extracts: Optional[Union[Dict[str, str], List[str], Tuple[str]]]) -> dict:
    ...

def validate_column_names(columns): # -> None:
    ...
