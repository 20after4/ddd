import pprint
from enum import Enum
from collections import UserDict, UserList, deque
from collections.abc import MutableMapping, Iterable
import sqlite3

con = sqlite3.connect(':memory:')


class DataIterator(object):
    """ DataIterator iterates over a list of raw data, returning each record
    wrapped in a Data instance.
    """
    data = None
    def __init__(self, data):
        self.data = data.__iter__()

    def __iter__(self):
        return self

    def __next__(self):
        return Data(next(self.data))

class Data(MutableMapping):
    data = None

    def __init__(self, data, parent=None):
        # print(type(data))
        self.data = data
        if parent:
            self.parent = parent

    def __getattr__(self, attr):
        return self.__getitem__(attr)

    def __getitem__(self, item):
        itemdata = self.data[item]
        if isinstance(itemdata, (dict, UserDict)):
            return Data(itemdata, self)
        elif isinstance(itemdata, (list, UserList, Iterable)):
            return DataList(itemdata, self)
        else:
            return itemdata

    def __dir__(self):
        return self.data.keys() + self.__dict__.keys()

    def __iter__(self):
        return DataIterator(self.data)

    def __len__(self):
        return len(self.data)

    def __contains__(self, item):
        return item in self.data

    def __repr__(self):
        return pprint.pformat(self.data, indent=2)


class DataList(Data):
    def __getattr__(self, attr):
        raise AttributeError()

    def __dir__(self):
        return dir(self.__dict__)


class Token(Enum):
    ATTR = 1
    ITEM = 2
    PARENT = 3


class QueryBuilder(object):

    def __init__(self, data):
        self.data = data
        self.query = deque()

    def __getitem__(self, key):
        self.query.append((Token.ITEM, key))

        return self

    def __getattr__(self, key):
        self.query.append((Token.ATTR, key))
        return self

    def parent(self):
        self.query.append((Token.PARENT))


