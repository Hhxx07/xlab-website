import { useEffect, useMemo, useState } from 'react'

type TrendingRepo = {
  name: string
  description: string
  language: string
  url: string
  stars?: string
  stars_today?: number
  readme?: string
  captured_at?: string
}

const trendingFallback: TrendingRepo[] = [
  {
    name: 'github/trending',
    description: 'GitHub Trending 暂时不可用，当前显示本地占位数据。',
    language: 'TypeScript',
    url: 'https://github.com/trending',
    stars: '0 stars today',
  },
]

const hottestFallback: TrendingRepo[] = [
  {
    name: 'github/search',
    description: 'GitHub Search API 暂时不可用，当前显示本地占位数据。',
    language: 'Go',
    url: 'https://github.com/search?q=stars%3A%3E50000&type=repositories',
  },
]

async function fetchRepos(endpoint: string) {
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`Failed to load ${endpoint}`)
  const data = await res.json()
  return Array.isArray(data.items) ? (data.items as TrendingRepo[]) : []
}

async function fetchReadme(repoName: string) {
  const res = await fetch(`/api/trending/github/readme?repo=${encodeURIComponent(repoName)}`)
  if (!res.ok) throw new Error('Failed to load README')
  const data = await res.json()
  return typeof data.readme === 'string' ? data.readme : ''
}

export default function HotPage() {
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepo[]>([])
  const [hottestRepos, setHottestRepos] = useState<TrendingRepo[]>([])
  const [historyRepos, setHistoryRepos] = useState<TrendingRepo[]>([])
  const [activeReadme, setActiveReadme] = useState<TrendingRepo | null>(null)
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [hottestLoading, setHottestLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    let alive = true

    fetchRepos('/api/trending/github/scrape')
      .then((items) => {
        if (alive) setTrendingRepos(items.length ? items : trendingFallback)
      })
      .catch(() => {
        if (alive) setTrendingRepos(trendingFallback)
      })
      .finally(() => {
        if (alive) setTrendingLoading(false)
      })

    fetchRepos('/api/trending/github')
      .then((items) => {
        if (alive) setHottestRepos(items.length ? items : hottestFallback)
      })
      .catch(() => {
        if (alive) setHottestRepos(hottestFallback)
      })
      .finally(() => {
        if (alive) setHottestLoading(false)
      })

    fetchRepos('/api/trending/github/history')
      .then((items) => {
        if (alive) setHistoryRepos(items)
      })
      .catch(() => {
        if (alive) setHistoryRepos([])
      })
      .finally(() => {
        if (alive) setHistoryLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const openReadme = async (repo: TrendingRepo) => {
    setActiveReadme(repo)
    if (repo.readme || !repo.name.includes('/')) return

    setReadmeLoading(true)
    try {
      const readme = await fetchReadme(repo.name)
      setActiveReadme({ ...repo, readme })
    } catch {
      setActiveReadme({ ...repo, readme: '' })
    } finally {
      setReadmeLoading(false)
    }
  }

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Trending
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
            HOT
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
             实时获取 GitHub Trending ＆ 留档
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <SectionHeader marker="Now" title="Trending Now" description="康康潮流 （readme抓取正在开发中...）" />
            <RepoList repos={trendingRepos} loading={trendingLoading} showStars onReadme={openReadme} />
          </section>

          <section>
            <SectionHeader marker="Archive" title="Trending Archive" description="归档日期分类" />
            <ArchiveGroups repos={historyRepos} loading={historyLoading} onReadme={openReadme} />
          </section>

          <section>
            <SectionHeader marker="All" title="The Hottest" description="Legendaries" />
            <RepoList repos={hottestRepos} loading={hottestLoading} onReadme={openReadme} />
          </section>
        </div>
      </div>

      {activeReadme && (
        <ReadmeModal repo={activeReadme} loading={readmeLoading} onClose={() => setActiveReadme(null)} />
      )}
    </div>
  )
}

function SectionHeader({ marker, title, description }: { marker: string; title: string; description: string }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--brown-soft)] px-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--brown-main)]">
            {marker}
          </span>
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-main)]">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
      </div>
    </div>
  )
}

