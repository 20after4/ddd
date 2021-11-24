SELECT
  m.metric,
  count(DISTINCT m.task) AS count,
  p.name
FROM
  task_metrics m
  JOIN Project p ON p.phid = m.metric
WHERE
  task IN (
    SELECT
      task
    FROM
      task_metrics
    WHERE
      metric = :project
  )
GROUP BY
  metric
ORDER BY
  count DESC
LIMIT
  20