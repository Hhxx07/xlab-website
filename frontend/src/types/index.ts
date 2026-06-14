// ===========================================================================
// TypeScript 类型定义 — src/types/index.ts
// 
// 定义前端使用的主要数据类型，与后端 API 返回格式一致
// ===========================================================================

/** 用户信息（公开字段） */
export interface User {
  id: string
  email?: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  role: string
  email_verified_at?: string
  created_at: string
  updated_at: string
}

/** API 统一错误响应格式 */
export interface ApiError {
  error: {
    code: number
    message: string
  }
}

/** API 统一成功响应包装 */
export interface ApiResponse<T> {
  data: T
  message?: string
}

/** 注册请求 */
export interface RegisterRequest {
  email: string
  username: string
  password: string
}

/** 登录请求 */
export interface LoginRequest {
  email: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  user: User
}

/** 更新资料请求 */
export interface UpdateProfileRequest {
  display_name?: string
  bio?: string
  avatar_url?: string
}

// ===========================================================================
// 博客系统类型
// ===========================================================================

/** 标签 */
export interface Tag {
  id: string
  name: string
  section: string
  created_at: string
}

/** 分区 */
export interface Section {
  name: string
  label: string
  tags: Tag[]
}

/** 文章 */
export interface Article {
  id: string
  user_id: string
  title: string
  slug: string
  body: string
  summary: string
  cover?: string
  word_count: number
  view_count: number
  like_count: number
  published: boolean
  created_at: string
  updated_at: string
  author_name?: string
  tags: Tag[]
  liked_by_me?: boolean
}

/** 评论 */
export interface Comment {
  id: string
  article_id: string
  user_id: string
  parent_id?: string
  body: string
  like_count: number
  created_at: string
  liked_by_me?: boolean
  user: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  replies?: Comment[]
}

/** 创建文章请求 */
export interface CreateArticleInput {
  title: string
  body: string
  summary: string
  cover?: string
  tag_ids: string[]
  published: boolean
}

/** 管理后台用户信息 */
export interface AdminUser {
  id: string
  email?: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  role: string
  email_verified_at?: string
  created_at: string
  updated_at: string
  article_count: number
}
