from __future__ import annotations
from abc import abstractproperty
from dataclasses import dataclass

from typing import TYPE_CHECKING, Deque

if TYPE_CHECKING:
    from ddd.phab import Conduit

import datetime
import json
import sqlite3
import time
from collections import UserDict, defaultdict, deque
from collections.abc import Mapping, MutableMapping, Sequence, ValuesView
from enum import Enum
from functools import total_ordering
from itertools import repeat
from typing import (
    Any,
    ClassVar,
    Generic,
    Iterable,
    Optional,
    Type,
    TypeVar,
    Union,
    cast,
)

from rich.console import Console
from sqlite_utils.db import Database, NotFoundError, Table

console = Console()

"""
 Phabricator Objects
 PHObject and its subclasses are proxy objects that model
 the relationships among objects in Phabricator's database.

 Phabricator defines the relationships between objects by using PHIDs
 which are long semi-structured strings that uniquely identify objects
 and also carry simple type information about the object.

 A PHID is made up of the string 'PHID' followed by several tokens
 delimited by a '-', the first token indicates the type with 4 uppercase
 ascii letters, the rest of the PHID is an arbitrary unique identifier string

 Some known PHID types are enumerated in PHIDTypes class below.

 """


class EmptyArg:
    """Sentinal Value"""

    pass


class PHIDError(ValueError):
    def __init__(self, msg):
        self.msg = msg

    def __repr__(self):
        return f"PHIDError: {self.msg}"


class PhabObjectBase(UserDict, dict):
    phid: PHID
    id: int
    name: str
    fullName: str
    dateCreated: datetime.datetime
    dateModified: datetime.datetime
    status: Status

    def __init__(self, phid: PHID, **kwargs):
        super().__init__(**kwargs)
        self.data.setdefault("name", "")
        self.data.setdefault("status", Status.Unknown)

        self.phid = PHID(phid)

    def __getattr__(self, attr: str) -> Any:
        data = object.__getattribute__(self, "data")
        if attr in data:
            return data[attr]
        if attr.find("."):
            parts = attr.split(".", 1)
            if parts[0] in data and parts[1]:
                return data[parts[0]][parts[1]]
        return super(UserDict, self).__getattribute__(attr)

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "data":
            return object.__setattr__(self, name, value)
        data = object.__getattribute__(self, "data")
        data[name] = value

    def __delattr__(self, attr):
        if attr in self.data:
            del self.data[attr]
        object.__delattr__(self, attr)

    def __getitem__(self, item: str) -> Any:
        return self.__getattr__(item)

    def __str__(self) -> str:
        return self.name if hasattr(self, "name") else self.phid

    def __repr__(self) -> str:
        return f'{self.__class__.__name__}(name="{self.name}", phid="{self.phid}")'


class PHID(str):
    """
    PHID is a class for validated PHID strings.

    Like strings, PHIDs are immutable.

    PHIDs are identifiers that represent phabricator objects.

    They include the type of object as a 4 character abbreviation in the prefix,

    The format is "PHID-{type}-{randomized-string}"
    """

    def instance(self) -> PhabObjectBase:
        """instance() will figure out the appropriate subclass
        of PHObject to use, ret*urning a placeholder instance."""
        return PHObject.instance(self)

    def __new__(cls, value: str) -> PHID:
        return super().__new__(cls, value)

    def __conform__(self, protocol):
        if protocol is sqlite3.PrepareProtocol:
            return str(self)


class Status(Enum):
    Open = "open"
    Progress = "progress"
    Closed = "closed"
    Resolved = "closed"
    Duplicate = "closed"
    Declined = "closed"
    Unknown = "unknown"

    def __conform__(self, protocol):
        if protocol is sqlite3.PrepareProtocol:
            return self.value

    def __str__(self):
        return self.value


def isPHID(value) -> bool:
    if isinstance(value, PHIDRef):
        return True
    if not isinstance(value, (PHID, str)):
        return False
    return value.startswith("PHID-")


