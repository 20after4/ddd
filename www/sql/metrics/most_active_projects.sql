SELECT
  DISTINCT metric AS project_phid,
  m.state,
  p.label AS project_name,
  p.root AS root,
  COUNT(DISTINCT task) AS tasks
FROM
  task_metrics m
  JOIN ActiveProjectsCache p ON p.phid = m.metric
  AND m.state = 'tagged'
WHERE
  TRUE
  AND date(ts, 'unixepoch') >= date(:date_start)
  AND date(ts, 'unixepoch') <= date(:date_end)
GROUP BY
  root
HAVING
  tasks > 20
  AND project_name != 'Patch-For-Review'
ORDER BY
  tasks DESC
LIMIT
  12;