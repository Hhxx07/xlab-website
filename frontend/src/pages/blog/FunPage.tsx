import { useState } from 'react'
import BlogCard from '../../components/BlogCard'
import { FUN_TABS, getNotesByModules, type FunTabKey } from '../../lib/blogUtils'

const TAB_KEYS = Object.keys(FUN_TABS) as FunTabKey[]

export default function FunPage() {
  const [activeTab, setActiveTab] = useState<FunTabKey>('games')
  const notes = getNotesByModules([...FUN_TABS[activeTab].modules])

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Fun
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
            有趣
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            游戏、电影、小说和一些奇怪但有意思的想法。
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 rounded-full border border-[var(--border-soft)] bg-white/60 p-2 shadow-sm">
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                activeTab === key
                  ? 'bg-[var(--green-main)] text-white shadow-[0_10px_24px_rgba(79,111,82,0.18)]'
                  : 'text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-main)]'
              }`}
            >
              {FUN_TABS[key].label}
            </button>
          ))}
        </div>

        {notes.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <BlogCard key={note.slug} note={note} />
            ))}
          </div>
        ) : (
          <div className="warm-card py-16 text-center">
            <p className="text-sm font-medium text-[var(--text-soft)]">该分类暂无内容</p>
          </div>
        )}
      </div>
    </div>
  )
}
