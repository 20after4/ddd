import re
import sqlite3
from collections import deque
from operator import itemgetter
from pprint import pprint
from typing import Iterable, Mapping, Set, Tuple

from rich.console import Console
from rich.status import Status

from ddd.data import PropertyMatcher
from ddd.phab import Conduit
from ddd.phobjects import (
    PHID,
    KKVCache,
    PHIDRef,
    PHObject,
    Project,
    Task,
    TimeSpanMetric,
    sqlite_insert_statement,
)

RE_AT_MENTION = re.compile(r'@([\w\-\d]+)[\b:]?',
     re.MULTILINE|re.IGNORECASE)

def maptransactions(
    project_phid,
    transactions: Mapping,
    con: sqlite3.Connection,
    console: Console,
    phab: Conduit,
    sts: Status,
    cache: KKVCache,
) -> Tuple[Iterable[Iterable], Set[Project], Set[TimeSpanMetric], Iterable]:
    mapper = PropertyMatcher()

    # functions decorated with @ttype will take a transaction object and distill
    # it down to just the information we care about.
    # add new functions to match other transaction types.
    # ids = [id for id in tasks.keys()]

    all_metrics = set()
    all_projects = set()

    @mapper("transactionType=core:edge", "meta.edge:type=41")
    def projects(t, context: Task):
        """
        edge transactions point to related objects such as subtasks,
        mentioned tasks and project tags.
        The type of relationship is specified by an integer in
        meta['edge:type']. Edge type constants are defined in
        the enum `ddd.phobjects.EdgeType`
        """
        oldValue = [p for p in t["oldValue"]]
        newValue = [p for p in t["newValue"]]
        res = []
        res.append(["projects", "global", oldValue, newValue])
        ts = int(t["dateCreated"])
        for p in newValue:
            default_column = cache.get(p, "default_column")
            if default_column:
                ref = p
                res.append(("columns", ref, None, default_column))

            if "core.create" in t["meta"]:
                state = "created"
            else:
                state = "tagged"
            proj = PHObject.instance(p)
            assert(isinstance(proj, Project))
            context._all_projects.add(proj)
            metric = proj.metric(task=t["taskID"]).start(ts, state)
            all_metrics.add(metric)
            context.metric(key=p, metric=metric)
            proxyColumn = cache.get_proxy(p)
            if proxyColumn and proxyColumn.fromPHID:
                parent_project = cache.get_project(proxyColumn.fromPHID)
                parent_metric = parent_project.object.metric(task=t['taskID'], key=(context, 'column'))
                parent_metric.start(ts, proxyColumn.fromPHID)
                context.metric(key=(proxyColumn.fromPHID, 'column'), metric=parent_metric)
        for p in oldValue:
            metric = PHObject.instance(p).metric(task=t['taskID']).end(ts, "untagged")
            metric = context.metric(key=p, metric=metric)
            all_metrics.add(metric)

        # if 'core.create' in t['meta']:
        #    res.append(["projects", ])
        return res

    @mapper("transactionType=core:edge", "meta.edge:type=51")
    def mention_this(t, context):
        return [("mention-this", None, t["taskID"], None)]

    @mapper("transactionType=core:comment")
    def comment(t, ctx):
        comments = t['comments']
        if comments and isinstance(comments, str):
            m = RE_AT_MENTION.findall(comments)
            mentions = [['@mention', None, t['taskID'], mention.lower()] for mention in set(m)]
            return [("comment", None, None, None), *mentions]
        else:
            return None


    @mapper("transactionType=core:edge", "meta.edge:type=3")
    def subtask(t, context):
        removed = [p for p in t["oldValue"] if p not in t["newValue"]]
        added = [p for p in t["newValue"] if p not in t["oldValue"]]
        res = []
        for r in removed:
            res.append(["removed_subtask", None, t["taskID"], PHIDRef(r)])

        for a in added:
            res.append(["added_subtask", None, t["taskID"], PHIDRef(a)])
        return res

    @mapper("transactionType=unblock")
    def unblock(t, context):
        return [("subtask_resolved", "global", t["taskID"], None)]

    @mapper("transactionType=status")
    def status(t, context: Task):
        ts = int(t["dateCreated"])
        state = t["newValue"]
        # console.log('status', task.phid, hash(task), state)
        if state in Task.OPEN_STATUS:
            # for metric in context.metrics(is_started=False):
            #    metric.start(state)
            context.metric(key="status").start(ts, state)
        elif state in Task.CLOSED_STATUS:
            #for metric in context.metrics(is_ended=False):
            #    metric.end(ts, state)
            context.metric(key="status").end(ts, state)
        return [("status", "global", t["oldValue"], t["newValue"])]

    @mapper("transactionType=reassign")
    def assign(t, context):
        ts = int(t["dateCreated"])
        if t["oldValue"]:
            context.metric(key="assign").val(t["oldValue"]).end(ts-1, "reassign")
        context.metric(key="assign").val(t["newValue"]).start(ts, "assign")
        return [("assign", "global", t["oldValue"], t["newValue"])]

    @mapper("transactionType=core:create")
    def create(t, context):
        context.metric(key="create").val('open').start(ts, 'open')
        return [("status", "global", None, "open")]

    @mapper("transactionType=core:columns")
    def columns(t, context):
        ts = int(t["dateCreated"])
        newv = t["newValue"]
        res = []
        for obj in newv:
            if not obj["fromColumnPHIDs"]:
                continue
            tocol = str(obj["columnPHID"])
            fromcols = obj["fromColumnPHIDs"]
            target = cache.resolve_column(tocol)

            for fromcol in fromcols:
                fromcol = str(fromcol)
                source = cache.resolve_column(fromcol)
                ref = obj["boardPHID"]
                res.append(("columns", ref, fromcol, tocol))
                project = PHObject.instance(ref)
                metric = project.metric(task=t["taskID"], key=(context,'column')).start(ts, tocol)
                context.metric(key=(ref,tocol), metric=metric)
                metric.key = 'column'

                if source or target:

                    for i in ("fromPHID", "toPHID"):
                        srcphid = getattr(source, i, None)
                        tophid = getattr(target, i, None)
                        if srcphid and tophid:

                            metric = project.metric(key=(context,'column'), task=t["taskID"]).start(
                                ts, tophid
                            )
                            context.metric(key=(ref, tophid), metric=metric)
                            metric.key = 'column'
                            res.append(("milestone", ref, srcphid, tophid))
        return res

    metrics = {}
    days = 60 * 60 * 24
    datapoints = deque()
    insert_stmt = None
    total = len(transactions)
    cnt = 0
    taskids = []
    for taskid, t in transactions.items():
        cnt += 1
        st = sorted(t, key=itemgetter("dateCreated"))
        task = Task(f"T{taskid}")
        taskids.append(taskid)
        sts.update(
            f"Processing transactions for T{taskid} ([bold green]{cnt}/{total}[/bold green])"
        )
        for record in st:
            ts = int(record["dateCreated"])
            trnsid = record["transactionID"]

            for row in mapper.run(record, task):
                what, project, old, new = row

                if old or new:
                    if not isinstance(new, list):
                        new = [new]
                    if not isinstance(old, list):
                        old = [old]
                    for o in old:
                        datapoints.append((trnsid, ts, project, o, taskid, what, -1))
                    for n in new:
                        datapoints.append((trnsid, ts, project, n, taskid, what, 1))

                    for o in old:
                        for n in new:
                            event = {
                                "ts": ts,
                                "task": taskid,
                                "user": PHIDRef(record["authorPHID"]),
                                "event": what,
                                "project": project,
                                "old": o,
                                "new": n,
                            }
                            if insert_stmt is None:
                                insert_stmt = sqlite_insert_statement(
                                    "events", event, replace=True
                                )
                            try:
                                con.execute(insert_stmt, event)
                            except sqlite3.InterfaceError as e:
                                print(event)
                                continue

        start = task.startofwork()
        if start:
            all_metrics.add(start)

        for metric in task.all_metrics().values():
            all_metrics.add(metric)
        for proj in task._all_projects:
            all_projects.add(proj)



    con.commit()
    return datapoints, all_projects, all_metrics, taskids