def PHIDType(phid: PHID) -> Type[PHObject]:
    """Find the class for a given PHID string. Returns a reference to the
    matching subclass or to PHObject when there is no match."""
    try:
        if isinstance(phid, PHIDRef):
            parts = phid.toPHID.split("-")
        else:
            parts = phid.split("-")
        phidtype = parts[1]
        if phidtype in PHIDTypes.__members__:
            classtype = PHIDTypes[phidtype].value
            return classtype
        return PHObject
    except IndexError:
        return PHObject


TID = TypeVar("TID")
T = TypeVar("T")


class SubclassCache(Generic[TID, T]):
    # a generic base class that keeps track of it's subclasses and instances.
    instances: ClassVar[dict[TID, T]] = {}
    subclasses: ClassVar[dict[str, Type[T]]] = {}
    _derived_tables: dict[str, DerivedTable] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        __class__.subclasses[cls.__name__] = cls

    @classmethod
    def subclass(cls, classname: str, default: Type = None) -> Type:
        if default is None:
            default = cls
        return cls.subclasses.get(classname, default)

    @classmethod
    def byid(cls, id: TID) -> Union[T, None]:
        obj = cls.instances.get(id)
        return obj


class DerivedTable:
    table_name: str
    table: Table
    pk: str

    def __init__(self, table_name: str, pk: str, **mappings):
        self.table_name = table_name
        self.pk = pk
        self.mappings = mappings
        self.table = None  # type: ignore

    def __get__(self, instance, owner=None):
        return self

    def __set_name__(self, owner, name):
        self.__objclass__ = owner

        if owner._derived_tables is SubclassCache._derived_tables:
            owner._derived_tables = {}
        owner._derived_tables[name] = self

    def row(self, obj: PHObject):
        if not self.table:
            self.table = cast(
                Table,
                PHObject.db.table(
                    self.table_name, alter=True, pk=self.pk  # type: ignore
                ),
            )
        column_keys = self.mappings
        rec = {
            col: str(getattr(obj, key))
            for col, key in column_keys.items()
            if key[0] != "_"
        }
        return rec


PHO = TypeVar("PHO", bound=PhabObjectBase)


def _filter(iterable):
    for k, v in iterable:
        if k[0] == "_":
            continue
        elif isinstance(v, PHObject):
            yield k, v.phid
        else:
            yield k, v


