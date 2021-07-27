from __future__ import annotations

import datetime
import json
import sqlite3
import time
from collections import UserDict, deque
from collections.abc import Mapping, MutableMapping, Sequence, ValuesView
from enum import Enum
from functools import total_ordering
from importlib.resources import path
from itertools import repeat
from os import PathLike
from pathlib import Path
from pprint import pprint
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


class PHIDError(ValueError):
    def __init__(self, msg):
        self.msg = msg

    def __repr__(self):
        return f"PHIDError: {self.msg}"


class PHID(str):
    def instance(self) -> PhabObjectBase:
        return PHObject.instance(self)

    def __new__(cls, value: str) -> PHID:
        # return value
        return super().__new__(cls, value)


class Status(Enum):
    Open = "open"
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


def isPHID(value: Union[str, PHID]) -> bool:
    if not isinstance(value, (PHID, str)):
        return False
    return value.startswith("PHID-")


def PHIDType(phid: PHID) -> Union[Type[PhabObjectBase], str]:
    """Find the class for a given PHID string"""
    try:
        parts = phid.split("-")
        phidtype = parts[1]
        if phidtype in PHIDTypes.__members__:
            classname = PHIDTypes[phidtype].value
            return classname
        return phidtype
    except IndexError:
        return phid


TID = TypeVar("TID")
T = TypeVar("T")


class SubclassCache(Generic[TID, T]):
    # a generic base class that keeps track of it's subclasses and instances.
    instances: ClassVar[dict[TID, T]] = {}
    subclasses: ClassVar[dict[str, Type[T]]] = {}

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


class PhabObjectBase(UserDict, dict):
    phid: PHID
    id: int = 0
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
        return super(UserDict, self).__getattribute__(attr)

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "data":
            return object.__setattr__(self, name, value)
        data = object.__getattribute__(self, "data")
        data[name] = value

    __getitem__ = __getattr__

    def __delattr__(self, attr):
        if attr in self.data:
            del self.data[attr]
        object.__delattr__(self, attr)

    def __str__(self) -> str:
        return self.name if hasattr(self, "name") else self.phid

    def __repr__(self) -> str:
        return f'{self.__class__.__name__}(name="{self.name}", phid="{self.phid}")'


PHO = TypeVar("PHO", bound=PhabObjectBase)


@total_ordering
class PHObject(PhabObjectBase, SubclassCache[PHID, PhabObjectBase]):
    """
    PHObjects represent Phabricator objects such as Users and Tasks.
    This class handles caching and insures that there is at most one instance
    per unique phid.
    """

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

    def __eq__(self, other: PhabObjectBase):
        if isinstance(other, PhabObjectBase):
            return self.dateModified == other.dateModified
        return NotImplemented

    def __lt__(self, other: PhabObjectBase):
        if isinstance(other, PhabObjectBase):
            return self.dateModified < other.dateModified
        return NotImplemented

    @property
    def loaded(self):
        return len(self.__dict__.keys()) > 1

    @classmethod
    def instance(cls, phid: PHID, data: Optional[Mapping] = None) -> PhabObjectBase:
        obj = __class__.byid(phid)
        if not obj:
            phidtype = PHIDType(phid)
            if isinstance(phidtype, str):
                phidtype = __class__.subclass(phidtype, cls)
            obj = phidtype(phid)
            __class__.instances[phid] = obj
        if data:
            obj.update(data)
        return obj

    @classmethod
    def resolve_phids(cls, conduit, cache: Optional[DataCache] = None):
        phids = {phid: True for phid in __class__.instances.keys()}
        # print(__class__, cls)
        # print("phids", phids, [phid for phid in __class__.instances.keys()])

        if cache:
            objs = cache.load([phid for phid in phids])
            for data in objs:
                phid = data["phid"]
                phids.pop(phid)

        if len(phids) == 0:
            # no more phids to resolve.
            return cls.instances
        phids = [phid for phid in phids.keys()]
        res = conduit.raw_request(method="phid.query", args={"phids": phids})
        # print(res)
        objs = res.json()
        new_instances = []
        for key, vals in objs["result"].items():
            instance = __class__.instance(phid=PHID(key), data=vals)
            new_instances.append(instance)

        if cache:
            cache.store_all(new_instances)

        return __class__.instances


class PHObjectWithFields(PHObject):
    def update(self, data: MutableMapping):
        if "fields" in data.keys():
            fields_data = data.pop("fields")
            super().update(fields_data)
        super().update(data)


class User(PHObject):
    pass


class Project(PHObject):
    pass


