#!/usr/bin/python3
from operator import itemgetter

from ddd.mw import MWVersion, version
from ddd.phab import Conduit
from ddd.phobjects import PHIDRef, PHObject, EdgeType

#%%
def gettransactions(phab:Conduit, taskids):
    """a generator function that will yield formatted transaction details for a given list of task ids"""

    train: dict[str, MWVersion] = {"version": MWVersion("")}

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

    @ttype("core:edge")
    def edge(t):
        """edge transactions point to related objects such as subtasks, mentioned tasks and project tags.
            The type of relationship is specified by an integer in meta['edge:type']. Edge type constants
            are defined in the enum `ddd.phobjects.EdgeType`
        """
        ov = t["oldValue"]
        nv = t["newValue"]
        edgetype = t["meta"]["edge:type"]
        if edgetype != EdgeType.SUB_TASK.value:
            # ignore relationships other than subtasks
            # print('edgetype: %s' % edgetype)
            return None

        if len(ov) > len(nv):
            diff = set(ov).difference(nv)
            action = "removed"
        elif len(nv) > len(ov):
            diff = set(nv).difference(ov)
            action = "added"
        else:
            added = [("added", PHIDRef(phid)) for phid in nv]
            removed = [("removed", PHIDRef(phid)) for phid in ov]
            return added + removed

        tasklist = [PHIDRef(obj) for obj in diff]
        tasklist = tasklist[0] if len(tasklist) == 1 else tasklist
        return [(action, tasklist)]

    @ttype("unblock")
    def unblock(t):
        """ a subtask was closed or otherwise changed status"""
        nv = t["newValue"]

        for item in nv.items():
            phid, action = item
            return [(action, PHIDRef(phid))]

    @ttype("core:comment")
    def comment(t):
        # todo: we could check for the risky revision template here, if we care
        # to count that.
        nl = "\\n"
        txt = str(t["comments"]).replace("\n", nl)
        return [("comment", txt)]

    @ttype("core:customfield")
    def customfield(t):
        """Collect the version number from the release.version custom field"""
        nv = version(str(t["newValue"]))
        if nv:
            train["version"] = nv
        return None

    # ids = [id for id in tasks.keys()]
    ids = [id for id in taskids.keys()]

    transactions = phab.request("maniphest.gettasktransactions", {"ids": ids,},)

    for taskid, t in transactions.result.items():
        st = sorted(t, key=itemgetter("dateCreated"))

        for tr in st:

            trnstype = tr["transactionType"]
            if trnstype not in formatters.keys():
                # Ignore all transactions which do not have a matching formatter
                # you can uncomment the print statement below to see what other
                # transaction types are available:
                # print(trnstype)
                continue
            # format the transaction data using the matching formatter function
            actions = formatters[trnstype](tr)
            if not actions:
                continue
            # yield the result when there is one:
            for action in actions:
                yield (
                    "T" + tr["taskID"],
                    train["version"],
                    tr["dateCreated"],
                    tr["authorPHID"],
                    *action,
                )


#%%
def main():
    import pandas as pd
    from IPython.display import display

    pd.options.display.max_columns = None
    pd.options.display.max_rows = None
    pd.options.display.max_colwidth = None
    pd.options.display.width = 2000

    phab = Conduit()
    # find all train blocker tasks
    r = phab.request(
        "maniphest.search",
        {
            "constraints": {
                "subtypes": ["release"],
                # 'ids': ['281146'],
            },
            "limit": "50",
            "attachments": {"projects": True, "columns": True},
        },
    )

    r.fetch_all()
    tasks = r.asdict()
    # now collect all of the formatted transaction details
    rows = [row for row in gettransactions(phab, tasks)]
    PHObject.resolve_phids(phab)

    data = pd.DataFrame(
        rows, columns=["task", "version", "timestamp", "author", "action", "values"]
    )
    grouped = data.groupby(["version", "action"])
    display(grouped["values"].count())

if __name__ == '__main__':
    main()