@total_ordering
class PHObject(PhabObjectBase, SubclassCache[PHID, PhabObjectBase]):
    """
    PHObjects represent Phabricator objects such as Users and Tasks.
    This class handles caching and insures that there is at most one instance
    per unique phid.
    """

    _type_name = None

    @classmethod
    def typename(cls):
        if cls._type_name is not None:
            return cls._type_name
        else:
            return cls.__name__

    db: ClassVar[Database]
    conduit: ClassVar[Conduit]
    table: ClassVar[Table]
    savequeue: ClassVar[deque] = deque()

    def __init__(self, phid: PHID, **kwargs):
        dateCreated = (
            kwargs.pop("dateCreated") if "dateCreated" in kwargs else time.time()
        )
        dateModified = (
            kwargs.pop("dateModified") if "dateModified" in kwargs else dateCreated
        )
        super().__init__(phid)
        self.dateCreated = datetime.datetime.fromtimestamp(dateCreated)
        self.dateModified = datetime.datetime.fromtimestamp(dateModified)

    def __eq__(self, other: object):
        if isinstance(other, PhabObjectBase):
            return self.dateModified == other.dateModified
        return NotImplemented

    def __lt__(self, other: object):
        if isinstance(other, PhabObjectBase):
            return self.dateModified < other.dateModified
        return NotImplemented

    def get_table(self) -> Table:
        if hasattr(self.__class__, "table") and self.__class__.table is not None:
            return self.__class__.table

        name = self.__class__.__name__
        table = Table(PHObject.db, name, pk="phid", alter=True)
        self.__class__.table = table
        return table

    def save(self, data: Optional[MutableMapping] = None):
        if not data:
            data = self.data
        for t in type(self)._derived_tables.values():
            derived_row = t.row(self)
            t.table.upsert(derived_row, alter=True)

        table = self.get_table()
        if table:
            record = {k: v for k, v in _filter(data.items())}
            table.upsert(record, alter=True)

    def load(self):
        try:
            table = self.get_table()
            data = table.get(self.phid)
            self.update(data)
        except NotFoundError as e:
            console.log(e)

        return self

    @property
    def loaded(self) -> bool:
        return len(self.__dict__.keys()) > 1

    @classmethod
    def instance(
        cls, phid: PHID, data: Optional[Mapping] = None, save: bool = False
    ) -> PHObject:
        obj = __class__.byid(phid)
        if not obj:
            phidtype = PHIDType(phid)
            if isinstance(phidtype, str):
                phidtype = __class__.subclass(phidtype, cls)
            obj = phidtype(phid)
            __class__.instances[phid] = obj
        if data:
            obj.update(data)
            if save:
                obj.save()
        return obj #type:ignore

    @classmethod
    def resolve_phids(cls, conduit: Optional[Conduit] = None, cache: Optional[DataCache] = None):
        phids = {phid: True for phid in __class__.instances.keys()}

        if cache:
            objs = cache.load([phid for phid in phids])
            for data in objs:
                phids.pop(data["phid"])

        if len(phids) == 0:
            # no more phids to resolve.
            return cls.instances
        phids = [phid for phid in phids.keys()]
        if not conduit:
            conduit = PHObject.conduit
        res = conduit.raw_request(method="phid.query", args={"phids": phids})

        objs = res.json()
        if len(objs["result"]) < 1:
            return __class__.instances

        new_instances = []
        for key, vals in objs["result"].items():
            instance = __class__.instance(phid=PHID(key), data=vals)
            new_instances.append(instance)

        if cache:
            cache.store_all(new_instances)

        return __class__.instances


class PHObjectWithFields(PHObject):
    def update(self, *args, **kwds):
        data = args[0]
        if "fields" in data.keys():
            fields_data = data.pop("fields")
            super().update(fields_data)
        super().update(data)


class User(PHObject):
    pass


@dataclass
class TimeSpan:
    start: datetime.datetime
    end: Optional[datetime.datetime] = None
    state: Optional[str] = None

    def duration(self):

        if self.end:
            delta = self.end - self.start
        else:
            delta = datetime.datetime.now() - self.start
        return delta.total_seconds()


class TimeSpanMetric:
    spans: Deque
    last: Optional[TimeSpan]
    key: Optional[str]
    project: Any

    def __init__(self):
        self.spans = deque()
        self.last = None
        self._task = 0
        self.project = None
        self.key = None
        self._value = None

    def start(self, ts, state="open") -> TimeSpanMetric:
        if self.last:
            self.end(ts - 1)
        ts = datetime.datetime.fromtimestamp(ts)
        self.last = TimeSpan(start=ts, state=state)
        return self

    def started(self):
        return self.last is not None

    def ended(self):
        return self.last is None and len(self.spans) > 0

    def empty(self):
        return self.last is None and len(self.spans) == 0

    def end(self, ts, state=None, implied_start=True) -> TimeSpanMetric:
        if not self.last:
            if not implied_start:
                return self
            self.start(ts - 1)
            assert self.last is not None
        if isinstance(ts, str):
            ts = int(ts)
        ts = datetime.datetime.fromtimestamp(ts)
        self.last.end = ts
        if state:
            self.last.state = state

        self.spans.append(self.last)
        self.last = None
        return self

    def val(self, v=EmptyArg):
        if v is EmptyArg:
            return self.value
        self.value = v
        return self

    @property
    def value(self):
        return self.key if self._value is None else self._value

    @value.setter
    def value(self, v):
        self._value = v

    @property
    def task(self):
        return self._task

    @task.setter
    def task(self, val):
        if isinstance(val, str):
            val = int(val[1:]) if val[0] == "T" else int(val)
        self._task = val

    def __repr__(self) -> str:
        return f"TimeSpanMetric(t={self.task} p={self.project} last={self.last} spans={self.spans})"


