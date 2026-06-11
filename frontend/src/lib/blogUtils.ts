import { type NoteDocument, getAllNotes } from '../content/notes/noteRegistry'

export type BlogSection = 'hot' | 'study' | 'fun' | 'life'

const MODULE_TO_SECTION: Record<string, BlogSection> = {
  knowledge: 'study',
  game: 'fun',
  novel: 'fun',
  movie: 'fun',
  life: 'life',
  sport: 'life',
}

export const FUN_TABS = {
  novels: { label: '小说', modules: ['novel'] },
  games: { label: '游戏', modules: ['game'] },
  movies: { label: '电影', modules: ['movie'] },
} as const

export type FunTabKey = keyof typeof FUN_TABS

export function getNotesBySection(section: BlogSection): NoteDocument[] {
  if (section === 'hot') return getAllNotes().filter((note) => note.hot)
  return getAllNotes().filter((note) => MODULE_TO_SECTION[note.module] === section)
}

export function getNotesByModules(modules: string[]): NoteDocument[] {
  return getAllNotes().filter((note) => modules.includes(note.module))
}

export const MODULE_LABELS: Record<string, string> = {
  knowledge: '知识',
  game: '游戏',
  project: '项目',
  novel: '小说',
  movie: '电影',
  life: '生活',
  sport: '运动',
}

export const MODULE_BADGE_COLORS: Record<string, string> = {
  knowledge: 'bg-[var(--blue-soft)] text-[#375a84]',
  game: 'bg-[var(--purple-soft)] text-[#66548f]',
  project: 'bg-[var(--purple-soft)] text-[#66548f]',
  novel: 'bg-[var(--brown-soft)] text-[var(--brown-main)]',
  movie: 'bg-[#eef2f6] text-[#526070]',
  life: 'bg-[var(--green-soft)] text-[var(--green-main)]',
  sport: 'bg-[#e7f5df] text-[#4d743b]',
}

export const MODULE_ACCENT_COLORS: Record<string, string> = {
  knowledge: '#8fb3d9',
  game: '#b7a8df',
  project: '#b7a8df',
  novel: '#c69a63',
  movie: '#aeb8c4',
  life: '#92b88b',
  sport: '#8dbd72',
}
