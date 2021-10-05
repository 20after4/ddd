from __future__ import annotations
from collections import deque
from collections import UserDict
from collections import UserList
from collections.abc import Callable
from collections.abc import Iterable
from collections.abc import MutableMapping
from collections.abc import MutableSequence
from collections.abc import Iterator
from typing import Optional, Union


class PropertyMatcher(object):
    """Usage example:

    def process_transactions(transactions):
        mapper = PropertyMatcher()

        @mapper("transactionType=core:edge", "meta.edge:type=41")
        def edge(t):
            ''' match project edge transactions '''
            oldValue = [PHIDRef(p) for p in t["oldValue"]]
            newValue = [PHIDRef(p) for p in t["newValue"]]
            return [["projects", '', oldValue, newValue]]

        for taskid, t in transactions.result.items():
            st = sorted(t, key=itemgetter("dateCreated"))
            for record in st:
                for row in mapper.run(record):
                    if row:
                        yield row


    transactions = get_some_transactions()

    for row in process_transactions(transactions):
        # do something with row

    """

    def __init__(self, context: MutableMapping = None):
        self.matchers = []
        self.patterns = []
        self.context_stack = deque()
        self.context = context if context else {}

    def get_context(self, context=None):
        if context is None:
            return self.context
        return context

    def new_context(self, context=None):
        if context is None:
            context = {}
        self.context_stack.append(self.context)
        self.context = context
        return context

    def run(self, obj, context=None):
        matches = []
        context = self.get_context(context)

        for matcher in self.matchers:
            res = matcher(obj, context)
            if res:
                matches += res

        return matches

    def run_async(self, obj, context=None):
        context = self.get_context(context)

        for matcher in self.matchers:
            res = matcher(obj, context)
            if not res:
                continue
            for row in res:
                yield row

    def __call__(self, *args):
        if len(args) == 1 and isinstance(args[0], Callable):
            self.fn = args[0]
        else:
            self.patterns = []
            for arg in args:
                arg = str(arg)
                pat, val = arg.split("=", 1)
                pattern = (pat.split("."), val)
                self.patterns.append(pattern)

        def wrapper(func):
            patterns = self.patterns

            def matcher(obj, context):
                orig = obj
                matched = False
                for pattern in patterns:
                    matched = False
                    try:
                        pattern, val = pattern
                        obj = orig
                        for item in pattern:
                            if item == "*":
                                matched = True
                                break
                            obj = obj[item]
                        if str(val) == str(obj) or (val == "*" and obj):
                            matched = True
                    except Exception:
                        matched = False
                    if not matched:
                        return False
                if matched:
                    return func(orig, context)

            self.matchers.append(matcher)
            return matcher

        return wrapper


class DataIterator(Iterator):
    """DataIterator iterates over a list of raw data, returning each record
    wrapped in a Data instance.
    """

    data: Iterator

    def __init__(self, data: Iterable, parent=None):
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
        if self._parent:
            return iter(self._parent)
        return iter([])

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