class MetricsMixin:
    _metrics: defaultdict[Any, TimeSpanMetric]
    phid: PHID

    def metrics(self, is_started=True, is_ended=True):
        """Retrieve metrics, optionally filtered by their state"""
        return {
            k: v
            for k, v in self._metrics.items()
            if ((v.last is None == is_ended) or (v.last is not None == is_started))
        }

    def close(self, ts, state=None):
        """Record the end of a metric's time period"""
        for k in self._metrics:
            m = self._metrics[k]
            if m.last is not None:
                m.end(ts, state)

    def metric(self, metric: TimeSpanMetric = None, **kwds) -> TimeSpanMetric:
        """Create a metric instance for a given task+project pair"""
        if "key" in kwds and kwds["key"] is not None:
            key = kwds["key"]
        else:
            key = self.phid

        if metric is not None:
            self._metrics[key] = metric
        else:
            metric = self._metrics[key]

        for k in kwds:
            if hasattr(metric, k):
                setattr(metric, k, kwds[k])

        return metric

    def all_metrics(self):
        return self._metrics


class Project(PHObjectWithFields, MetricsMixin):
    _tasks: MutableMapping[PHID, Task]
    _columns: MutableMapping[PHID, ProjectColumn]
    _default: Optional[ProjectColumn] = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._columns = {}
        self._tasks = {}
        self._metrics = defaultdict(TimeSpanMetric)
        self._metrics["project"] = self["phid"]

    def metric(self, task) -> TimeSpanMetric:
        return super().metric(key=task, task=task, value=self.phid)

    def default_column(self) -> ProjectColumn:
        if self._default:
            return self._default
        ref = KKV.get(self.phid, "default_column", default=None)
        self._default = ref.object
        return self._default

    def columns(self):
        if self._columns and len(self._columns):
            return self._columns
        col = ProjectColumn(PHID("PHID-PCOL-"))
        cols = col.get_table().rows_where("project_phid=?", [self.phid])
        self._columns = {}
        for col in cols:
            phid = col["phid"]
            self._columns[phid] = cast(
                ProjectColumn, PHObject.instance(phid, col, False)
            )
        return self._columns


class ProjectColumn(PHObjectWithFields):
    _type_name = "Column"

    derive_columns = DerivedTable(
        "columns",
        "column_phid",
        project_name="project.name",
        column_name="name",
        project_phid="project.phid",
        column_phid="phid",
        status="status",
        proxyPHID="proxyPHID",
        dateCreated="dateCreated",
        dateModified="dateModified",
        is_default="isDefaultColumn",
    )


class Task(PHObjectWithFields, MetricsMixin):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._metrics = defaultdict(TimeSpanMetric)

    def metric(
        self, key: str, metric: Optional[TimeSpanMetric] = None
    ) -> TimeSpanMetric:
        return super().metric(key=key, metric=metric, task=self.phid)


class Commit(PHObject):
    pass


class FeedStory(PHObject):
    pass


class Application(PHObject):
    pass


class Transaction(PHObject):
    rel_by_name = {
        "has-subtask": 3,
        "has-parent": 4,
        "merge-in": 62,
        "close-as-duplicate": 63,
        "has-project": 41,
    }
    rel_by_id = {val: key for key, val in rel_by_name.items()}


class Event(PHObject):
    """Phabricator Calendar Event"""

    pass


class Paste(PHObject):
    """Phabricator Paste"""

    pass


class Phurl(PHObject):
    """Phurl URL"""

    pass


class DifferentialRevision(PHObject):
    _type_name = "Revision"
    pass


