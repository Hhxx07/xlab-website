import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BlogCard from '../../components/BlogCard'
import MilkdownMarkdown from '../../components/MilkdownMarkdown'
import { articlesApi } from '../../api/articles'
import { articleToNoteDoc } from '../../lib/blogUtils'
import type { Article } from '../../types'
import siteIntro from '../../content/siteIntro.md?raw'

const exploreCards = [
  {
    title: '学习',
    desc: '课程笔记、数学、物理、计算机',
    path: '/study',
    icon: 'M5 19.5A2.5 2.5 0 0 1 7.5 17H20M5 4.5A2.5 2.5 0 0 1 7.5 2H20v20H7.5A2.5 2.5 0 0 1 5 19.5zM9 7h7M9 11h5',
    bg: 'var(--blue-soft)',
  },
  {
    title: '项目',
    desc: '硬件、网站、3D 打印、FPGA',
    path: '/study',
    icon: 'M4 7h16M7 7v13m10-13v13M6 4h12a2 2 0 0 1 2 2v1H4V6a2 2 0 0 1 2-2Zm2 7h8M8 15h5',
    bg: 'var(--purple-soft)',
  },
  {
    title: '有趣',
    desc: '游戏、电影、小说和一些脑洞',
    path: '/fun',
    icon: 'M4 8h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Zm4 4h3m-1.5-1.5v3M15 12h.01M18 14h.01',
    bg: 'var(--orange-soft)',
  },
  {
    title: '生活',
    desc: '训练、日常和碎片记录',
    path: '/life',
    icon: 'M12 21s7-4.5 7-11a4 4 0 0 0-7-2.65A4 4 0 0 0 5 10c0 6.5 7 11 7 11Z',
    bg: 'var(--green-soft)',
  },
]

const NOSE_FIREWORK_DEBUG = {
  particleCount: 36,
  baseDistance: 66,
  distanceStep: 13,
  particleSize: 11,
  baseScale: 1.45,
  holdScale: 1.25,
  comboScale: 0.28,
  maxCombo: 6,
  comboWindowMs: 900,
  longPressMs: 3000,
  fireworkLifeMs: 1250,
}

type NoseFirework = {
  id: number
  scale: number
}

export default function BlogHomePage() {
  const [showXlabBanner, setShowXlabBanner] = useState(false)

  useEffect(() => {
    let buffer = ''
    let hideTimer: number | null = null

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      const key = event.key.toLowerCase()
      if (!/^[a-z]$/.test(key)) return

      buffer = (buffer + key).slice(-4)
      if (buffer === 'xlab') {
        setShowXlabBanner(true)
        if (hideTimer !== null) window.clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => setShowXlabBanner(false), 3600)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (hideTimer !== null) window.clearTimeout(hideTimer)
    }
  }, [])

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-14 pb-16">
        <HeroSection />
        <IntroNoteSection />
        <LatestArticles />
        <ExploreSection />
      </div>
      {showXlabBanner && <XlabEasterEggBanner onClose={() => setShowXlabBanner(false)} />}
    </div>
  )
}

function XlabEasterEggBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="xlab-easter-banner fixed left-1/2 top-7 z-[90] w-[min(92vw,720px)] -translate-x-1/2">
      <div className="flex items-center gap-4 rounded-[28px] border border-white/70 bg-[rgba(255,253,248,0.92)] px-5 py-4 shadow-[0_24px_70px_rgba(52,45,32,0.18)] backdrop-blur-xl sm:px-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--green-soft)] text-sm font-black text-[var(--green-main)] shadow-sm">
          XL
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">Easter Egg</p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--text-main)] sm:text-2xl">
            xlab -- 创造会创造的人
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/78 text-lg font-black text-[var(--text-soft)] transition hover:bg-[var(--brown-soft)] hover:text-[var(--brown-main)]"
          aria-label="关闭彩蛋横幅"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function HeroSection() {
  const navigate = useNavigate()
  const [enteringTown, setEnteringTown] = useState(false)
  const [fireworks, setFireworks] = useState<NoseFirework[]>([])
  const noseTimer = useRef<number | null>(null)
  const noseStartedAt = useRef<number | null>(null)
  const noseLongPressed = useRef(false)
  const noseCombo = useRef(0)
  const lastNoseFireworkAt = useRef(0)
  const fireworkTimers = useRef<Set<number>>(new Set())
  const fireworkId = useRef(0)

  useEffect(() => {
    return () => {
      if (noseTimer.current !== null) window.clearTimeout(noseTimer.current)
      fireworkTimers.current.forEach((timer) => window.clearTimeout(timer))
      fireworkTimers.current.clear()
    }
  }, [])

  const enterTown = () => {
    setEnteringTown(true)
    window.setTimeout(() => navigate('/world'), 760)
  }

  const clearNoseTimer = () => {
    if (noseTimer.current !== null) {
      window.clearTimeout(noseTimer.current)
      noseTimer.current = null
    }
    noseStartedAt.current = null
  }

  const startNosePress = () => {
    clearNoseTimer()
    noseLongPressed.current = false
    noseStartedAt.current = performance.now()
    noseTimer.current = window.setTimeout(() => {
      noseLongPressed.current = true
      enterTown()
    }, NOSE_FIREWORK_DEBUG.longPressMs)
  }

  const finishNosePress = () => {
    const pressedMs = noseStartedAt.current === null ? 0 : performance.now() - noseStartedAt.current
    clearNoseTimer()
    if (noseLongPressed.current) {
      noseLongPressed.current = false
      return
    }
    const now = performance.now()
    noseCombo.current = now - lastNoseFireworkAt.current < NOSE_FIREWORK_DEBUG.comboWindowMs
      ? Math.min(noseCombo.current + 1, NOSE_FIREWORK_DEBUG.maxCombo)
      : 1
    lastNoseFireworkAt.current = now
    const holdRatio = Math.min(pressedMs / NOSE_FIREWORK_DEBUG.longPressMs, 1)
    const id = fireworkId.current + 1
    fireworkId.current = id
    const scale =
      NOSE_FIREWORK_DEBUG.baseScale
      + holdRatio * NOSE_FIREWORK_DEBUG.holdScale
      + (noseCombo.current - 1) * NOSE_FIREWORK_DEBUG.comboScale

    setFireworks((items) => [...items, { id, scale }])
    const removeTimer = window.setTimeout(() => {
      setFireworks((items) => items.filter((item) => item.id !== id))
      fireworkTimers.current.delete(removeTimer)
    }, NOSE_FIREWORK_DEBUG.fireworkLifeMs)
    fireworkTimers.current.add(removeTimer)
  }

  return (
    <section className="relative h-[clamp(420px,56vh,620px)] overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(45,57,44,0.18)]">
      <img
        src="/养神小狗.png"
        alt="草地、阳光和躺在椅子上休息的小狗"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,38,30,0.58)_0%,rgba(30,38,30,0.34)_42%,rgba(30,38,30,0.08)_100%)]" />

      <button
        type="button"
        className="home-dog-nose"
        aria-label="小狗鼻子"
        onPointerDown={startNosePress}
        onPointerUp={finishNosePress}
        onPointerCancel={clearNoseTimer}
        onPointerLeave={clearNoseTimer}
      >
        {fireworks.map((firework) => (
          <span
            key={firework.id}
            className="home-nose-firework"
            style={{ '--firework-scale': firework.scale } as CSSProperties}
            aria-hidden="true"
          >
            {Array.from({ length: NOSE_FIREWORK_DEBUG.particleCount }).map((_, index) => (
              <i
                key={index}
                style={{
                ...getNoseParticleStyle(index),
              }}
            />
          ))}
        </span>
        ))}
      </button>

      <div className="relative z-10 flex h-full items-center px-7 py-10 sm:px-12 lg:px-16">
        <div className="max-w-[560px] text-white">
          <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white/90 shadow-sm backdrop-blur">
            Huaixi&apos;s Corner
          </p>
          <h1 className="mt-5 text-[clamp(48px,6vw,76px)] font-black leading-none">
            一隅
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-[1.8] text-white/88">
            学习、生活和项目慢慢长出来的地方。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#latest"
              className="inline-flex items-center justify-center rounded-full bg-[var(--green-main)] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(32,54,34,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] hover:shadow-[0_18px_40px_rgba(32,54,34,0.34)]"
            >
              阅读文章
            </a>
            <Link
              to="/hot"
              className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/16 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/24"
            >
              看看热点
            </Link>
          </div>
        </div>
      </div>

      {enteringTown && (
        <div className="town-glow-transition fixed inset-0 z-[80] pointer-events-none">
          <div className="town-glow-core" />
          <div className="town-glow-text">进入小镇</div>
        </div>
      )}
    </section>
  )
}

function getNoseParticleStyle(index: number): CSSProperties {
  const angle = (index * Math.PI * 2) / NOSE_FIREWORK_DEBUG.particleCount
  const distance = NOSE_FIREWORK_DEBUG.baseDistance + (index % 5) * NOSE_FIREWORK_DEBUG.distanceStep

  return {
    '--x': `${Math.cos(angle) * distance}px`,
    '--y': `${Math.sin(angle) * distance}px`,
    '--delay': `${(index % 6) * 18}ms`,
    '--particle-size': `${NOSE_FIREWORK_DEBUG.particleSize}px`,
  } as CSSProperties
}

function IntroNoteSection() {
  return (
    <section>
      <div className="warm-card overflow-hidden p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
          Intro Note
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[var(--text-main)] sm:text-4xl">
          网站说明
        </h2>
        <div className="milkdown-render mt-6">
          <MilkdownMarkdown markdown={siteIntro} />
        </div>
      </div>
    </section>
  )
}

function LatestArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    articlesApi.list({ limit: '6' })
      .then((data) => { if (alive) setArticles(data.articles ?? []) })
      .catch(() => { if (alive) setArticles([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <section id="latest">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">
            文章
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
            最新笔记与片段
          </p>
        </div>
        <Link
          to="/hot"
          className="w-fit text-sm font-bold text-[var(--green-main)] transition-colors hover:text-[var(--green-deep)]"
        >
          Trending Now →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="warm-card h-[248px] animate-pulse bg-white/70" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((a) => (
            <BlogCard key={a.slug} note={articleToNoteDoc(a)} />
          ))}
        </div>
      )}
    </section>
  )
}

function ExploreSection() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">
          探索角落
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
          不同内容的入口
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exploreCards.map((card) => (
          <Link
            key={card.title}
            to={card.path}
            className="warm-card warm-card-hover block p-5"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: card.bg }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={card.icon} />
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-extrabold text-[var(--text-main)]">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
