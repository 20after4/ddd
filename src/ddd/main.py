#!/usr/bin/env python3

from pprint import pprint
from ddd.phobjects import PHObject, register_sqlite_adaptors
import ddd
import json
from pathlib import Path
from typing import Optional

import typer
from sqlite_utils.db import Database
from typer import Argument as Arg
from typer import Context
from typer import Option as Opt
from click import Group

from ddd.boardmetrics import cli as boardmetrics
from ddd.phab import Conduit
from ddd.version import __version__

APP_NAME = "ddd"
APP_DIR = Path(typer.get_app_dir(APP_NAME))

app = typer.Typer()
app.add_typer(boardmetrics, name="metrics", help="Build phabricator metrics")

try:
    from ddd.trainblockers import cli as trainblockers

    app.add_typer(trainblockers, name="train", help="Train stats and utilities")
except ImportError:
    pass


@app.callback()
def main(
    ctx: Context,
    conduit_url: Optional[str] = Opt(
        None, envvar="CONDUIT_URL", help="API endpoint URL"
    ),
    token: Optional[str] = Opt(
        None,
        envvar="CONDUIT_TOKEN",
        help=(
            "Conduit token for authenticated api access. Defaults to "
            + "looking in in ~/.arcrc or environment."
        ),
    ),
    db: Path = Opt(APP_DIR / "metrics.db", envvar="DDD_DB"),  # type: Path
):
    ctx.meta["conduit"] = Conduit(conduit_url, token)
    if not db.parent.exists():
        db.parent.mkdir(0o755, True)
    ctx.meta["db_path"] = db
    register_sqlite_adaptors()
    ctx.meta["db"] = Database(db)
    PHObject.db = ctx.meta["db"]
    PHObject.conduit = ctx.meta['conduit']


@app.command()
def version():
    from ddd.version import __version__
    print(__version__)

@app.command()
def request(
    ctx: Context,
    method: str = Arg(None, help="Conduit method name."),
    params: str = Arg(None, help="Parameters in JSON format."),
):
    db = ctx.meta["db"]
    PHObject.db = db
    p = json.loads(params)  # type: dict
    c = ctx.meta["conduit"]
    cursor = c.request(method, p)
    with db.conn:
        for project in cursor.result["data"]:
            project.save()
            while "parent" in project and project.parent:
                project = project.parent
                project.save()
    db.conn.commit()


from datasette.cli import serve

click = typer.main.get_group(app)
click.add_command(serve, "serve")  # type: ignore

if __name__ == "__main__":
    click()


def cli():
    click()