class EdgeType(Enum):
    TASK_COMMIT = 1
    COMMIT_TASK = 2
    SUB_TASK = 3
    PARENT_TASK = 4
    PROJECT_MEMBER = 13
    SUBSCRIBER = 21
    OBJECT_FILE = 25
    FILE_OBJECT = 26
    PROJECT_TAG = 41
    OBJECT_MENTION = (
        51  # Incoming mentions, see PhabricatorObjectMentionedByObjectEdgeType
    )
    MENTION_OBJECT = (
        52  # Outgoing Mentions, see PhabricatorObjectMentionsObjectEdgeType
    )
    DUPLICATE_TASK = 63


class PHIDTypes(Enum):
    PHOB = PHObject
    PROJ = Project
    TASK = Task
    CMIT = Commit
    CEVT = Event
    XACT = Transaction
    STRY = FeedStory
    APPS = Application
    PCOL = ProjectColumn
    USER = User
    PSTE = Paste
    PHRL = Phurl
    DREV = DifferentialRevision


class PHIDRef(object):
    __slots__ = ("fromPHID", "toPHID", "object", "relation")

    fromPHID: Optional[PHID]
    toPHID: PHID
    object: PhabObjectBase
    relation: Optional[PhabObjectBase]

    def __init__(self, toPHID: PHID, fromPHID: Optional[PHID] = None):
        if isinstance(toPHID, PHIDRef):
            self.toPHID = toPHID.toPHID
        else:
            self.toPHID = toPHID
        self.fromPHID = fromPHID
        self.object = PHObject.instance(self.toPHID)
        if fromPHID:
            self.relation = PHObject.instance(fromPHID)
        else:
            self.relation = None

    def __repr__(self) -> str:
        if self.fromPHID:
            return f"PHIDRef( from {self.fromPHID} => to {self.toPHID})"
        return f"PHIDRef('{self.toPHID}', object='{self.object}')"

    def __str__(self) -> str:
        return self.toPHID

    def __eq__(self, other) -> bool:
        return (
            other is self.object
            or (
                isinstance(other, PHIDRef)
                and other.toPHID == self.toPHID
                and other.fromPHID == self.fromPHID
            )
            or (isPHID(other) and other == self.toPHID)
        )

    def __lt__(self, other: PHIDRef):
        if isinstance(other, PHIDRef):
            return self.toPHID < other.toPHID
        return NotImplemented

    def __hash__(self):
        return hash((self.toPHID, self.fromPHID))

    def __conform__(self, protocol):
        if protocol is sqlite3.PrepareProtocol:
            return str(self.toPHID)


def sql_adapt_phid(phid: PHID | PHIDRef) -> bytes:
    return str(phid).encode("ascii")


def sql_convert_phid(s: bytes) -> PHIDRef | str:
    phid = PHID(s.decode("ascii"))
    return PHIDRef(phid)


def sql_encode_json(d) -> bytes:
    encoder = PHObjectEncoder()
    return encoder.encode(d).encode("utf8")


def sql_convert_json(blob: bytes):
    return json.loads(blob.decode("utf8"))


def sqlite_connect(db_path: str | bytes) -> sqlite3.Connection:
    register_sqlite_adaptors()
    con = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
    con.row_factory = sqlite3.Row
    return con


def sqlite_insert_statement(
    table: str, keys: Sequence | Iterable, replace: bool = False
) -> str:
    if not isinstance(keys, Sequence):
        keys = [key for key in keys]
    placeholders = ", ".join([":" + key for key in keys])
    statement = "REPLACE" if replace else "INSERT"
    return f"{statement} into {table}({','.join(keys)}) values ({placeholders});"


def adapt_datetime(ts: datetime.datetime) -> float:
    return ts.timestamp()


_registered_adapters = False


