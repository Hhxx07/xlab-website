import type { WorldModuleId } from './worldModules'

export type HotspotType = 'open_note' | 'open_news' | 'enter_house' | 'toggle_night'

export type WorldHotspot = {
  id: string
  module: WorldModuleId | 'town'
  label: string
  position: [number, number, number]
  radius: number
  type: HotspotType
  noteSlug?: string
  interactionText: string
}

export const hotspots: WorldHotspot[] = [
  {
    id: 'news-board',
    module: 'town',
    label: '村口新闻板',
    position: [0, 0, 2.1],
    radius: 1.45,
    type: 'open_news',
    interactionText: '短按 E 查看新闻板',
  },
  {
    id: 'knowledge-door',
    module: 'knowledge',
    label: '知识小屋',
    position: [-5.8, 0, 2.25],
    radius: 1.35,
    type: 'enter_house',
    noteSlug: 'knowledge/math',
    interactionText: '短按 E 打开知识笔记',
  },
  {
    id: 'knowledge-blackboard',
    module: 'knowledge',
    label: '数学黑板',
    position: [-4.35, 0, 3.55],
    radius: 1.0,
    type: 'open_note',
    noteSlug: 'knowledge/math',
    interactionText: '短按 E 打开数学知识 Markdown',
  },
  {
    id: 'game-door',
    module: 'game',
    label: '游戏小屋',
    position: [5.8, 0, 2.25],
    radius: 1.35,
    type: 'enter_house',
    noteSlug: 'game/black-myth-inspired',
    interactionText: '短按 E 打开游戏笔记',
  },
  {
    id: 'game-button',
    module: 'game',
    label: '像素按钮',
    position: [4.55, 0, 3.55],
    radius: 1.0,
    type: 'open_note',
    noteSlug: 'game/game-mechanics',
    interactionText: '短按 E 查看游戏机制分析',
  },
  {
    id: 'life-door',
    module: 'life',
    label: '生活小屋',
    position: [0, 0, 4.65],
    radius: 1.35,
    type: 'enter_house',
    noteSlug: 'life/dorm',
    interactionText: '短按 E 打开生活笔记',
  },
  {
    id: 'night-switch',
    module: 'life',
    label: '夜灯开关',
    position: [-1.45, 0, 4.92],
    radius: 1.0,
    type: 'toggle_night',
    interactionText: '短按 E 切换白天 / 夜晚',
  },
  {
    id: 'life-shoes',
    module: 'life',
    label: '运动鞋',
    position: [1.25, 0, 5.75],
    radius: 1.0,
    type: 'open_note',
    noteSlug: 'life/fitness',
    interactionText: '短按 E 打开健身训练记录',
  },
  {
    id: 'movie-door',
    module: 'movie',
    label: '电影小屋',
    position: [-6.8, 0, -0.15],
    radius: 1.35,
    type: 'enter_house',
    noteSlug: 'movie/movie-list',
    interactionText: '短按 E 打开电影笔记',
  },
  {
    id: 'novel-door',
    module: 'novel',
    label: '小说小屋',
    position: [0, 0, -4.85],
    radius: 1.35,
    type: 'enter_house',
    noteSlug: 'novel/1984',
    interactionText: '短按 E 打开小说笔记',
  },
  {
    id: 'sport-door',
    module: 'sport',
    label: '体育小屋',
    position: [6.8, 0, -0.15],
    radius: 1.35,
    type: 'enter_house',
    noteSlug: 'sport/frisbee',
    interactionText: '短按 E 打开体育笔记',
  },
  {
    id: 'sport-track',
    module: 'sport',
    label: '草地跑道',
    position: [5.35, 0, -1.5],
    radius: 1.0,
    type: 'open_note',
    noteSlug: 'sport/running',
    interactionText: '短按 E 打开跑步训练记录',
  },
]
