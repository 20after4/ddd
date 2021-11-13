import json
from datetime import datetime, date, timedelta
from typing import DefaultDict
from datasette.app import Datasette
from datasette.database import Database
from datasette.utils.asgi import Request
from statistics import median, mean
import pandas as pd

async def init_context(datasette:Datasette, db:Database, request:Request, context):
    params = {k:request.args.get(k) for k in request.args}
    context['params'] = params

    if 'date_start' not in params:
        dt = date.today()
        m = dt.month
        start_of_quarter = (3*((m-1)//3)+1)
        params['date_start'] = dt.strftime(f'%Y-{start_of_quarter}-01')

    if 'date_end' not in params:
        dt = date.today()
        params['date_end'] = dt.strftime(f'%Y-%m-%d')

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


    #context['console'].log(sql, params)
    if ('project' not in params):
        context['messages'] = 'Please select a project'
        return context

    project_name = await db.execute('select fullName from Project where phid=:phid', {'phid': params['project']})
    context['metrics'] = await db.execute(sql, params)

    for row in project_name:
        context['project_name'] = row['fullName']

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
    included_tasks = {}
    durations = []

    for taskid, task in tasks.items():
        task['id'] = taskid
        if task['end'] == now or task['end'] <= task['start']:
            task['end'] = 0
        if task['end'] and task['start']:
            if (task['start'] >= datetime.fromisoformat(params['date_start'])
              and task['end'] <= datetime.fromisoformat(params['date_end'])):
                included_tasks[taskid]=task
                task['duration'] = task['end'] - task['start']

                durations.append(task['duration'])

                if total_duration:
                    total_duration += task['duration']
                    count += 1
                else:
                    total_duration = task['duration']
                    count = 1
    if count == 0:
        count = 1

    context['mean_cycle_time'] = round(total_duration.days / count, 1)
    if len(durations):
        context['median_cycle_time'] = round(median(durations).days, 1)
    else:
        context['median_cycle_time'] = 0

    leadtimes = []
    leadtimes_sparse = []
    context['int'] = int
    context['round'] = round
    tids = ", ".join([str(t) for t in included_tasks.keys()])
    details = await db.execute(f'select * from Task where id in({tids})')
    for row in details:
        id = row['id']
        policy = json.loads(row['policy'])
        if (policy['view'] != 'public'):
            included_tasks[id]['data'] = {}
            del(included_tasks[id])
            continue

        data = included_tasks[id]['data']


        for col in details.columns:
            data[col] = row[col]

        if data.get('dateCreated', 0) > 0:
            dateCreated = data.get('dateCreated', 0)
            print(dateCreated)
            if included_tasks[id]['end']:
                lead = included_tasks[id]['end'] - datetime.fromtimestamp(dateCreated)
                lead = lead.days+(lead.seconds/(3600*24))
                leadtimes.append(lead)
                leadtimes_sparse.append(lead)
            else:
                lead = 0
                leadtimes_sparse.append(0)
            included_tasks[id]['lead'] = round(lead)
        else:
            del(included_tasks[id])
            #included_tasks[id]['lead'] = included_tasks[id]['duration'].days
    #df=pd.DataFrame.from_records(data=included_tasks)
    #print(df)
    if (len(leadtimes) and len(leadtimes_sparse)):
        context['median_lead_time'] = round(median(leadtimes), 1)
        context['mean_lead_time'] = round(mean(leadtimes_sparse), 1)
    else:
        context['median_lead_time'] = 0
        context['mean_lead_time'] = 0
    included_tasks = [row for row in included_tasks.values() if row['data']]
    context['tasks'] = included_tasks
    return context