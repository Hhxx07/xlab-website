import { useEffect, useRef, useState } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { articlesApi, tagsApi } from '../../api/articles'
import type { Tag } from '../../types'

const DEFAULT_MARKDOWN = `# 新笔记

在这里写下 Markdown 内容。

- 支持标题、列表、引用和代码块
`

type MilkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

function MilkdownEditor({ value, onChange }: MilkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    let cancelled = false
    let crepe: Crepe | null = null

    const initialize = async () => {
      crepe = new Crepe({ root: rootRef.current, defaultValue: value })
      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown) => { onChange(markdown) })
      })
      await crepe.create()

      if (cancelled) {
        await crepe.destroy()
      }
    }

    void initialize()

    return () => {
      cancelled = true
      if (crepe) {
        void crepe.destroy()
      }
    }
  }, [])

  return <div ref={rootRef} className="min-h-[560px]" />
}

export default function EditorPage() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [summary, setSummary] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    tagsApi.list().then((data) => setTags(data.tags ?? [])).catch(() => {})
  }, [])

  const isAdmin = isAuthenticated && user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="warm-card mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-2xl font-black tracking-[-0.02em] text-[var(--text-main)]">
            需要管理员权限
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Markdown 发布功能只对管理员开放。
          </p>
        </div>
      </div>
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage('请输入标题')
      return
    }
    if (!markdown.trim()) {
      setMessage('请输入正文内容')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const data = await articlesApi.create({
        title: title.trim(),
        body: markdown,
        summary: summary.trim() || markdown.trim().slice(0, 100),
        tag_ids: selectedTags,
        published: true,
      })
      setMessage('发布成功！')
      setTimeout(() => navigate(`/post/${data.article.slug}`), 800)
    } catch (err: any) {
      setMessage(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
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
            所见即所得编辑，选择标签后发布。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="warm-card h-fit p-5 space-y-4">
            {/* 标题 */}
            <div>
              <label className="text-sm font-bold text-[var(--text-main)]">标题</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题"
                className="mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--green-soft)]"
              />
            </div>

            {/* 摘要 */}
            <div>
              <label className="text-sm font-bold text-[var(--text-main)]">摘要</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="简短摘要..."
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--green-soft)]"
              />
            </div>

            {/* 标签选择 */}
            <div>
              <label className="text-sm font-bold text-[var(--text-main)]">标签</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-[var(--green-main)] text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full bg-[var(--green-main)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:opacity-50"
            >
              {saving ? '发布中...' : '发布文章'}
            </button>

            {message && (
              <p className={`text-xs font-medium ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            <div className="rounded-2xl bg-[var(--bg-card-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Markdown
              </p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
                内容长度：{markdown.length} 字符
              </p>
            </div>
          </aside>

          <section className="warm-card milkdown-shell overflow-hidden">
            <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-soft)] px-5 py-4 text-sm font-bold text-[var(--text-main)]">
              {title || '未命名笔记'}
            </div>
            <MilkdownEditor value={markdown} onChange={setMarkdown} />
          </section>
        </div>
      </div>
    </div>
  )
}
