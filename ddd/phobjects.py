from __future__ import annotations
from collections import UserDict
from itertools import repeat

import json
import sqlite3
import time
from collections.abc import Sequence, Mapping, MutableMapping, Iterator
from datetime import datetime
from enum import Enum
from functools import total_ordering
from pprint import pprint
from sqlite3 import Connection
from typing import (Any, ClassVar, Generic, NewType, Optional, Type, TypeVar,
                    Union)

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

PHID = NewType("PHID", str)

class Status(Enum):
    Open = "open"
    Closed = "closed"
    Resolved = "closed"
    Duplicate = "closed"
    Declined = "closed"
    Unknown = "unknown"




def isPHID(value: str):
    return isinstance(value, str) and value.startswith("PHID-")


def PHIDType(phid: PHID) -> Union[Type[PhabObjectBase], str]:
    parts = phid.split("-")
    phidtype = parts[1]
    if phidtype in PHIDTypes.__members__:
        classname = PHIDTypes[phidtype].value
        return classname
    return phidtype


TID = TypeVar("TID")
T = TypeVar("T")


class SubclassCache(Generic[TID, T]):

    instances: ClassVar[dict[TID, T]] = {}
    subclasses: ClassVar[dict[str, type]] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        __class__.subclasses[cls.__name__] = cls

    @classmethod
    def subclass(cls, classname: str, default: Type[T] = None) -> Union[Type[T], None]:
        return cls.subclasses.get(classname, default)

    @classmethod
    def byid(cls, id: TID) -> Union[T, None]:
        obj = cls.instances.get(id)
        return obj


class PhabObjectBase(UserDict, dict):
    phid: PHID
    id: int = 0
    data: dict = {}
    name: str
    fullName: str
    dateCreated: datetime
    dateModified: datetime
    status: Status

    def __init__(self, phid: PHID, **kwargs):
        super().__init__(**kwargs)
        self.phid = PHID(phid)
        self.name = "(Unknown object)"
        self.status = Status("unknown")
        self.fullName = ""

    def __getattr__(self, attr:str) -> Any:
        if attr in self.data:
            return self.data[attr]
        raise AttributeError(f'{__name__!r} has no attribute {attr!r}')

    def __setattr__(self, name: str, value: Any) -> None:
        self.data[name] = value
        object.__setattr__(self, name, value)

    def __setitem__(self, name, value):
        self.data[name] = value
        object.__setattr__(self, name, value)

    def __delattr__(self, attr):
        if attr in self.data:
            del(self.data[attr])
        object.__delattr__(self, attr)

    def __str__(self) -> str:
        return self.name if len(self.name) else self.phid

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
        super().__init__(phid)
        if "dateCreated" in kwargs.keys():
            self.dateCreated = datetime.fromtimestamp(kwargs["dateCreated"])
            del kwargs["dateCreated"]
        else:
            self.dateCreated = datetime.fromtimestamp(time.time())

        if "dateModified" in kwargs.keys():
            self.dateModified = datetime.fromtimestamp(kwargs["dateModified"])
            del kwargs["dateModified"]
        else:
            self.dateModified = self.dateCreated
        if len(kwargs):
            self.update(kwargs)



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
    def instance(cls, phid: PHID, data:Optional[Mapping] = None) -> PhabObjectBase:
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
    def resolve_phids(cls, conduit, cache:Optional[DataCache]=None):
        phids = [phid for phid in cls.instances.keys()]

        if cache:
            objs = cache.load(phids)
            for data in objs:
                phid = data['phid']
                phids -= phid
                cls.instance(phid).update(data)

        res = conduit.raw_request(method="phid.query", args={"phids": phids})

        objs = res.json()
        for key, vals in objs["result"].items():
            cls.instances[key].update(vals)


class User(PHObject):
    pass


class Project(PHObject):
    pass


class ProjectColumn(PHObject):
    pass


class Task(PHObject):
    def update(self, data:MutableMapping):
        if 'fields' in data.keys():
            super().update(data['fields'])
            del(data['fields'])
        super().update(data)


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
        "has-project": 41
    }
    rel_by_id = { val:key for key, val in rel_by_name.items() }


class Event(PHObject):
    """ Phabricator Calendar Event """
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
    __slots__ = ('fromPHID', 'toPHID', 'object', 'relation')

    fromPHID:Optional[PHID]
    toPHID:PHID
    object:PhabObjectBase
    relation:Optional[PhabObjectBase]

    def __init__(self, toPHID:PHID, fromPHID:Optional[PHID] = None):
        self.toPHID = toPHID
        self.fromPHID = fromPHID
        self.object = PHObject.instance(self.toPHID)
        if fromPHID:
            self.relation = PHObject.instance(fromPHID)
        else:
            self.relation = None

    def __repr__(self) -> str:
        return "PHIDRef('%s')" % self.toPHID

    def __str__(self) -> str:
        return self.toPHID


def json_object_hook(obj:dict):
    """ Instantiate PHID objects during json parsing """

    phid = obj.get('phid', None)

    for k, v in obj.items():
        if not k == 'phid' and not isinstance(v, PHIDRef) and isPHID(v):
            obj[k] = PHIDRef(v, phid)
    if phid and isPHID(phid):
        return PHObject.instance(phid=phid, data=obj)
    else:
        return obj


class DataCache(object):
    con:sqlite3.Connection

    replace_phobject = """
    REPLACE INTO phobjects (phid,   name, dateCreated, dateModified, data)
    VALUES                 (   ?,      ?,           ?,            ?,    ?)
    """

    def __init__(self, db):
        self.con = sqlite3.connect(db)
        self.con.row_factory = sqlite3.Row()
        self.con.execute(
            """CREATE TABLE if not exists phobjects (
                id real,
                phid TEXT PRIMARY KEY,
                authorPHID text,
                name TEXT,
                fullname TEXT,
                dateCreated real,
                dateModified real,
                status TEXT,
                data TEXT
            ); """)

    def load(self, phids):
        placeholders = ",".join(repeat("?", len(phids)))
        select = f"SELECT * FROM phobjects where phid in ({placeholders})"
        if isinstance(phids, list):
            return self.con.executemany(select, phids)
        else:
            return self.con.execute(select, phids)

    def row(self, item):
        data = json.dumps(item)
        return (item.phid, item.name, item.dateCreated, item.dateModified, data)

    def store_all(self, items:Sequence[PHObject]):
        rows = [self.row(item) for item in items]
        self.con.executemany(self.replace_phobject, rows)

    def store_one(self, item:PHObject):
        values = self.row(item)
        self.con.execute(self.replace_phobject, values)
