SELECT
  date(ts, 'unixepoch', 'start of month') as month,
  count(distinct user) as people,
  count(distinct old) as source_count,
  count(*) as rows,
  group_concat(task, ', ') as tasks,
  group_concat(user, ', ') as users,
  group_concat(old, ', ') as sources,
  group_concat(new, ', ') as destinations,
  group_concat(datetime(ts, 'unixepoch'), ', ') as times
FROM
  events
WHERE
  event IN ('columns', 'projects')
  AND :project IN (project, old, new)
GROUP BY
  month
ORDER BY ts;