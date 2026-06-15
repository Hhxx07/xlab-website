ALTER TABLE github_trending_repos
  ADD COLUMN IF NOT EXISTS archive_date DATE NOT NULL DEFAULT CURRENT_DATE;

UPDATE github_trending_repos
SET archive_date = captured_at::date
WHERE archive_date IS NULL;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY full_name, archive_date
      ORDER BY captured_at DESC, id DESC
    ) AS row_num
  FROM github_trending_repos
)
DELETE FROM github_trending_repos repo
USING ranked
WHERE repo.id = ranked.id
  AND ranked.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_github_trending_repos_unique_day
  ON github_trending_repos (full_name, archive_date);
