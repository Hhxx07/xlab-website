import knowledgeMath from './knowledge/math.md?raw'
import knowledgeCircuit from './knowledge/circuit.md?raw'
import knowledgeProgramming from './knowledge/programming.md?raw'
import gameInspired from './game/black-myth-inspired.md?raw'
import gameMechanics from './game/game-mechanics.md?raw'
import lifeDorm from './life/dorm.md?raw'
import lifeFitness from './life/fitness.md?raw'
import movieList from './movie/movie-list.md?raw'
import novel1984 from './novel/1984.md?raw'
import sportFrisbee from './sport/frisbee.md?raw'
import sportRunning from './sport/running.md?raw'

export type NoteDocument = {
  slug: string
  title: string
  module: string
  summary: string
  body: string
  raw: string
  cover?: string
  hot?: boolean
}

const rawNotes: Record<string, string> = {
  'knowledge/math': knowledgeMath,
  'knowledge/circuit': knowledgeCircuit,
  'knowledge/programming': knowledgeProgramming,
  'game/black-myth-inspired': gameInspired,
  'game/game-mechanics': gameMechanics,
  'life/dorm': lifeDorm,
  'life/fitness': lifeFitness,
  'movie/movie-list': movieList,
  'novel/1984': novel1984,
  'sport/frisbee': sportFrisbee,
  'sport/running': sportRunning,
}

export function getNote(slug: string | undefined): NoteDocument | null {
  if (!slug) return null
  const raw = rawNotes[slug]
  if (!raw) return null
  return parseNote(slug, raw)
}

export function getAllNotes() {
  return Object.keys(rawNotes).map((slug) => parseNote(slug, rawNotes[slug]))
}

function parseNote(slug: string, raw: string): NoteDocument {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const metaText = match?.[1] ?? ''
  const body = (match?.[2] ?? raw).trim()
  const meta = Object.fromEntries(
    metaText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf(':')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )

  return {
    slug,
    title: meta.title || slug,
    module: meta.module || 'notes',
    summary: meta.summary || '',
    body,
    raw,
    cover: meta.cover || undefined,
    hot: meta.hot === 'true',
  }
}
