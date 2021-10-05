import sqlite3
from typing import Union


from ddd.phobjects import PHIDType, isPHID, PHID, register_sqlite_adaptors
from datasette import hookimpl
from datasette.app import Datasette
from datasette.database import Database
import jinja2
import json


@hookimpl
def prepare_connection(conn: sqlite3.Connection):
    register_sqlite_adaptors()
    conn.create_function('phidtype', 1, PHIDType)
    conn.create_function("is_phid", 1, isPHID)


def A(href, label, target=None):
    if target:
        target = f' target="{target}"'
    return jinja2.Markup(
        '<a class="phid" title="{label}" href="{href}"{target}>{label}</a>'.format(
            href=jinja2.escape(href), label=jinja2.escape(label or "") or "&nbsp;",
            target=target
        )
    )


@hookimpl
def extra_template_vars(datasette):

    async def execute_query(sql, args=None, database=None):
        db = datasette.get_database(database)
        return (await db.execute(sql, args)).rows

    return {"sql": execute_query}


@hookimpl
def render_cell(
    value, column: str, table: Union[str, None], database: str, datasette: Datasette
) -> Union[str, None]:
    if isinstance(value, bytes):
        try:
            value = value.decode("ascii")
        except ValueError:
            return None
    if not isinstance(value, str):
        return None

    value = value.strip()

    if ( column in ['tid', 'task'] ):
        if value[0] == 'T' and value[1:].isdigit():
            value = value[1:]
        if value.isdigit():
            return A(
                href=f'https://phabricator.wikimedia.org/T{value}',
                label=f'T{value}',
                target='_blank'
            )

    if value[0:2] == '["' and value[-2:] == '"]':
        if len(value) == 34:
            value = value[2:-2]
        elif len(value) > 34:
            try:
                data = json.loads(value)
                data = [A(href=f'/metrics/phobjects/{phid}', label=phid) for phid in data]
                return jinja2.Markup(",<br> ".join(data))
            except ValueError:
                return None

    if isPHID(value):
        db = datasette.get_database('metrics') # type: Database

        try:
            _ = value.index(',')
            data = [
                A(href=f'/metrics/phobjects/{phid}', label=phid)
                for phid in value.split(',')
            ]
            return jinja2.Markup("<br>".join(data))
        except ValueError:
            return A(href=f'/metrics/phobjects/{value}', label=value)

    return None