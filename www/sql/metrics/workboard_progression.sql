SELECT
  e.project AS project_phid,
  date(ts, 'unixepoch') AS day,
  date(ts, 'unixepoch', 'start of month') AS month,
  count(task) AS count,
  group_concat(task) as task,
  c.name AS old,
  n.name AS new,
  c.phid || ':' || n.phid as phids,
  c.name || '->' || n.name AS old_new
FROM
  EVENTS e
  JOIN ProjectColumn c ON e.old = c.phid
  JOIN ProjectColumn n ON e.new = n.phid
WHERE
  event = "columns"
  AND MONTH >= date(:date_start)
  AND MONTH <= date(:date_end)
  AND e.project = :project
GROUP BY
  project_phid,
  MONTH,
  phids