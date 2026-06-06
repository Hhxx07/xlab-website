export type NewsItem = {
  id: string
  title: string
  summary: string
  source: string
}

export const mockNews: NewsItem[] = [
  {
    id: 'knowledge-update',
    title: '新增知识小屋：数理知识笔记',
    summary: '微积分、线性代数、物理数学方法等内容的整理入口。',
    source: 'XLab',
  },
  {
    id: 'sport-update',
    title: '新增体育小屋：飞盘训练记录',
    summary: '训练计划、跑位复盘和体能目标会逐步填充。',
    source: 'XLab',
  },
  {
    id: 'novel-update',
    title: '新增小说小屋：1984 阅读笔记',
    summary: '先放主题分析占位，后续扩展为完整 Markdown 文档。',
    source: 'XLab',
  },
  {
    id: 'github-trending',
    title: 'GitHub Trending',
    summary: 'Coming soon',
    source: 'External',
  },
  {
    id: 'rss-feed',
    title: 'RSS 聚合',
    summary: 'Coming soon',
    source: 'External',
  },
]
