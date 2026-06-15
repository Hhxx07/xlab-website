// ===========================================================================
// CommentSection — 文章评论区（树形楼中楼）
// ===========================================================================

import { useEffect, useState } from 'react'
import { commentsApi } from '../api/comments'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import type { Comment } from '../types'

export default function CommentSection({ articleSlug }: { articleSlug: string }) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = () => {
    commentsApi.list(articleSlug)
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchComments() }, [articleSlug])

  const handleSubmit = async () => {
    if (!body.trim()) return
    if (!isAuthenticated) { navigate('/login'); return }
    setSubmitting(true)
    try {
      await commentsApi.create(articleSlug, body.trim())
      setBody('')
      fetchComments()
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-[var(--text-main)]">
        评论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      <div className="mt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isAuthenticated ? '写下你的想法...' : '登录后参与评论'}
          disabled={!isAuthenticated}
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--text-main)] placeholder:text-slate-400 focus:border-[var(--green-main)] focus:outline-none focus:ring-2 focus:ring-[var(--green-soft)] disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || submitting || !isAuthenticated}
            className="rounded-full bg-[var(--green-main)] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--green-deep)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">加载评论中...</p>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">暂无评论，来说两句吧</p>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} articleSlug={articleSlug} onRefresh={fetchComments} />
          ))
        )}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  articleSlug,
  onRefresh,
  depth = 0,
}: {
  comment: Comment
  articleSlug: string
  onRefresh: () => void
  depth?: number
}) {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [showReply, setShowReply] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [liked, setLiked] = useState(comment.liked_by_me ?? false)
  const [likeCount, setLikeCount] = useState(comment.like_count)

  const handleReply = async () => {
    if (!replyBody.trim()) return
    if (!isAuthenticated) { navigate('/login'); return }
    setSubmittingReply(true)
    try {
      await commentsApi.reply(articleSlug, comment.id, replyBody.trim())
      setReplyBody('')
      setShowReply(false)
      onRefresh()
    } catch { /* ignore */ }
    finally { setSubmittingReply(false) }
  }

  const handleLike = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    try {
      const data = await commentsApi.toggleLike(comment.id)
      setLiked(data.liked)
      setLikeCount(data.like_count)
    } catch { /* ignore */ }
  }

  const handleDelete = async () => {
    if (!confirm('确定删除这条评论吗？')) return
    try {
      await commentsApi.delete(comment.id)
      onRefresh()
    } catch { /* ignore */ }
  }

  const isOwner = user?.id === comment.user_id
  const isAdmin = user?.role === 'admin'
  const displayName = comment.user?.display_name || comment.user?.username || '匿名'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div
      className={depth > 0 ? 'border-l border-[var(--border-soft)] pl-4' : ''}
      style={{ marginLeft: depth > 0 ? Math.min(depth * 18, 54) : 0 }}
    >
      <div className="rounded-xl border border-[var(--border-soft)] bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--green-soft)] text-xs font-bold text-[var(--green-main)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-main)]">{displayName}</span>
              <span className="text-xs text-slate-400">
                {new Date(comment.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)] whitespace-pre-wrap">
              {comment.body}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <button onClick={handleLike} className="text-xs text-slate-400 hover:text-red-400">
                {liked ? '❤️' : '🤍'} {likeCount}
              </button>
              {depth < 3 && (
                <button onClick={() => setShowReply(!showReply)} className="text-xs text-slate-400 hover:text-[var(--green-main)]">
                  💬 回复
                </button>
              )}
              {(isOwner || isAdmin) && (
                <button onClick={handleDelete} className="text-xs text-slate-400 hover:text-red-500">
                  删除
                </button>
              )}
            </div>

            {/* 回复输入框 */}
            {showReply && (
              <div className="mt-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="写下回复..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--border-soft)] bg-slate-50 p-3 text-sm focus:border-[var(--green-main)] focus:outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleReply}
                    disabled={!replyBody.trim() || submittingReply}
                    className="rounded-full bg-[var(--green-main)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--green-deep)] disabled:opacity-50"
                  >
                    {submittingReply ? '...' : '回复'}
                  </button>
                  <button
                    onClick={() => setShowReply(false)}
                    className="rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-200"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 子回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} articleSlug={articleSlug} onRefresh={onRefresh} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
