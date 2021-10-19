SELECT
datetime(ts, 'unixepoch') as date,
date(ts, 'unixepoch') as day,
w.date as week,
date(w.date, '+7 days') as week_end,
count(distinct task) as tasks,
count(distinct user) as people,
count(task) OVER (PARTITION BY new ORDER BY ts RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumsum,
-count(task) FILTER (WHERE old NOT NULL and old != '') OVER (PARTITION BY old ORDER BY ts RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as negsum,
event,
old as source_phid,
(select name from ProjectColumn where phid=e.old) as source_name,
new as dest_phid,
(select name from phobjects where phid=e.new) as dest_name
FROM weeks w
LEFT JOIN events e
ON TRUE
[[ AND date(week) >= date(:date_start) ]]
[[ AND date(week_end) <= date(:date_end) ]]
 AND w.date=date(e.ts, 'unixepoch', 'weekday 1', '-7 days')
WHERE event in ('columns', 'projects', 'milestone')
[[ AND project=:project ]]
GROUP BY week,dest_phid,source_phid
ORDER BY ts