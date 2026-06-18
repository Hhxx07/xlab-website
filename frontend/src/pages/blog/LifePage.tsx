import { useEffect, useState } from 'react'
import { articlesApi } from '../../api/articles'
import { ArticleGridPage } from './StudyPage'
import type { Article } from '../../types'

export default function LifePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    articlesApi.list({ section: 'life', limit: '20' })
      .then((data) => { if (alive) setArticles(data.articles ?? []) })
      .catch(() => { if (alive) setArticles([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <ArticleGridPage
      eyebrow="Life"
      title="生活"
      description="Any other things"
      emptyText="暂无生活记录"
      articles={articles}
      loading={loading}
    />
  )
}
