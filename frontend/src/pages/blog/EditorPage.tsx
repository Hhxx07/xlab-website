import { useEffect, useRef, useState } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import { useAuthStore } from '../../store/authStore'

const DEFAULT_MARKDOWN = `# 新笔记

在这里写下 Markdown 内容。

- 支持标题、列表、引用和代码块
- 发布前可以选择 Study / Fun / Life 分类
`

type MilkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

function MilkdownEditor({ value, onChange }: MilkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!rootRef.current) return

    const crepe = new Crepe({
      root: rootRef.current,
      defaultValue: value,
    })

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        onChange(markdown)
      })
    })

    void crepe.create()

    return () => {
      void crepe.destroy()
    }
  }, [])

  return <div ref={rootRef} className="min-h-[560px]" />
}

export default function EditorPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [type, setType] = useState('study')
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)

  const isAdmin = isAuthenticated && user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="warm-card mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-2xl font-black tracking-[-0.02em] text-[var(--text-main)]">
            需要管理员权限
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Markdown 发布功能只对登录状态下的管理员开放。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
            Editor
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[var(--text-main)]">
            Markdown 编辑器
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            使用 Milkdown 所见即所得编辑器，发布前选择笔记类型，后续可接入保存接口。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="warm-card h-fit p-5">
            <label className="text-sm font-bold text-[var(--text-main)]">笔记类型</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--green-soft)]"
            >
              <option value="study">Study / 学习</option>
              <option value="fun-game">Fun / Games</option>
              <option value="fun-novel">Fun / Novels</option>
              <option value="fun-movie">Fun / Movies</option>
              <option value="life">Life / 生活</option>
            </select>
            <button
              type="button"
              className="mt-5 w-full rounded-full bg-[var(--green-main)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)]"
            >
              保存草稿
            </button>
            <div className="mt-5 rounded-2xl bg-[var(--bg-card-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Markdown
              </p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
                当前内容长度：{markdown.length} 字符
              </p>
            </div>
          </aside>

          <section className="warm-card milkdown-shell overflow-hidden">
            <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-soft)] px-5 py-4 text-sm font-bold text-[var(--text-main)]">
              {type}
            </div>
            <MilkdownEditor value={markdown} onChange={setMarkdown} />
          </section>
        </div>
      </div>
    </div>
  )
}
