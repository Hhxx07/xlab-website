ALTER TABLE github_trending_repos
  ADD COLUMN IF NOT EXISTS archive_date DATE NOT NULL DEFAULT CURRENT_DATE;

UPDATE github_trending_repos
SET archive_date = captured_at::date
WHERE archive_date IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_github_trending_repos_unique_day
  ON github_trending_repos (full_name, archive_date);
