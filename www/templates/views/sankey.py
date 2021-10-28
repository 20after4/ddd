
import json
from datasette.app import Datasette
from datasette.database import Database


async def init_context(datasette:Datasette, db:Database, context):
    projects = await db.execute("""
            ---sql
            WITH po as (select metric as phid, count(*) as count from task_metrics group by metric order by count(*) desc limit 20)
            SELECT DISTINCT
                p.phid as key,
                p.name as ltext,
                p.parent,
                po.count
            FROM
                Project p
            JOIN po on p.phid=po.phid or p.parent=po.phid
            WHERE
                p.status='open' limit 100;
        """)
    nodes = []
    links = []

    for row in projects:
        nodes.append({
            "key": row['key'],
            "ltext": row['ltext'],
            "height": row['count']
        })
        if (row['parent']):
            links.append({"from": row['key'], "to": row['parent'], "width":2})

    context = {
        "nodes": json.dumps(nodes),
        "links": json.dumps(links),
        **context
    }
    return context