function ArchiveGroups({
  repos,
  loading,
  onReadme,
}: {
  repos: TrendingRepo[]
  loading: boolean
  onReadme: (repo: TrendingRepo) => void
}) {
  const groups = useMemo(() => {
    const map = new Map<string, TrendingRepo[]>()
    for (const repo of repos) {
      const key = repo.captured_at ? new Date(repo.captured_at).toLocaleDateString('zh-CN') : '未记录日期'
      map.set(key, [...(map.get(key) ?? []), repo])
    }
    return Array.from(map.entries())
  }, [repos])

  if (loading) return <SkeletonGrid />

  if (!groups.length) {
    return <div className="warm-card p-6 text-sm font-semibold text-[var(--text-muted)]">还没有历史记录，刷新今日 Trending 后会自动入库。</div>
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {groups.map(([date, items]) => (
        <div key={date} className="warm-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-black text-[var(--text-main)]">{date}</h3>
            <span className="rounded-full bg-[var(--green-soft)] px-3 py-1 text-xs font-bold text-[var(--green-main)]">
              {items.length} repos
            </span>
          </div>
          <RepoList repos={items} loading={false} showStars compact onReadme={onReadme} />
        </div>
      ))}
    </div>
  )
}

function RepoList({
  repos,
  loading,
  showStars = false,
  compact = false,
  onReadme,
}: {
  repos: TrendingRepo[]
  loading: boolean
  showStars?: boolean
  compact?: boolean
  onReadme: (repo: TrendingRepo) => void
}) {
  if (loading) return <SkeletonGrid />

  return (
    <div className={compact ? 'space-y-3' : 'grid gap-4 lg:grid-cols-2'}>
      {repos.map((item) => (
        <article key={`${item.name}-${item.url}-${item.captured_at ?? ''}`} className={`warm-card warm-card-hover flex flex-col justify-between p-5 ${compact ? 'min-h-0' : 'min-h-52'}`}>
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--text-main)]">{item.name}</h3>
              <div className="flex flex-wrap gap-2">
                {showStars && item.stars && (
                  <span className="w-fit rounded-full bg-[var(--orange-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brown-main)]">{item.stars}</span>
                )}
                <span className="w-fit rounded-full bg-[var(--green-soft)] px-3 py-1.5 text-xs font-bold text-[var(--green-main)]">
                  {item.language || 'Unknown'}
                </span>
              </div>
            </div>
            {item.captured_at && !compact && (
              <p className="mt-2 text-xs font-semibold text-[var(--text-soft)]">Saved at {new Date(item.captured_at).toLocaleString()}</p>
            )}
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{item.description || 'No description provided.'}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-[var(--green-main)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--green-deep)]">
              GitHub
            </a>
            <button type="button" onClick={() => onReadme(item)} className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--green-main)] hover:text-[var(--green-main)]">
              README
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="warm-card h-36 animate-pulse bg-white/70" />
      ))}
    </div>
  )
}

function ReadmeModal({ repo, loading, onClose }: { repo: TrendingRepo; loading: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/42 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <div className="warm-card max-h-[82vh] w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-soft)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brown-main)]">README Snapshot</p>
            <h3 className="mt-1 text-xl font-black text-[var(--text-main)]">{repo.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-[var(--bg-page)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]">
            关闭
          </button>
        </div>
        <pre className="max-h-[62vh] overflow-auto whitespace-pre-wrap bg-[var(--bg-page)] p-5 text-xs leading-6 text-[var(--text-muted)]">
          {loading ? '正在加载 README...' : repo.readme || '这条记录没有抓取到 README，或者 GitHub 暂时拒绝了读取请求。'}
        </pre>
      </div>
    </div>
  )
}
