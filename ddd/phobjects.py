from __future__ import annotations
from enum import Enum
from functools import total_ordering
from pydoc import classname
from symbol import classdef
import time
from typing import ClassVar, Dict, Generic, Mapping, NewType, Type, TypeVar, Union
from datetime import datetime

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


class PHIDTypes(Enum):
    PHOB = "PHObject"
    PROJ = "Project"
    TASK = "Task"
    CMIT = "Commit"
    XACT = "Transaction"
    STRY = "FeedStory"
    APPS = "Application"
    PCOL = "ProjectColumn"
    USER = "User"


def isPHID(value: str):
    return isinstance(value, str) and value.startswith("PHID-")


def PHIDType(phid: PHID):
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


class PhabObjectBase(object):
    phid: PHID
    id: int = 0

    name: str
    fullName: str
    dateCreated: datetime
    dateModified: datetime

    def __init__(self, phid: PHID):
        self.phid = phid

    def update(self, data: Mapping):
        self.__dict__.update(data)


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

        self.__dict__.update(kwargs)

    def __str__(self):
        return "%s (%s)" % (self.phid, self.fullName)

    def __repr__(self):
        # {self.__dict__}
        return f'<{self.__module__}.{self.__class__.__name__}(phid="{self.phid}", name="{self.name}")>'

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
    def instance(cls, phid: PHID) -> Union[PhabObjectBase, None]:
        if phid in __class__.instances:
            obj = __class__.byid(phid)
            return obj

        phidtype = PHIDType(phid)
        typecls = __class__.subclass(phidtype, cls)
        newinstance = typecls(phid)
        __class__.instances[phid] = newinstance
        return newinstance


class User(PHObject):
    pass


class Project(PHObject):
    pass


class ProjectColumn(PHObject):
    pass


class Task(PHObject):
    pass


class Transaction(PHObject):

    relationships = {
        "has-subtask": 3,
        "has-parent": 4,
        "merge-in": 62,
        "close-as-duplicate": 63,
    }

    pass
