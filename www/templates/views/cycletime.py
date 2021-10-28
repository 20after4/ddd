import json
from datetime import datetime, timedelta
from typing import DefaultDict
from datasette.app import Datasette
from datasette.database import Database
from datasette.utils.asgi import Request
import pandas as pd

async def init_context(datasette:Datasette, db:Database, request:Request, context):
    params = {k:request.args.get(k) for k in request.args}
    sql = """
        select
            task,
            min(start_date) as start,
            max(start_date) as
            end,
            (max(ts) - min(ts)) / 3600 as hours,
            (max(ts) - min(ts)) / 86400 as days,
            metric,
            state
            from
            (
                select
                task,
                ts,
                metric,
                state,
                datetime(ts, 'unixepoch') as start_date
                from
                task_metrics m
                where
                (
                    m.metric IN ('create','startofwork', 'endofwork')
                    or (
                    m.state = 'untagged'
                    and m.metric = :project
                    )
                )
                and m.task IN (
                    SELECT
                    task
                    from
                    task_metrics
                    WHERE
                    metric = :project
                    AND date(ts, 'unixepoch') > date(:date_start)
                    AND date(ts, 'unixepoch') < date(:date_end)
                )
                order by
                task,
                start_date asc
            )
            group by
            task,
            metric
            order by
            task,
            start_date asc
    """

    context['console'].log(sql, params)

    context['metrics'] = await db.execute(sql, params)



    now = datetime.now()
    def taskentry():
        return {"rows":[],
            "start": 0,
            "end": now,
            "data": DefaultDict(str)
        }

    tasks = DefaultDict(taskentry)
    for row in context['metrics']:
        taskid = row[0]
        task = tasks[taskid]
        task['id'] = taskid

        obj = {col: row[col] for col in context['metrics'].columns}
        obj['start']=datetime.fromisoformat(obj['start'])
        obj['end']=datetime.fromisoformat(obj['end'])
        if task['start'] == 0:
            task['start'] = obj['start']
        if obj['metric'] == params['project'] or obj['metric'] == 'endofwork':
            if obj['end'] < task['end']:
                task['end'] = obj['end']
                task['state'] = obj['state']

        elif obj['metric'] == 'startofwork':
            task['start'] = obj['start']

        task['rows'].append(obj)
    total_duration = timedelta(days=0)
    count = 0
    included_tasks = []
    for taskid, task in tasks.items():
        task['id'] = taskid
        if task['end'] == now or task['end'] <= task['start']:
            task['end'] = 0
        if task['end'] and task['start']:
            if (task['start'] >= datetime.fromisoformat(params['date_start'])
              and task['end'] <= datetime.fromisoformat(params['date_end'])):
                included_tasks.append(task)
                task['duration'] = task['end'] - task['start']
                if total_duration:
                    total_duration += task['duration']
                    count += 1
                else:
                    total_duration = task['duration']
                    count = 1
    if count == 0:
        count = 1
    context['params'] = params
    context['mean_cycle_time'] = round(total_duration.days / count, 1)
    context['int'] = int
    context['round'] = round
    tids = ", ".join([str(t) for t in tasks.keys()])
    details = await db.execute(f'select * from Task where id in({tids})')
    for row in details:
        id = row['id']
        policy = json.loads(row['policy'])
        if (policy['view'] != 'public'):
            tasks[id]['data'] = {}
            continue

        data = tasks[id]['data']
        for col in details.columns:
            data[col] = row[col]
    df=pd.DataFrame.from_records(data=included_tasks)
    print(df)
    context['tasks'] = included_tasks
    return context