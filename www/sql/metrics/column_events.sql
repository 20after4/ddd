SELECT
    c.project_name,
    c.column_name       AS new_column,
    d.column_name       AS old_column,
    count(task)         AS count,
    date(ts, 'unixepoch', 'start of month') AS month,
    datetime(ts, 'unixepoch') AS timestamp,
    e.task,
    e.project,
    e.user,
    e.event,
    e.old,
    e.new
FROM events e
JOIN columns c ON e.new = c.column_phid
JOIN columns d ON e.old = d.column_phid
WHERE event = 'columns'
GROUP BY
      old, new, month
ORDER BY
      count desc