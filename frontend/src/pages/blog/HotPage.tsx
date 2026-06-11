import { useEffect, useState } from 'react'

type TrendingRepo = {
  name: string
  description: string
  language: string
  url: string
}

const fallbackRepos: TrendingRepo[] = [
  {
    name: '这是一个占位空白块',
    description: '没有得到什么东西的时候你就会看到它。点击它就能自己上github看trending啦！',
    language: 'TypeScript',
    url: 'https://github.com/trending',
  },
]

export default function HotPage() {
  const [repos, setRepos] = useState<TrendingRepo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/trending/github')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data) => {
        if (alive) setRepos(data.items ?? fallbackRepos)
      })
      .catch(() => {
        if (alive) setRepos(fallbackRepos)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Trending
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
            HOT
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            GitHub Trending for you.
          </p>
        </div>

        <div className="space-y-4">
          {(loading ? Array.from({ length: 3 }) : repos).map((repo, index) => {
            if (loading) {
              return <div key={index} className="warm-card h-32 animate-pulse bg-white/70" />
            }
            const item = repo as TrendingRepo
            return (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="warm-card warm-card-hover block p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--text-main)]">
                      {item.name}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-[var(--green-soft)] px-3 py-1.5 text-xs font-bold text-[var(--green-main)]">
                    {item.language || 'Unknown'}
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
