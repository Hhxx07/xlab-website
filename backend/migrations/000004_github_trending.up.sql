CREATE TABLE IF NOT EXISTS github_trending_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'github_trending',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_trending_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES github_trending_runs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  stars TEXT NOT NULL DEFAULT '',
  stars_today INTEGER,
  readme TEXT NOT NULL DEFAULT '',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_github_trending_repos_captured_at
  ON github_trending_repos (captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_github_trending_repos_full_name
  ON github_trending_repos (full_name);
