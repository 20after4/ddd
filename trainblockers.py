#!/usr/bin/python3
import json
import sys
from collections import UserDict
from operator import itemgetter
from pprint import pprint
from typing import Mapping

import pandas as pd
import requests
from IPython.display import display

import ddd
from ddd.mw import version
from ddd.phab import Conduit, ConduitException
from ddd.phobjects import PHIDType, Task, PHObject

phab = Conduit()
pd.options.display.max_columns = None
pd.options.display.max_rows = None

# find all train blocker tasks

r = phab.request(
    "maniphest.search",
    {
        "queryKey": "ZKaMIUs_NEXo",
        "constraints": {
            'ids': ['249964'],
        },
        "limit": "50",
        "attachments": {"projects": False, "columns": False},
    },
)

r.fetch_all()

tasks = {task.id:task for task in r}


def gettransactions(taskids):
    """a generator function that will yield formatted transaction details for a given list of task ids"""

    formatters = {}

    def ttype(ttype):
        """decorate a function with @ttype("type") to match transactions of the
        given transactionType"""

        def decorate(f):
            setattr(f, "ttype", ttype)
            formatters[ttype] = f
            return f

        return decorate

    # functions decorated with @ttype will take a transaction object and distill
    # it down to just the information we care about.
    # add new functions to match other transaction types.

    # edges point to one of several related objects such as:
    # * subtask
    # * project tag,
    # * git commit
    # * differential revision

    @ttype("core:edge")
    def edge(t):
        ov = t["oldValue"]
        nv = t["newValue"]

        # some older phabricator transactions had a different format, fixup:
        if isinstance(nv, Mapping):
            nv = [key for key in nv.keys()]
        if isinstance(ov, Mapping):
            ov = [key for key in ov.keys()]

        # ... we only care about tasks:
        if len(ov) == 0 and len(nv) > 0 and PHIDType(nv[0]) is Task:
            return ("added", [obj for obj in map(PHObject.instance, nv)])
        elif len(ov) > 0 and len(nv) == 0 and PHIDType(ov[0]) is Task:
            return ("removed", [obj for obj in map(PHObject.instance, ov)])
        else:
            print("--- new %s --- old %s ---" % (len(nv), len(ov)))
            pprint(nv)
            pprint(ov)
            # ignore other edge types
            return None

    # a subtask was closed or otherwise changed status
    @ttype("unblock")
    def unblock(t):
        nv = t["newValue"]
        ov = t["oldValue"]
        for item in nv.items():
            phid, action = item
            return (action, PHObject.instance(phid))

    # a comment was added
    #@ttype("core:comment")
    def comment(t):
        # todo: we could check for the risky revision template here, if we care
        # to count that.
        nl = '\\n'
        txt = str(t["comments"]).replace("\n", nl)
        return ("comment", txt)

    @ttype("core:customfield")
    def customfield(t):
        nv = version(str(t['newValue']))
        if nv:
            return ('version', nv)

    #@ttype("core:columns")
    def columns(t):
        pprint(t)

    #@ttype("status")
    def status(t):
        pprint(t)


    transactions = phab.request(
        "maniphest.gettasktransactions",
        {
            "ids": tasks.keys(),
        },
    )

    for taskid, t in transactions.result.items():
        st = sorted(t, key=itemgetter("dateCreated"))
        task = tasks[int(taskid)]
        for tr in st:
            trnstype = tr["transactionType"]
            if trnstype not in formatters.keys():
                # Ignore all transactions which do not have a matching formatter
                # you can uncomment the print statement below to see what other
                # transaction types are available:
                print(trnstype)
                continue
            # format the transaction data using the matching formatter function
            formatted = formatters[trnstype](tr)
            # yield the result when there is one:
            if formatted:
                yield ('T'+tr['taskID'], tr["dateCreated"], tr['authorPHID'], *formatted)


# now collect all of the formatted transaction details
rows = [row for row in gettransactions(tasks)]
PHObject.resolve_phids(phab)
columns = ['task', 'timestamp', 'author','action','values']
data = pd.DataFrame(rows, columns=columns)
display(data)

if __name__ == "__main__":
    pass
