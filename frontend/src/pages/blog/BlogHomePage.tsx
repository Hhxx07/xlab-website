import { Link } from 'react-router-dom'
import BlogCard from '../../components/BlogCard'
import type { NoteDocument } from '../../content/notes/noteRegistry'

const latestArticles: Array<NoteDocument & { meta: string }> = [
  {
    slug: 'knowledge/math',
    title: '曲线积分到底在积什么？',
    module: 'knowledge',
    summary: '从“沿着曲线累加”理解第一类曲线积分，把公式和几何直觉连接起来。',
    body: '',
    raw: '',
    meta: '2026.06.09 · 8 min read',
  },
  {
    slug: 'knowledge/programming',
    title: '3D 打印桌面传感器支架设计',
    module: 'project',
    summary: '为坐姿检测系统设计一个稳定、省料、方便走线的桌面支架。',
    body: '',
    raw: '',
    meta: '2026.06.10 · 6 min read',
  },
  {
    slug: 'life/fitness',
    title: '如何让生活重新变得有秩序',
    module: 'life',
    summary: '从训练、学习和记录开始，慢慢恢复对一天的掌控感。',
    body: '',
    raw: '',
    meta: '2026.06.08 · 5 min read',
  },
]

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
    desc: '游戏、电影、小说、奇怪想法',
    path: '/fun',
    icon: 'M4 8h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Zm4 4h3m-1.5-1.5v3M15 12h.01M18 14h.01',
    bg: 'var(--orange-soft)',
  },
  {
    title: '生活',
    desc: '训练、日常、碎片记录',
    path: '/life',
    icon: 'M12 21s7-4.5 7-11a4 4 0 0 0-7-2.65A4 4 0 0 0 5 10c0 6.5 7 11 7 11Z',
    bg: 'var(--green-soft)',
  },
]

export default function BlogHomePage() {
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-14 pb-16">
        <HeroSection />
        <LatestArticles />
        <ExploreSection />
        <TownEntrySection />
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative h-[clamp(420px,56vh,620px)] overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(45,57,44,0.18)]">
      <img
        src="/养神小狗.png"
        alt="草地、阳光和躺在椅子上休息的小狗"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,38,30,0.58)_0%,rgba(30,38,30,0.34)_42%,rgba(30,38,30,0.08)_100%)]" />

      <div className="relative z-10 flex h-full items-center px-7 py-10 sm:px-12 lg:px-16">
        <div className="max-w-[560px] text-white">
          <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white/90 shadow-sm backdrop-blur">
            Sycamore&apos;s Corner
          </p>
          <h1 className="mt-5 text-[clamp(48px,6vw,76px)] font-black leading-none tracking-[-0.04em]">
            一隅
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-[1.8] text-white/88">
            记录学习、工程、阅读和生活里的细碎时刻。这里是我的个人角落，也是通往知识小镇的入口。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#latest"
              className="inline-flex items-center justify-center rounded-full bg-[var(--green-main)] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(32,54,34,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] hover:shadow-[0_18px_40px_rgba(32,54,34,0.34)]"
            >
              开始阅读
            </a>
            <Link
              to="/world"
              className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/16 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/24"
            >
              进入小镇
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function LatestArticles() {
  return (
    <section id="latest">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">
            最新文章
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
            最近写下的笔记与片段
          </p>
        </div>
        <Link
          to="/hot"
          className="w-fit text-sm font-bold text-[var(--green-main)] transition-colors hover:text-[var(--green-deep)]"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {latestArticles.map((note) => (
          <BlogCard key={note.slug} note={note} meta={note.meta} />
        ))}
      </div>
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
          从不同方向进入我的记录
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

function TownEntrySection() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#fffdf8_0%,#edf5e8_58%,#f4e2c8_100%)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Tiny Town
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[var(--text-main)] sm:text-4xl">
            进入我的知识小镇
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
            六座小房子，分别收藏学习、游戏、生活、电影、小说和体育。它不是唯一入口，但会让内容变得更像一个可以散步的空间。
          </p>
          <Link
            to="/world"
            className="mt-7 inline-flex rounded-full bg-[var(--brown-main)] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(154,106,58,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#7d542d]"
          >
            进入小镇 →
          </Link>
        </div>

        <div className="relative h-44 rounded-[24px] bg-white/55 p-5">
          <div className="absolute bottom-5 left-7 h-14 w-16 rounded-t-2xl bg-[var(--green-main)]" />
          <div className="absolute bottom-[72px] left-[24px] h-0 w-0 border-x-[38px] border-b-[28px] border-x-transparent border-b-[var(--brown-main)]" />
          <div className="absolute bottom-5 left-28 h-20 w-20 rounded-t-3xl bg-[#f0c98e]" />
          <div className="absolute bottom-[100px] left-[108px] h-0 w-0 border-x-[48px] border-b-[34px] border-x-transparent border-b-[#8f6740]" />
          <div className="absolute bottom-5 right-9 h-16 w-24 rounded-t-3xl bg-[#c8dfbd]" />
          <div className="absolute bottom-[84px] right-8 h-0 w-0 border-x-[54px] border-b-[34px] border-x-transparent border-b-[#6d8a5f]" />
          <div className="absolute bottom-4 left-0 right-0 mx-auto h-3 w-56 rounded-full bg-[rgba(79,111,82,0.16)]" />
        </div>
      </div>
    </section>
  )
}
