from __future__ import annotations
from collections import UserDict
from collections import UserList
from collections.abc import Collection
from collections.abc import Iterable
from collections.abc import MutableMapping
from collections.abc import MutableSequence
from collections.abc import Iterator

import json
import pprint
from typing import Optional, Union





class DataIterator(Iterator):
    """DataIterator iterates over a list of raw data, returning each record
    wrapped in a Data instance.
    """

    data: Iterator

    def __init__(self, data:Iterable, parent=None):
        self.data = data.__iter__()
        self.parent = parent

    def __iter__(self):
        return self

    def __next__(self):
        item = next(self.data)
        return wrapitem(item, self.parent)


class Data(MutableMapping):
    Data_Class = locals().__class__

    data: Union[dict, list, MutableMapping, MutableSequence]
    _parent: Optional[Data_Class]

    def __new__(cls, data, *args, **kwargs):
        if isinstance(data, MutableMapping):
            subcls = DataDict
        elif isinstance(data, MutableSequence):
            subcls = DataList
        else:
            raise TypeError(
                "data argument must be a list or a mapping, not %s" % type(data)
            )
        if super().__new__ is object.__new__ and cls.__init__ is not object.__init__:
            obj = super().__new__(subcls)
        else:
            obj = super().__new__(subcls, *args, **kwargs)
        return obj

    def __init__(self, data, parent: Data_Class = None):
        self.data = data
        if parent:
            self._parent = parent
        else:
            self._parent = None

    def parent(self):
        return self._parent

    def siblings(self):
        """Iterate over the children of this element's parent data structure"""
        return iter(self._parent)

    def __getattr__(self, attr):
        return self.__getitem__(attr)

    def __getitem__(self, item):
        item = self.data[item]
        return wrapitem(item, self)

    def __iter__(self):
        return DataIterator(self.data, self)

    def __dir__(self):
        return dir(self.data)


class DataDict(Data, UserDict):
    data: MutableMapping


class DataList(Data, UserList):
    data: MutableSequence

    def __delitem__(self, v):
        del self.data[v]

    def __setitem__(self, item, val):
        self.data[item] = val


def wrapitem(item, parent=None):
    if isinstance(item, (Data, str)):
        return item
    if isinstance(item, (dict, UserDict)):
        return Data(item, parent)
    if isinstance(item, (list, UserList, Iterable)):
        return DataList(item, parent)
    return item
