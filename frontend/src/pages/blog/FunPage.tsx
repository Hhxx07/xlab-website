import { useState } from 'react'
import { FUN_TABS, getNotesByModules, type FunTabKey } from '../../lib/blogUtils'
import BlogCard from '../../components/BlogCard'

// ===========================================================================
// 有趣文章页 — 小说 / 游戏 / 电影 子标签过滤
// ===========================================================================

const TAB_KEYS = Object.keys(FUN_TABS) as FunTabKey[]

export default function FunPage() {
  const [activeTab, setActiveTab] = useState<FunTabKey>('games')
  const notes = getNotesByModules([...FUN_TABS[activeTab].modules])

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      {/* ---- 页头 ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">有趣</h1>
        <p className="mt-1 text-sm text-slate-500">小说 · 游戏 · 电影</p>
      </div>

      {/* ---- 子标签栏 — 胶囊切页 ---- */}
      <div className="mb-8 flex gap-2">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-warm-100 text-warm-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {FUN_TABS[key].label}
          </button>
        ))}
      </div>

      {/* ---- 过滤后的卡片网格 ---- */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <BlogCard key={note.slug} note={note} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400">该分类暂无内容</p>
        </div>
      )}
    </div>
  )
}
