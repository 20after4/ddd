WITH ev AS (
  SELECT
    DISTINCT e1.task,
    e1.new AS column
  FROM
    events e1
  WHERE
    e1.event = 'columns'
    AND e1.new = :column1

INTERSECT

  SELECT
    distinct e2.task,
    e2.new AS column
  FROM
    events e2
  WHERE
    e2.event = 'columns'
    AND e2.new = :column2
)

SELECT
  ev.task,
  ev.column AS column_phid,
  col.name AS column_name,
  col.project AS column_project
FROM
  ev
  JOIN ProjectColumn col ON ev.column = col.phid