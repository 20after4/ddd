#!/usr/bin/python3
from operator import itemgetter
from pprint import pprint
from typing import Any, List

import pandas as pd
import typer
from sqlite_utils.db import Database

from ddd.mw import MWVersion, version
from ddd.phab import Conduit
from ddd.train_mapper import MetricCollector, train_transaction_mapper

cli = typer.Typer()


@cli.command()
def blockers(
    ctx: typer.Context,
    task_ids: List[str] = typer.Argument(None),
    help='One or more task ids, or "all"',
):
    """Collects metrics about MediaWiki train deployments.
    https://wikitech.wikimedia.org/wiki/Heterogeneous_deployment/Train_deploys
    """

    constraints = {
        "subtypes": ["release"],
    }  # type: dict[str, list[Any]]

    if len(task_ids) and task_ids[0] != "all":
        constraints["ids"] = [int(id.strip(" T")) for id in task_ids]

    phab = ctx.meta["conduit"]  # type:Conduit
    db = ctx.meta["db"]  # type:Database

    # find all train blocker tasks
    r = phab.request(
        "maniphest.search",
        {
            "constraints": constraints,
            "limit": "100",
            "attachments": {"projects": False, "columns": True},
        },
    )
    r.fetch_all()
    tasks = r.asdict()
    phids = {}
    ids = []
    for id, task in tasks.items():
        phids[int(id)] = task.phid
        ids.append(id)

    # else:
    #    ids = [int(id.strip(' T')) for id in task_ids]

    print("fetching tasks transactions for tasks: ", ids)

    r = phab.request(
        "maniphest.gettasktransactions",
        {"ids": ids},
    )
    task_transactions = r.result

    mapper, log = train_transaction_mapper()
    train_summary = db.table("train_summary", pk=["metric", "phid"], alter=True)

    train_blockers = db.table(
        "train_blockers", pk=["metric", "phid", "relid"], alter=True
    )
    train_props = db.table("train_props", pk=["tid", "key", "actor"], alter=True)
    train_comments = db.table("train_comments", alter=True)
    for tid, transactions in task_transactions.items():
        transactions = sorted(transactions, key=itemgetter("dateCreated"))
        phid = phids[int(tid)]
        context = mapper.new_context(MetricCollector(phid))
        context["conductor"] = task["ownerPHID"]
        for trns in transactions:
            res = mapper.run(trns, context)
        # PHObject.resolve_phids(phab)
        counts = {"mention": 0, "subtask": 0}
        for metric, data in context.items():

            if metric == "mention" or metric == "subtask":
                relatives, added, removed = data
                count = len(relatives)
                if len(relatives):
                    train_blockers.upsert_all(
                        [
                            {"metric": metric, "phid": phid, "relid": rel}
                            for rel in relatives
                        ]
                    )
                row = {
                    "tid": tid,
                    "phid": phid,
                    "metric": metric,
                    "added": added,
                    "removed": removed,
                    "count": count,
                }
                train_summary.upsert(row)
            else:

                if isinstance(data, dict):
                    for actor, value in data.items():
                        row = {
                            "tid": tid,
                            "key": metric,
                            "actor": actor,
                            "value": value,
                        }
                        train_props.insert(row, replace=True, alter=True)
                else:
                    if metric == "version":
                        data = str(data)
                    row = {"tid": tid, "key": metric, "actor": "*", "value": data}
                    train_props.insert(row, replace=True, alter=True)

            # elif metric == 'comment':
            #    train_comments.upsert([])

    # pprint(context)


def main():
    cli()


if __name__ == "__main__":
    cli()
