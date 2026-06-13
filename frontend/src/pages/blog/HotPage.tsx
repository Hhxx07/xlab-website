import { useEffect, useState } from 'react'

type TrendingRepo = {
  name: string
  description: string
  language: string
  url: string
  stars?: string
  stars_today?: number
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

export default function HotPage() {
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepo[]>([])
  const [hottestRepos, setHottestRepos] = useState<TrendingRepo[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [hottestLoading, setHottestLoading] = useState(true)

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

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Trending
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
            热门资讯
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            上方是 GitHub 今日热门项目，下方保留历史累计 star 最高的经典仓库。
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <SectionHeader
              marker="Now"
              title="Trending Now"
              description="GitHub 今日正在升温的开源项目"
            />
            <RepoList repos={trendingRepos} loading={trendingLoading} showStars />
          </section>

          <section>
            <SectionHeader
              marker="All"
              title="The Hottest"
              description="历史累计 star 最高的一组标志性项目"
            />
            <RepoList repos={hottestRepos} loading={hottestLoading} />
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  marker,
  title,
  description,
}: {
  marker: string
  title: string
  description: string
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--brown-soft)] px-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--brown-main)]">
            {marker}
          </span>
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-main)]">
            {title}
          </h2>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
      </div>
    </div>
  )
}

function RepoList({
  repos,
  loading,
  showStars = false,
}: {
  repos: TrendingRepo[]
  loading: boolean
  showStars?: boolean
}) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="warm-card h-36 animate-pulse bg-white/70" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {repos.map((item) => (
        <a
          key={`${item.name}-${item.url}`}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="warm-card warm-card-hover block p-6"
        >
          <div className="flex min-h-32 flex-col justify-between gap-5">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="text-xl font-black tracking-[-0.02em] text-[var(--text-main)]">
                  {item.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {showStars && item.stars && (
                    <span className="w-fit rounded-full bg-[var(--orange-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brown-main)]">
                      {item.stars}
                    </span>
                  )}
                  <span className="w-fit rounded-full bg-[var(--green-soft)] px-3 py-1.5 text-xs font-bold text-[var(--green-main)]">
                    {item.language || 'Unknown'}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                {item.description || 'No description provided.'}
              </p>
            </div>

            <span className="text-sm font-bold text-[var(--green-main)]">打开仓库 →</span>
          </div>
        </a>
      ))}
    </div>
  )
}
