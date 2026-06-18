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
    summary: '数理的纯粹魅力',
    source: 'XLab',
  },
  {
    id: 'sport-update',
    title: '新增体育小屋',
    summary: '运动💪',
    source: 'XLab',
  },
  {
    id: 'novel-update',
    title: '新增小说小屋：1984 阅读笔记',
    summary: 'fiction！',
    source: 'XLab',
  },
  {
    id: 'github-trending',
    title: 'GitHub Trending',
    summary: "You've seen it already",
    source: 'External',
  },
  {
    id: 'rss-feed',
    title: 'RSS 聚合',
    summary: 'Coming soon',
    source: 'External',
  },
]
