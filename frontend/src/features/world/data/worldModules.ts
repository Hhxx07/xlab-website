export type WorldModuleId = 'knowledge' | 'game' | 'life' | 'movie' | 'novel' | 'sport'

export type WorldModule = {
  id: WorldModuleId
  name: string
  description: string
  position: [number, number, number]
  color: string
  route: string
  type: 'house'
}

export const worldModules: WorldModule[] = [
  {
    id: 'knowledge',
    name: '知识',
    description: '数学、电路、编程和长期学习笔记。',
    position: [-5.8, 0, 3.6],
    color: '#f7e8a4',
    route: '/notes/knowledge/math',
    type: 'house',
  },
  {
    id: 'game',
    name: '游戏',
    description: '游戏体验、机制分析和游玩记录。',
    position: [5.8, 0, 3.6],
    color: '#b8dcff',
    route: '/notes/game/black-myth-inspired',
    type: 'house',
  },
  {
    id: 'life',
    name: '生活',
    description: '宿舍、日常计划、健身和时间管理。',
    position: [0, 0, 5.9],
    color: '#ffc9a7',
    route: '/notes/life/dorm',
    type: 'house',
  },
  {
    id: 'movie',
    name: '电影',
    description: '观影短评、片单和影像观察。',
    position: [-6.8, 0, -1.5],
    color: '#d5d8ff',
    route: '/notes/movie/movie-list',
    type: 'house',
  },
  {
    id: 'novel',
    name: '小说',
    description: '小说阅读、主题分析和书单。',
    position: [0, 0, -6.2],
    color: '#d7c6ad',
    route: '/notes/novel/1984',
    type: 'house',
  },
  {
    id: 'sport',
    name: '体育',
    description: '飞盘、跑步、体能和训练复盘。',
    position: [6.8, 0, -1.5],
    color: '#bdecc8',
    route: '/notes/sport/frisbee',
    type: 'house',
  },
]
