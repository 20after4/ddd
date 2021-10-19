SELECT
    date(ts, 'unixepoch', 'start of month') as month,
    count(distinct task) as tasks,
    count(distinct user) as people,
    count(distinct old) as sources,
    old as source,
    new as column
FROM events
WHERE event in ('columns', 'projects') and project=:project
GROUP BY month,column,source ORDER BY month;