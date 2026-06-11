import { getNotesBySection } from '../../lib/blogUtils'
import { ArticleGridPage } from './StudyPage'

export default function LifePage() {
  return (
    <ArticleGridPage
      eyebrow="Life"
      title="生活"
      description="训练、日常、碎片记录，以及让生活重新有秩序的小方法。"
      emptyText="暂无生活记录"
      notes={getNotesBySection('life')}
    />
  )
}
