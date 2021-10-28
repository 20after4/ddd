select task, event, start, mid, end, phid, name, sum(value) as value from
(
SELECT
task,
event,
w.date as start,
date(w.date, '+3 days') as mid,
date(w.date, '+7 days') as end,
new as phid,
(select name from phobjects where phid=e.new) as name,
count(task) OVER (PARTITION BY new ORDER BY ts RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as tasks,
1 as value
FROM weeks w
JOIN events e
ON w.date=date(e.ts, 'unixepoch', 'weekday 1', '-7 days')
[[ AND date(start) >= date(:date_start) ]]
[[ AND date(end) <= date(:date_end) ]]
WHERE TRUE
-- event in ( 'columns')
[[ AND :project in (project, old, new) ]]

union

SELECT
task,
event,
w.date as start,
date(w.date, '+3 days') as mid,
date(w.date, '+7 days') as end,
old as phid,
(select name from phobjects where phid=e.old) as name,
-count(task) FILTER (WHERE old NOT NULL and old != '') OVER (PARTITION BY old ORDER BY ts RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as tasks,
-1 as value
FROM weeks w
JOIN events e
ON w.date=date(e.ts, 'unixepoch', 'weekday 1', '-7 days')
[[ AND date(start) >= date(:date_start) ]]
[[ AND date(end) <= date(:date_end) ]]
WHERE TRUE
--event in ('' 'columns')
[[ AND :project in (project, old, new) ]]
)
WHERE name not null and name!=""
group by start, phid
order by start --phid, start, value