#!/usr/bin/python3
from collections.abc import Callable
from operator import itemgetter
import pandas as pd
from IPython.display import display
from pprint import pprint

import ddd
from ddd.mw import MWVersion, version
from ddd.phab import Conduit
from ddd.phobjects import PHIDRef, PHObject, EdgeType
from ddd.data import PropertyMatcher

pd.options.display.max_columns = None
pd.options.display.max_rows = None
pd.options.display.max_colwidth = 50
pd.options.display.width = 400

#%%
phab = Conduit()
# find all train blocker tasks
r = phab.request(
    "maniphest.search",
    {
        "constraints": {"projects": ["release-engineering-team"]},
        "limit": "30",
        "attachments": {"projects": True, "columns": True},
    },
)
#%%

def gettransactions(taskids):
    mapper = PropertyMatcher()
    ids = [id for id in taskids.keys()]
    transactions = phab.request(
        "maniphest.gettasktransactions",
        {
            "ids": ids,
        },
    )
    # functions decorated with @ttype will take a transaction object and distill
    # it down to just the information we care about.
    # add new functions to match other transaction types.
    # ids = [id for id in tasks.keys()]

    @mapper("transactionType=core:edge", "meta.edge:type=41")
    def edge(t):
        """
        edge transactions point to related objects such as subtasks,
        mentioned tasks and project tags.
        The type of relationship is specified by an integer in
        meta['edge:type']. Edge type constants are defined in
        the enum `ddd.phobjects.EdgeType`
        """
        oldValue = [PHIDRef(p) for p in t["oldValue"]]
        newValue = [PHIDRef(p) for p in t["newValue"]]
        return [["projects", '', oldValue, newValue]]

    @mapper("transactionType=status")
    def status(t):
        return [("status",'', t["oldValue"], t["newValue"])]

    # @trnstype("unblock")
    def unblock(t):
        """a subtask was closed or otherwise changed status"""
        nv = t["newValue"]

        for item in nv.items():
            phid, action = item
            return [[action, PHIDRef(phid)]]

    # @trnstype("core:comment")
    def comment(t):
        # todo: we could check for the risky revision template here, if we care
        # to count that.
        nl = "\\n"
        txt = str(t["comments"]).replace("\n", nl)
        return [["comment", txt]]

    @mapper('ransactionType=core:customfield')
    def customfield(t):
        """Collect the version number from the release.version custom field"""
        nv = version(str(t["newValue"]))
        if nv:
            train["version"] = nv
        return None

    @mapper('transactionType=core:columns')
    def columns(t):
        newv = t["newValue"]
        res = []
        for obj in newv:
            fromcol = ""
            for col in obj["fromColumnPHIDs"]:
                fromcol = PHIDRef(col)
            res.append(('columns', obj["boardPHID"], fromcol, obj["columnPHID"]))
            return res

    for taskid, t in transactions.result.items():
        st = sorted(t, key=itemgetter("dateCreated"))
        for record in st:
            for row in mapper.run(record):
                if row:
                    newrow = [record['dateCreated'], "T" + taskid]
                    newrow.extend(row)
                    yield newrow

#%%

# r.fetch_all()
tasks = r.asdict()
# now collect all of the formatted transaction details
rows = [row for row in gettransactions(tasks)]

PHObject.resolve_phids(phab)

#%%
data = pd.DataFrame.from_records(
    rows,
    columns=["ts", "task", "description", "what", "from", "to"],
    index=["ts", "task"],
)
display(data)
