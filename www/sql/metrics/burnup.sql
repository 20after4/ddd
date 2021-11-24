SELECT
  DISTINCT count(DISTINCT task) AS value,
  ph.name AS state_name,
  ph.phid AS state_phid,
  w.date AS week,
  max(date(m.ts, 'unixepoch')) AS ts,
  max(date(m.ts2, 'unixepoch')) AS ts2
FROM
  task_metrics m
  JOIN enabled_columns_and_milestones ph ON (m.state = ph.phid)
  JOIN (
    SELECT
      DISTINCT date
    FROM
      weeks
  ) w ON date(w.date) >= date(m.ts, 'unixepoch')
WHERE
  TRUE
  AND date(m.ts, 'unixepoch') >= date(:date_start)
  AND m.metric = :project
  AND state NOT IN ('created', 'tagged', 'untagged')
  AND (NOT state LIKE 'PHID-PROJ-%')
  AND week >= date(:date_start)
  AND week <= date(:date_end)
GROUP BY
  state_name,
  week