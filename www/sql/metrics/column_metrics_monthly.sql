SELECT
  MONTH,
  column_name,
  sum(value) AS total_tasks
FROM
  (
    SELECT
      printf('T%u', c.task) AS task,
      datetime(c.ts, 'unixepoch') AS ts,
      date(c.ts, 'unixepoch', 'start of month') AS MONTH,
      date(
        c.ts,
        'unixepoch',
        'weekday 0'
      ) AS week,
      p.column_phid AS column_phid,
      p.column_name AS column_name,
      p.project_phid AS project_phid,
      p.project_name AS project_name,
      p.project_name || ':' || p.column_name AS qualified_name,
      p.status AS column_hidden,
      c.value AS value
    FROM
      column_metrics c
      JOIN COLUMNS p ON c.column = p.column_phid
      AND column_phid = :column
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
  MONTH,
  column_phid