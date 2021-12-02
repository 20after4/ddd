import sqlite3
from typing import Collection, Sequence, Union
from urllib.request import Request

from datasette.facets import ColumnFacet, Facet
from datasette.utils import escape_sqlite, path_with_added_args, path_with_removed_args
import sqlite_utils
from sqlite_utils.db import NotFoundError
import ddd
from ddd.phab import Conduit


from ddd.phobjects import DataCache, PHIDType, Project, ProjectColumn, Task, isPHID, PHID, register_sqlite_adaptors, PHObject
from datasette.hookspecs import hookimpl
from datasette.app import Datasette
from datasette.database import Database, QueryInterrupted
from jinja2.utils import Markup, escape
import json

phab = Conduit()
cache = None

def phid_lookup(phid):
    global cache
    if not isPHID(phid):
        return phid
    phob = PHObject.instance(phid)
    PHObject.resolve_phids(phab)
    if not phob:
        return phid
    typename = phob.typename()
    return f"{typename}: {phob['name']}" if 'name' in phob else phid


@hookimpl
def prepare_connection(conn: sqlite3.Connection):
    global cache
    register_sqlite_adaptors()
    cache = DataCache(db = conn, create_schema=False)
    conn.create_function('phidtype', 1, PHIDType)
    conn.create_function("is_phid", 1, isPHID)
    conn.create_function('phid_lookup', 1, phid_lookup)

def A(href, label, target=None):
    if target:
        target = f' target="{target}"'
    return Markup(
        '<a class="phid" title="{label}" href="{href}"{target}>{label}</a>'.format(
            href=escape(href), label=escape(label or "") or "&nbsp;",
            target=target
        )
    )


@hookimpl
def extra_template_vars(datasette):
    async def all_subprojects(project:PHID):
        sql="""--sql
        WITH RECURSIVE parent_of(x, project_name, slug, uri, lvl) AS
        (
            SELECT
                phid AS x,
                name,
                '',
                '',
                0
            FROM
                Project p0
            WHERE
                phid = :project
            UNION ALL
            SELECT
                p1.phid AS phid,
                p1.name AS project_name,
                p1.slug as slug,
                p1.uri as uri,
                lvl + 1 AS lvl
            FROM
                Project p1
            JOIN
                parent_of p2 ON p1.parent = x
        )
        SELECT
            po.*,
            c.name AS column_name,
            c.phid AS column_phid
        FROM
            parent_of po
        JOIN
            ProjectColumn c ON c.project = po.x
        ORDER BY
            lvl,
            project_name,
            column_name;
        """

        db = datasette.get_database('metrics')

        args={'project':project}
        rows = (await db.execute(sql, args)).rows
        phids = [row.phid for row in rows]
        print(phids)
        return phids

    return {
        "all_subprojects": all_subprojects}


@hookimpl
def render_cell(
    value, column: str, table: Union[str, None], database: str, datasette: Datasette
) -> Union[str, None]:
    if column == 'duration':
        return str(int(int(value) / (60*60*24)))
    if isinstance(value, int):
        value = str(value)
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

    base_url = datasette.urls.path('/')

    if value[0:2] == '["' and value[-2:] == '"]':
        if len(value) == 34:
            value = value[2:-2]
        elif len(value) > 34:
            try:
                data = json.loads(value)
                data = [A(href=f'{base_url}metrics/phobjects/{phid}', label=phid) for phid in data]
                return Markup(",<br> ".join(data))
            except ValueError:
                return None

    if isPHID(value):
        #db = datasette.get_database('metrics') # type: Database

        try:
            _ = value.index(',')
            data = [
                A(href=f'{base_url}metrics/phobjects/{phid}', label=phid)
                for phid in value.split(',')
            ]
            return Markup("<br>\n".join(data))
        except ValueError:
            phidtype = PHIDType(value)
            if phidtype in [Task, Project, ProjectColumn]:
                table = phidtype.__name__
            else:
                table = 'phobjects'
            return A(href=f'{base_url}metrics/{table}/{value}', label=value)

    return None

class PHIDFacet(ColumnFacet):
    # This key must be unique across all facet classes:
    type:str = "phid"
    sql:str
    request:Request
    database:str
    ds:Datasette
    params:Collection
    table:str

    async def suggest(self):

        columns_res = await self.ds.execute(
            self.database, f"select * from ({self.sql}) limit 1", self.params or []
        )
        columns = columns_res.columns
        row = columns_res.first()
        if not row:
            return []

        suggested_facets = []
        already_enabled = [c["config"]["simple"] for c in self.get_configs()]

        # Use self.sql and self.params to suggest some facets
        suggested_facets = []

        for column in columns:
            # ddd.console.log('isPHID: ', row[column], isPHID(row[column]))
            if isPHID(row[column]):
                # ddd.console.log('isPHID: ', row[column], isPHID(row[column]))
                suggested_facets.append({
                    "name": f"PHID:{column}",

                    "toggle_url": self.ds.urls.path(
                        path_with_added_args(
                            self.request, {"_facet_phid": column}
                        )
                    ),
                })

        return suggested_facets

    async def facet_results(self):
        facet_results = {}
        facets_timed_out = []

        qs_pairs = self.get_querystring_pairs()
        db = self.ds.get_database(self.database)
        PHObject.db = sqlite_utils.db.Database(db.connect())
        facet_size = self.get_facet_size()
        for source_and_config in self.get_configs():
            config = source_and_config["config"]
            source = source_and_config["source"]
            column = config.get("column") or config["simple"]
            facet_sql = """
                select {col} as value, count(*) as count from (
                    {sql}
                )
                where {col} is not null
                group by {col} order by count desc, value limit {limit}
            """.format(
                col=escape_sqlite(column), sql=self.sql, limit=facet_size + 1
            )
            try:
                facet_rows_results = await self.ds.execute(
                    self.database,
                    facet_sql,
                    self.params,
                    truncate=False,
                    custom_time_limit=self.ds.setting("facet_time_limit_ms"),
                )
                facet_results_values = []
                facet_results[column] = {
                    "name": column,
                    "type": self.type,
                    "hideable": source != "metadata",
                    "toggle_url": path_with_removed_args(
                        self.request, {"_facet_phid": column}
                    ),
                    "results": facet_results_values,
                    "truncated": len(facet_rows_results) > facet_size,
                }
                facet_rows = facet_rows_results.rows[:facet_size]
                if self.table:
                    # Attempt to expand foreign keys into labels
                    values = [row["value"] for row in facet_rows]
                    expanded = await self.ds.expand_foreign_keys(
                        self.database, self.table, column, values
                    )
                else:
                    expanded = {}
                for row in facet_rows:
                    selected = (column, str(row["value"])) in qs_pairs
                    obj = PHObject.instance(row["value"])
                    try:
                        obj.load()
                        ddd.console.log(obj)
                    except NotFoundError:
                        continue
                    if selected:
                        toggle_path = path_with_removed_args(
                            self.request, {column: obj.phid}
                        )
                    else:
                        toggle_path = path_with_added_args(
                            self.request, {column: obj.phid}
                        )
                    facet_results_values.append(
                        {
                            "value": obj.phid,
                            "label": obj.name,
                            "count": row["count"],
                            "toggle_url": self.ds.absolute_url(
                                self.request, toggle_path
                            ),
                            "selected": selected,
                        }
                    )
            except QueryInterrupted:
                facets_timed_out.append(column)

        return facet_results, facets_timed_out

@hookimpl
def register_facet_classes():
    return [PHIDFacet]
