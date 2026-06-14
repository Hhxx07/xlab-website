// ===========================================================================
// Comments API — src/api/comments.ts
// ===========================================================================

import { ApiRequestError } from './client'
import type { Comment } from '../types'

const API_BASE = '/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const config: RequestInit = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }
  const resp = await fetch(url, config)
  if (resp.status === 204) return undefined as T
  const data = await resp.json()
  if (!resp.ok) {
    const msg = data?.error?.message || `请求失败 (${resp.status})`
    throw new ApiRequestError(resp.status, msg)
  }
  return data as T
}

export const commentsApi = {
  list: (articleSlug: string) =>
    request<{ comments: Comment[] }>(`/articles/${encodeURIComponent(articleSlug)}/comments`),

  create: (articleSlug: string, body: string) =>
    request<{ comment: Comment }>(`/articles/${encodeURIComponent(articleSlug)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  reply: (articleSlug: string, parentId: string, body: string) =>
    request<{ comment: Comment }>(`/articles/${encodeURIComponent(articleSlug)}/comments/${parentId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  delete: (commentId: string) =>
    request<void>(`/comments/${commentId}`, { method: 'DELETE' }),

  toggleLike: (commentId: string) =>
    request<{ liked: boolean; like_count: number }>(`/comments/${commentId}/like`, { method: 'POST' }),
}