class ProjectColumn(PHObjectWithFields):
    status = ""
    isDefaultColumn: bool
    project: Mapping
    proxyPHID: PHIDRef
    policy: Mapping
    pass


class Task(PHObjectWithFields):
    pass


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
    MENTION = 51
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


class PHIDRef(object):
    __slots__ = ("fromPHID", "toPHID", "object", "relation")

    fromPHID: Optional[PHID]
    toPHID: PHID
    object: PhabObjectBase
    relation: Optional[PhabObjectBase]

    def __init__(self, toPHID: PHID, fromPHID: Optional[PHID] = None):
        self.toPHID = toPHID
        self.fromPHID = fromPHID
        self.object = PHObject.instance(self.toPHID)
        if fromPHID:
            self.relation = PHObject.instance(fromPHID)
        else:
            self.relation = None

    def __repr__(self) -> str:
        return f"PHIDRef('{self.toPHID}', object='{self.object}')"

    def __str__(self) -> str:
        return self.toPHID

    def __eq__(self, other) -> bool:
        return (
            other is self.object
            or (isinstance(other, PHIDRef) and other.object is self.object)
            or (isinstance(other, str) and isPHID(other) and other == self.toPHID)
        )

    def __conform__(self, protocol):
        if protocol is sqlite3.PrepareProtocol:
            return self.toPHID


def sql_adapt_phid(phid: PHID | PHIDRef) -> bytes:
    return str(phid).encode("ascii")


def sql_encode_json(d) -> bytes:
    encoder = PHObjectEncoder()
    return encoder.encode(d).encode("ascii")


def sql_convert_json(blob: bytes):
    return json.loads(blob.decode("ascii"))


def sql_convert_phid(s: bytes) -> PHIDRef:
    phid = PHID(s.decode("ascii"))
    return PHIDRef(phid)


def sqlite_connect(db_path: str | bytes) -> sqlite3.Connection:
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


# convert to and from phid objects
sqlite3.register_adapter(PHIDRef, sql_adapt_phid)
sqlite3.register_adapter(PHID, sql_adapt_phid)
sqlite3.register_adapter(dict, sql_encode_json)
sqlite3.register_adapter(list, sql_encode_json)
sqlite3.register_adapter(tuple, sql_encode_json)
sqlite3.register_converter("phid", sql_convert_phid)
sqlite3.register_adapter(datetime.datetime, adapt_datetime)


class JsonStringifyEncoder(json.JSONEncoder):
    def default(self, o):
        return o.__str__()
        return json.JSONEncoder.default(self, o)


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
            return o.data
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


class DataCache(object):
    @staticmethod
    def placeholders(count):
        return ",".join(repeat("?", count))

    PRIMARYKEY = SQLType("PRIMARYKEY", str, "PRIMARY KEY")
    REAL = SQLType("REAL", float)
    TEXT = SQLType("TEXT", str)
    timestamp = SQLType("timestamp", datetime.datetime)
    con: sqlite3.Connection
    table_name: str = "phobjects"

    phid: PRIMARYKEY
    name: TEXT
    dateCreated: timestamp
    dateModified: timestamp
    status: TEXT
    type: TEXT
    data: TEXT

    def cols(self) -> Sequence:
        cols = []
        for field in self.__annotations__.items():
            if field[1] in SQLType_types:
                thetype = SQLType_types[field[1]]
                cols.append((field[0], thetype))
        return cols

    def sql_insert(self, cols=None, replace=True):
        if not cols:
            cols = [col[0] for col in self.cols()]

        op = "REPLACE" if replace else "INSERT"
        sql = f"""{op} INTO {self.table_name} ({", ".join(cols)}) VALUES ({self.placeholders(len(cols))})"""
        return sql

    def __init__(self, db: Path | str = ":memory:", con: sqlite3.Connection = None):
        if con:
            self.con = con
        else:
            self.con = sqlite3.connect(db)

        self.con.row_factory = sqlite3.Row

        cols = ",".join([col[0] + " " + col[1].sqlkw for col in self.cols()])

        with self.con as c:
            c.executescript(
                f"""
                CREATE TABLE IF NOT EXISTS {self.table_name} ({cols});
                CREATE UNIQUE INDEX IF NOT EXISTS pk_{self.table_name} ON {self.table_name} (phid);
                CREATE INDEX IF NOT EXISTS type_status ON {self.table_name} (type, status);
                CREATE INDEX IF NOT EXISTS phid_name ON {self.table_name} (phid, name);
                """
            )
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
                    phid = phid.decode("ascii")
                phid = PHID(phid)
                data = json.loads(row["data"])
                res.append(PHObject.instance(phid, data))
        return res

    def row(self, item: PHObject):
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
