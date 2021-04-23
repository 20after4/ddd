from enum import Enum
from typing import ClassVar


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

class PHIDTypes(Enum):
    PHOB = "PHObject"
    PROJ = "Project"
    TASK = "Task"
    CMIT = "Commit"
    XACT = "Transaction"
    STRY = "FeedStory"
    APPS = "Application"
    PCOL = "ProjectColumn"


def isPHID(value):
    return isinstance(value, str) and value.startswith("PHID-")


def PHIDType(phid):
    parts = phid.split('-')
    phidtype = parts[1]
    if phidtype in PHIDTypes.__members__:
        classname = PHIDTypes[phidtype].value
        return classname
    return phidtype

class PHObject(object):
    """
    PHObjects represent Phabricator objects such as Users and Tasks.
    This class handles caching and insures that there is at most one instance
    per unique phid.
    """

    id: int = 0
    phid: str = ""

    name: str = ""
    dateCreated: int = 0
    dateModified: int = 0

    instances: ClassVar[dict] = {}
    subclasses: ClassVar[dict] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        __class__.subclasses[cls.__name__] = cls

    def __init__(self, phid, **kwargs):
        self.phid = phid
        self.__dict__.update(kwargs)

    def __str__(self):
        return self.fullName

    def __repr__(self):
        return f"<{self.__module__}.{self.__class__.__name__}{self.__dict__}>"

    def update(self, data):
        self.__dict__.update(data)

    @property
    def loaded(self):
        return len(self.__dict__.keys()) > 1

    @classmethod
    def instance(cls, phid):
        if phid in __class__.instances:
            return __class__.instances[phid]
        phidtype = PHIDType(phid)
        typecls = __class__.subclasses.get(phidtype, cls)
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
    pass
