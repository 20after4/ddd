SELECT
  month,
  column_name,
  column_phid,
  sum(value) AS total_tasks,
  CASE WHEN value > 0 THEN 'added' ELSE 'removed' END as action
FROM
  (
    SELECT
      printf('T%u', c.task) AS task,
      datetime(c.ts, 'unixepoch') AS ts,
      date(c.ts, 'unixepoch', 'start of month') AS month,
      date(
        c.ts,
        'unixepoch',
        'weekday 0'
      ) AS week,
      p.column_phid AS column_phid,
      p.column_name AS column_name,
      p.project_phid AS project_phid,
      p.project_name AS project_name,
      p.status AS column_hidden,
      c.value AS value
    FROM
      column_metrics c
      JOIN COLUMNS p ON c.column = p.column_phid
    WHERE
      project_phid = :project
    ORDER BY
      ts
  )
WHERE
  column_hidden = 0
  AND project_phid = :project
  AND ts >= date(:date_start)
  AND ts <= date(:date_end)
GROUP BY
  month,
  column_phid,
  action