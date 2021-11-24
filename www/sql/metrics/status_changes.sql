SELECT
  date(ts, 'unixepoch') AS DAY,
  date(ts, 'unixepoch', 'start of month') AS month,
  task,
  project,
  user,
  event,
  old,
  new,
  old || '->' || new AS old_new,
  GROUP_CONCAT(task) AS task,
  count(*) AS count
FROM
  EVENTS e
WHERE
  TRUE
  AND '' != :project
  AND cast(e.task AS INTEGER) IN (
    SELECT
      DISTINCT cast(task AS INTEGER) AS task
    FROM
      task_metrics
    WHERE
      metric = :project
  )
  AND old_new IS NOT NULL
  AND event IN ('status')
  AND month >= date(:date_start)
  AND month <= date(:date_end)
GROUP BY
  month,
  old_new
ORDER BY
  month