def register_sqlite_adaptors():
    global _registered_adapters
    if not _registered_adapters:
        sqlite3.register_adapter(dict, sql_encode_json)
        sqlite3.register_adapter(list, sql_encode_json)
        sqlite3.register_adapter(tuple, sql_encode_json)
        sqlite3.register_converter("phid", sql_convert_phid)
        sqlite3.register_adapter(datetime.datetime, adapt_datetime)
        _registered_adapters = True
        from sqlite_utils.db import COLUMN_TYPE_MAPPING

        COLUMN_TYPE_MAPPING.update(  # type: ignore
            {PHIDRef: "TEXT", Status: "TEXT", "<enum 'Status'>": "text"}
        )


class JsonStringifyEncoder(json.JSONEncoder):
    def default(self, o):
        return o.__str__()


def json_object_hook(obj: dict):
    """Instantiate PHID objects during json parsing"""

    phid = obj.get("phid", None)

    for k, v in obj.items():
        if not k == "phid" and not isinstance(v, PHIDRef) and isPHID(v):
            obj[k] = PHIDRef(v, phid)
    if phid and isPHID(phid):
        return PHObject.instance(phid=phid, data=obj)
    else:
        return obj


SQLType_types: MutableMapping[str, Type] = {}


def SQLType(
    name: str, pythontype: Type[T], sqlkeyword: Optional[str] = None
) -> Type[T]:
    def sql_type(x):
        return pythontype(x)

    sql_type.__name__ = name
    sql_type.__supertype__ = pythontype
    sql_type.sqlkw = sqlkeyword if sqlkeyword else name

    SQLType_types[name] = sql_type
    return cast(Type[T], sql_type)


class PHObjectEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, PHObject):
            data = {k: v for k, v in _filter(o.data.items())}
            if len(data) < 1:
                return o.__str__()

        if isinstance(o, PHIDRef):
            return o.toPHID
        if isinstance(o, datetime.datetime):
            return o.isoformat()
        if isinstance(o, sqlite3.Row):
            return [i for i in o]
        if isinstance(o, bytes):
            return o.decode("utf8")
        if hasattr(o, "__str__"):
            return o.__str__()
        return json.JSONEncoder.default(self, o)


class NotFound:
    """Sentinal value"""

    pass


class KKVCache(object):
    phab: Conduit
    db: Database

    def get_column(self, phid):
        phid = PHID(phid)
        col = phid.instance()
        data = self.select_one("select * from columns where phid=?", (phid))
        col.update(data)
        return col

    def select_one(self, sql, bindings):
        with self.db.conn as conn:
            cur = conn.execute(sql, bindings)
            res = cur.fetchone()
            return res

    def __init__(self, db: Database, phab: Conduit):
        self.console = Console(stderr=True)
        self.cache = {}
        self.phab = phab
        self.db = db

        PHObject.db = db

        cur = db.execute(
            "select project_phid,column_phid,is_default,proxyPHID from columns",
            (),
        )

        for row in cur:
            if row["is_default"] == "True":
                key = (row["project_phid"], "default_column")
                self.cache[key] = PHIDRef(row["column_phid"])
            key = (row["column_phid"], "project_phid")
            self.cache[key] = PHIDRef(row["project_phid"], row["column_phid"])
            if isPHID(row["proxyPHID"]):
                column_proxy = PHIDRef(row["proxyPHID"], row["column_phid"])
                key = (row["column_phid"], "proxyPHID")
                self.cache[key] = column_proxy

    def get(self, *args, default=None):
        return self.cache.get(args, default)

    def get_project(self, obj):
        return self.get(obj, "project_phid")

    def get_proxy(self, parent_column):
        """Get the project that a proxy column points to"""
        return self.get(parent_column, "proxyPHID")

    def get_default_column(self, project_phid):
        key = (project_phid, "default_column")
        col = self.cache.get(key, NotFound)
        if col is NotFound:
            col = self.select_one(
                "select column_phid, column_name from columns where project_phid=? and is_default='True'",
                [project_phid],
            )
            col = PHIDRef(PHID(col["column_phid"]), PHID(project_phid)) if col else None
            self.cache[key] = col
        return col

    def resolve_column(self, phid):
        ptype = PHIDType(phid)
        res = None
        if ptype is ProjectColumn:
            milestone_project = self.get_proxy(phid)
            if milestone_project:
                res = self.get_default_column(milestone_project)
                if not res:
                    res = PHIDRef(milestone_project)
        elif ptype is Project:
            res = self.get_default_column(phid)

        # if res is None:
        #    res = PHIDRef(phid)
        # console.log(repr(res))
        return res


