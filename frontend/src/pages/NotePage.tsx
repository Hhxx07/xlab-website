import { Link, useParams } from 'react-router-dom'
import { getNote } from '../content/notes/noteRegistry'
import { renderMarkdown } from '../content/notes/markdown'

export default function NotePage() {
  const params = useParams()
  const note = getNote(params['*'])

  if (!note) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">笔记未找到</h1>
          <p className="mt-3 text-slate-600">这个 Markdown 占位内容还没有创建。</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="bg-slate-50 px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl rounded-md border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <Link to="/world" className="text-sm font-semibold text-blue-700 hover:text-blue-950">
          返回 3D 小镇
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          {note.module}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
          {note.title}
        </h1>
        {note.summary && <p className="mt-4 text-lg leading-8 text-slate-600">{note.summary}</p>}
        <div className="mt-10 space-y-6 text-slate-700">{renderMarkdown(note.body)}</div>
      </div>
    </article>
  )
}
