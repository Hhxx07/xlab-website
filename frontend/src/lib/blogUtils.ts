import { type NoteDocument, getAllNotes } from '../content/notes/noteRegistry'

// ===========================================================================
// 博客分类与过滤工具
// ===========================================================================

export type BlogSection = 'hot' | 'study' | 'fun' | 'life'

/** note.module → 博客导航栏 Section 的映射 */
const MODULE_TO_SECTION: Record<string, BlogSection> = {
  knowledge: 'study',
  game: 'fun',
  novel: 'fun',
  movie: 'fun',
  life: 'life',
  sport: 'life',
}

/** Fun 页的子标签配置 */
export const FUN_TABS = {
  novels: { label: '小说', modules: ['novel'] },
  games: { label: '游戏', modules: ['game'] },
  movies: { label: '电影', modules: ['movie'] },
} as const
export type FunTabKey = keyof typeof FUN_TABS

/** 根据博客分区获取文章 */
export function getNotesBySection(section: BlogSection): NoteDocument[] {
  if (section === 'hot') return getAllNotes().filter((n) => n.hot)
  return getAllNotes().filter((n) => MODULE_TO_SECTION[n.module] === section)
}

/** 根据模块名数组获取文章（用于 Fun 页子标签过滤） */
export function getNotesByModules(modules: string[]): NoteDocument[] {
  return getAllNotes().filter((n) => modules.includes(n.module))
}

/** 模块 → 中文标签 */
export const MODULE_LABELS: Record<string, string> = {
  knowledge: '知识',
  game: '游戏',
  novel: '小说',
  movie: '电影',
  life: '生活',
  sport: '运动',
}

/** 模块 → 徽章颜色（Tailwind 类） */
export const MODULE_BADGE_COLORS: Record<string, string> = {
  knowledge: 'bg-blue-50 text-blue-700',
  game: 'bg-purple-50 text-purple-700',
  novel: 'bg-amber-50 text-amber-700',
  movie: 'bg-indigo-50 text-indigo-700',
  life: 'bg-emerald-50 text-emerald-700',
  sport: 'bg-green-50 text-green-700',
}

/** 模块 → 封面占位渐变（CSS 渐变字符串） */
export const PLACEHOLDER_GRADIENTS: Record<string, string> = {
  knowledge: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  game: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  novel: 'linear-gradient(135deg, #d4a574 0%, #8b6914 100%)',
  movie: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  life: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  sport: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
}
