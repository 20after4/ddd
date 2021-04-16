import pprint
from enum import Enum
from collections import deque
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

class Data(object):
    data = None

    def __init__(self, data):
        # print(type(data))
        self.data = data

    def __getattr__(self, attr):
        #print(f"get:{attr}:{self.data[attr]}")

        return self.__getitem__(attr)

    def __getitem__(self, item):
        itemdata = self.data[item]
        if isinstance(itemdata, list):
            return DataList(itemdata)
        elif isinstance(itemdata, dict):
            return Data(itemdata)
        else:
            return itemdata

    def __dir__(self):
        return self.data.keys()

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


class QueryBuilder(object):

    def __init__(self, data):
        self.data = data
        self.query = deque()

    def __getitem__(self, key):
        self.query.append(Token.ITEM)
        self.query.append(key)
        return self

    def __getattr__(self, key):
        self.query.append(Token.ATTR)
        self.query.append(key)
        return self
