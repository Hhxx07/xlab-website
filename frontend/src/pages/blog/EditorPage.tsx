import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MilkdownMarkdown from '../../components/MilkdownMarkdown'
import { useAuthStore } from '../../store/authStore'
import { articlesApi, tagsApi } from '../../api/articles'
import type { Tag } from '../../types'

const DEFAULT_MARKDOWN = `# 新笔记

在这里写 Markdown 内容。

- 支持标题、列表、引用和代码块
- 左侧编辑源码，右侧实时预览`

export default function EditorPage() {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [title, setTitle] = useState('')
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [summary, setSummary] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loadingArticle, setLoadingArticle] = useState(Boolean(editId))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated && !isLoading) fetchMe()
  }, [fetchMe, isAuthenticated, isLoading])

  useEffect(() => {
    tagsApi.list().then((data) => setTags(data.tags ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!editId || !isAuthenticated) return
    let alive = true
    setLoadingArticle(true)
    articlesApi.getForEdit(editId)
      .then((data) => {
        if (!alive) return
        const article = data.article
        setTitle(article.title)
        setMarkdown(article.body || '')
        setSummary(article.summary || '')
        setSelectedTags(article.tags?.map((tag) => tag.id) ?? [])
      })
      .catch((err: unknown) => {
        if (!alive) return
        setMessage(err instanceof Error ? err.message : '加载文章失败')
      })
      .finally(() => {
        if (alive) setLoadingArticle(false)
      })
    return () => {
      alive = false
    }
  }, [editId, isAuthenticated])

  if (isLoading || loadingArticle) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--green-main)]" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="warm-card mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-2xl font-black tracking-normal text-[var(--text-main)]">需要登录</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            登录后可以创建和编辑自己的笔记。
          </p>
        </div>
      </div>
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
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
      const payload = {
        title: title.trim(),
        body: markdown,
        summary: summary.trim() || markdown.trim().slice(0, 100),
        tag_ids: selectedTags,
        published: true,
      }
      const data = editId
        ? await articlesApi.update(editId, payload)
        : await articlesApi.create(payload)

      setMessage(editId ? '更新成功' : '发布成功')
      setTimeout(() => navigate(`/post/${data.article.slug}`), 600)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brown-main)]">
              Editor
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-[var(--text-main)]">
              {editId ? '编辑笔记' : '新建笔记'}
            </h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-fit rounded-full bg-[var(--green-main)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,111,82,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:opacity-50"
          >
            {saving ? '保存中...' : editId ? '保存修改' : '发布笔记'}
          </button>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr_260px]">
          <div>
            <label className="text-sm font-bold text-[var(--text-main)]">标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="mt-2 w-full rounded-md border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--green-soft)]"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--text-main)]">摘要</label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="留空则自动截取正文"
              className="mt-2 w-full rounded-md border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--green-soft)]"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--text-main)]">标签</label>
            <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-auto">
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
        </div>

        {message && (
          <p className={`mb-4 text-sm font-medium ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <div className="grid min-h-[640px] gap-5 lg:grid-cols-2">
          <section className="warm-card overflow-hidden">
            <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-soft)] px-5 py-3 text-sm font-bold text-[var(--text-main)]">
              Markdown 源码
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              className="h-[600px] w-full resize-none bg-white p-5 font-mono text-sm leading-7 text-slate-800 outline-none"
            />
          </section>

          <section className="warm-card milkdown-shell overflow-hidden">
            <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-soft)] px-5 py-3 text-sm font-bold text-[var(--text-main)]">
              渲染预览
            </div>
            <div className="max-h-[600px] overflow-auto">
              <MilkdownMarkdown markdown={markdown} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
