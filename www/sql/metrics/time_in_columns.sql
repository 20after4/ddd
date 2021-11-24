SELECT
  m.task,
  count(DISTINCT task) AS count,
  state,
  c.name AS column_name,
  date(ts, 'unixepoch') AS date_start,
  date(ts2, 'unixepoch') AS date_end,
  date(ts2, 'unixepoch', 'start of month') AS MONTH,
  cast(avg(duration) /(60 * 60 * 24) AS int) AS days
FROM
  task_metrics m
  JOIN ProjectColumn c ON c.phid = m.state
WHERE
  metric IN (
    SELECT
      phid
    FROM
      (
        WITH RECURSIVE pp(phid, name, path, root) AS (
          SELECT
            phid,
            name,
            name AS path,
            phid AS root
          FROM
            Project
          WHERE
            parent IS NULL
            AND STATUS = 'open'
          UNION
          ALL
          SELECT
            Project.phid,
            Project.name AS name,
            pp.path || ':' || Project.name AS path,
            pp.root AS root
          FROM
            Project
            JOIN pp ON Project.parent = pp.phid
            AND STATUS = 'open'
        )
        SELECT
          pp.path AS path,
          pp.root AS root,
          Project.fullName AS label,
          Project.name AS name,
          Project.phid AS KEY,
          Project.phid AS phid,
          Project.parent AS parent,
          Project.uri AS href,
          Project.depth AS depth,
          Project.slug AS slug
        FROM
          Project
          JOIN pp ON Project.phid = pp.phid
          AND STATUS = 'open'
        ORDER BY
          path
      )
    WHERE
      TRUE
      AND root = :project
  )
  AND task = :task_id
GROUP BY
  state
ORDER BY
  days
LIMIT
  20