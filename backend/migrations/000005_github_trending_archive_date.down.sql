DROP INDEX IF EXISTS idx_github_trending_repos_unique_day;
ALTER TABLE github_trending_repos DROP COLUMN IF EXISTS archive_date;