class types:
    PRIMARYKEY = SQLType("PRIMARYKEY", str, "PRIMARY KEY")
    REAL = SQLType("REAL", float)
    TEXT = SQLType("TEXT", str)
    timestamp = SQLType("timestamp", datetime.datetime)


class DataCache(object):
    @staticmethod
    def placeholders(count):
        return ",".join(repeat("?", count))

    con: sqlite3.Connection
    table_name: str = "phobjects"

    phid: types.PRIMARYKEY
    name: types.TEXT
    dateCreated: types.timestamp
    dateModified: types.timestamp
    status: types.TEXT
    type: types.TEXT
    data: types.TEXT

    def cols(self) -> Sequence:
        cols = []
        for field in self.__annotations__.items():
            thetype = field[1][6:]
            if thetype in SQLType_types:
                thetype = SQLType_types[thetype]
                cols.append((field[0], thetype))
        return cols

    def sql_insert(self, cols=None, replace=True):
        if not cols:
            cols = [col[0] for col in self.cols()]

        op = "REPLACE" if replace else "INSERT"
        sql = f"""{op} INTO {self.table_name} ({", ".join(cols)}) VALUES ({self.placeholders(len(cols))})"""
        return sql

    def __init__(self, db: Database | sqlite3.Connection, create_schema=True):

        if isinstance(db, Database):
            self.con = db.conn
        else:
            self.con = db

        if create_schema:
            cols = ",".join([col[0] + " " + col[1].sqlkw for col in self.cols()])
            with self.con as c:
                sql = f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} ({cols});
                    CREATE UNIQUE INDEX IF NOT EXISTS pk_{self.table_name} ON {self.table_name} (phid);
                    CREATE INDEX IF NOT EXISTS type ON {self.table_name} (type);
                    CREATE INDEX IF NOT EXISTS name ON {self.table_name} (name);
                    """
                c.executescript(sql)
            self.con.commit()
            self.cur = self.con.cursor()

        self.encoder = JsonStringifyEncoder()

    def load(self, phids):
        res = []
        with self.con as con:
            if isinstance(phids, (PHID, str)):
                phids = [phids]
            ph = self.placeholders(len(phids))
            select = f"SELECT phid,data FROM {self.table_name} where phid in ({ph})"
            for row in con.execute(select, phids):
                phid = row["phid"]
                if isinstance(phid, bytes):
                    phid = phid.decode("utf8")
                phid = PHID(phid)
                data = json.loads(row["data"])
                res.append(PHObject.instance(phid, data))
        return res

    def row(self, item: PhabObjectBase):
        row = list()
        for col_name, col_type in self.cols():
            if col_name == "data":
                row.append(self.encoder.encode(item.data))
            else:
                val = item[col_name] if col_name in item else None
                row.append(val)
        return row

    def store_all(self, items: Sequence[PHObject] | ValuesView[PhabObjectBase]):
        sql = self.sql_insert(replace=True)
        with self.con as con:
            for item in items:
                row = self.row(item)
                con.execute(sql, row)
            con.commit()

    def store_one(self, item: PHObject):
        self.store_all([item])


KKV: KKVCache
DATA: DataCache


def init_caches(db: Database, phab):
    global KKV
    global DATA
    KKV = KKVCache(db, phab)
    DATA = DataCache(db)
    return KKV, DATA
