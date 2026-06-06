import type { ReactNode } from 'react'

export function renderMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.split('\n')
  const nodes: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-7">
        {paragraph.join(' ')}
      </p>,
    )
    paragraph = []
  }

  const flushList = () => {
    if (!list.length) return
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="list-disc space-y-2 pl-5">
        {list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>,
    )
    list = []
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      return
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph()
      flushList()
      nodes.push(
        <h1 key={`h1-${nodes.length}`} className="text-3xl font-semibold tracking-normal">
          {trimmed.slice(2)}
        </h1>,
      )
      return
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph()
      flushList()
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="text-xl font-semibold">
          {trimmed.slice(3)}
        </h2>,
      )
      return
    }

    if (trimmed.startsWith('- ')) {
      flushParagraph()
      list.push(trimmed.slice(2))
      return
    }

    paragraph.push(trimmed)
  })

  flushParagraph()
  flushList()

  return nodes
}
