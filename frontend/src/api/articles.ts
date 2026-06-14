// ===========================================================================
// Articles API — src/api/articles.ts
// ===========================================================================

import { ApiRequestError } from './client'
import type { Article, Tag, Section } from '../types'

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

export const articlesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ articles: Article[]; total: number }>(`/articles${qs}`)
  },

  getBySlug: (slug: string) =>
    request<{ article: Article }>(`/articles/${encodeURIComponent(slug)}`),

  create: (data: {
    title: string; body: string; summary: string; cover?: string
    tag_ids: string[]; published: boolean
  }) =>
    request<{ article: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<{ article: Article }>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/articles/${id}`, { method: 'DELETE' }),

  toggleLike: (slug: string) =>
    request<{ liked: boolean; like_count: number }>(`/articles/${encodeURIComponent(slug)}/like`, { method: 'POST' }),

  myArticles: () =>
    request<{ articles: Article[] }>('/users/me/articles'),
}

export const tagsApi = {
  list: () => request<{ tags: Tag[] }>('/tags'),
  sections: () => request<{ sections: Section[] }>('/sections'),
}

export const adminApi = {
  stats: () => request<{ stats: { users: number; articles: number; comments: number } }>('/admin/stats'),
  articles: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ articles: Article[]; total: number }>(`/admin/articles${qs}`)
  },
  users: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ users: { id: string; email: string; username: string; display_name?: string; role: string; article_count: number; created_at: string }[]; total: number }>(`/admin/users${qs}`)
  },
  updateUserRole: (userId: string, role: string) =>
    request<{ message: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
}
