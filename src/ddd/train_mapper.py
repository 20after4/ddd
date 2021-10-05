import copy
from collections import deque
from pprint import pprint
from typing import (
    Deque,
    Mapping,
    MutableMapping,
    MutableSequence,
    Sequence,
    Tuple,
    Union,
)

from ddd.data import PropertyMatcher
from ddd.mw import version as mwversion
from ddd.phobjects import PHID, EdgeType, PHIDRef


class MetricCollector(dict):
    def __init__(self, phid=None):
        super().__init__()
        self["phid"] = phid

    def count(self, metric_key: str, phid: Union[PHID, str] = "*", add: int = 1):
        metric = self.metric(metric_key)
        if phid not in metric:
            metric[phid] = add
        else:
            metric[phid] += add
        return self

    def metric(self, metric_key: str, default=None):
        if not metric_key in self:
            self[metric_key] = default if default else dict()
        return self[metric_key]


def train_transaction_mapper() -> Tuple[PropertyMatcher, Deque]:
    mapper = PropertyMatcher()
    log = deque()
    prototype = [{}, 0, 0]

    def transaction_delta(t: Mapping) -> Tuple[Sequence, Sequence]:
        """several phabricator transaction types encode the changes by
        storing the old and new value. This function accepts a transaction record
        (with oldValue and newValue) computes the delta and returns (added, removed)
        """
        removed = [p for p in t["oldValue"] if p not in t["newValue"]]
        added = [p for p in t["newValue"] if p not in t["oldValue"]]
        return (added, removed)

    def log_added_removed(
        ctx: MutableMapping[str, MutableSequence],
        key: str,
        ts: int,
        added: Sequence[PHID],
        removed: Sequence[PHID],
    ):

        if key in ctx.keys():
            val = ctx[key]
        else:
            val = copy.deepcopy(prototype)
            ctx[key] = val

        for phid in added:
            ref = PHIDRef(phid)
            if phid not in val[0]:
                val[1] += 1
                val[0][phid] = ref
            log.append((ts, ctx, "added", key, ref))
        for phid in removed:
            if phid in val[0]:
                ref = val[0]
                del val[0][phid]
                val[2] += 1
            else:
                ref = PHIDRef(phid)

            log.append((ts, ctx, "removed", key, ref))

        return val

    # @mapper("transactionType=core:edge", "meta.edge:type=41")
    def projects(t, ctx):
        """
        edge transactions point to related objects such as subtasks,
        mentioned tasks and project tags.
        The type of relationship is specified by an integer in
        meta['edge:type']. Edge type constants are defined in
        the enum `ddd.phobjects.EdgeType`
        """
        added, removed = transaction_delta(t)
        log_added_removed(ctx, "projects", t["dateCreated"], added, removed)
        return t

    OBJECT_MENTION = str(EdgeType.OBJECT_MENTION.value)

    @mapper("transactionType=core:edge", f"meta.edge:type={OBJECT_MENTION}")
    def mention_this(t, ctx):
        log_added_removed(ctx, "mention", t["dateCreated"], t["newValue"], [])
        ctx.count("mentioners", t["authorPHID"])
        return t

    MENTION_OBJECT = str(EdgeType.MENTION_OBJECT.value)

    @mapper("transactionType=core:edge", f"meta.edge:type={MENTION_OBJECT}")
    def mention_task(t, ctx):
        log_added_removed(ctx, "mention", t["dateCreated"], t["newValue"], [])
        ctx.count("mentioners", t["authorPHID"])
        return t

    @mapper("transactionType=core:edge", "meta.edge:type=3")
    def subtask(t, ctx):
        added, removed = transaction_delta(t)
        log_added_removed(ctx, "subtask", t["dateCreated"], added, removed)
        if len(removed):
            ctx.count("unblockers", t["authorPHID"])
        return t

    @mapper("transactionType=unblock")
    def unblock(t, ctx):
        if isinstance(t["oldValue"], Mapping) and len(t["oldValue"]):
            [
                phid,
            ] = t["oldValue"].keys()
            log_added_removed(ctx, "subtask", t["dateCreated"], [], [phid])
            ctx.count("unblockers", t["authorPHID"])
            return t

        # pprint(t)

    @mapper(
        "transactionType=core:customfield",
        "meta.customfield:key=std:maniphest:release.version",
    )
    def version(t, ctx):
        """Collect the version number from the release.version custom field"""
        nv = mwversion(str(t["newValue"]))
        if nv:
            ctx["version"] = str(t["newValue"])
        return None

    @mapper(
        "transactionType=core:customfield",
        "meta.customfield:key=std:maniphest:train.backup",
    )
    def backup_conductor(t, ctx):
        """Collect the backup train conductor"""
        ctx["backup_conductor"] = str(t["newValue"])
        return None

    @mapper("transactionType=reassign")
    def reassign(t, ctx):
        ctx["conductor"] = str(t["newValue"])

    @mapper("transactionType=status")
    def status(t, ctx):
        log.append((t["dateCreated"], ctx, "set", "status", t["newValue"]))
        if t["newValue"] in ("resolved", "declined"):
            ctx.count("resolvers", t["authorPHID"])
        return [("status", "global", t["oldValue"], t["newValue"])]

    @mapper("transactionType=core:comment")
    def comment(t, ctx):
        ctx.count("commenters", t["authorPHID"])

    # @mapper("transactionType=core:create")
    def create(t, ctx):
        return [("status", "global", None, "open")]

    # @mapper("transactionType=core:columns")
    def columns(t, ctx):
        pass

    return mapper, log
