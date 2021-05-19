#!/usr/bin/python3

from collections import UserDict
from typing import Mapping
from ddd.phobjects import PHIDType, Task
from operator import itemgetter
import requests
import sys
import json
from pprint import pprint
import ddd
from ddd.phab import Conduit, ConduitException
from ddd.mw import version

phab = Conduit()

# find all train blocker tasks

r = phab.request(
    "maniphest.search",
    {
        "queryKey": "ZKaMIUs_NEXo",
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
        if len(ov) == 0 and len(nv) == 1 and PHIDType(nv[0]) is Task:
            return ("added", nv[0])
        elif len(ov) == 1 and len(nv) == 0 and PHIDType(ov[0]) is Task:
            return ("removed", nv[0])
        else:
            # ignore other edge types
            return None

    # a subtask was closed or otherwise changed status
    @ttype("unblock")
    def unblock(t):
        nv = t["newValue"]
        ov = t["oldValue"]
        for item in nv.items():
            phid, action = item
            return (action, phid)

    # a comment was added
    @ttype("core:comment")
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
                # print(trnstype)
                continue
            # format the transaction data using the matching formatter function
            formatted = formatters[trnstype](tr)
            # yield the result when there is one:
            if formatted:
                yield ('T'+tr['taskID'], tr["dateCreated"], tr['authorPHID'], *formatted)


# now collect all of the formatted transaction details
rows = [row for row in gettransactions(tasks)]


# now we could write a csv file or output the data to stdout
# for now, just output tsv:
for row in rows:
    print("\t".join(row))

if __name__ == "__main__":
    pass
