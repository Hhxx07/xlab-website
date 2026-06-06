// ===========================================================================
// API Client — src/api/client.ts
// 
// 封装 fetch 请求，统一处理：
//   - 基础 URL（开发时走 Vite proxy，生产时对应后端域名）
//   - JSON 序列化/反序列化
//   - Cookie 自动携带
//   - 错误统一处理
// ===========================================================================

import type { ApiError } from '../types'

/**
 * API 请求基础配置
 * 
 * 开发环境：通过 Vite proxy 转发 /api → localhost:8080
 * 生产环境：相对路径 /api，由 Nginx/Caddy 反向代理
 */
const API_BASE = '/api'

/**
 * 自定义 API 错误类
 * 包含 HTTP 状态码，方便调用方判断错误类型
 */
export class ApiRequestError extends Error {
  statusCode: number

  constructor(
    statusCode: number,
    message: string,
  ) {
    super(message)
    this.statusCode = statusCode
    this.name = 'ApiRequestError'
  }
}

/**
 * 通用请求函数
 * 
 * @param endpoint - API 端点路径，如 '/auth/login'
 * @param options  - fetch 选项（method、body 等）
 * @returns 解析后的 JSON 数据
 * @throws  ApiRequestError 当请求失败时
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  // 默认配置
  const config: RequestInit = {
    // 携带 Cookie（用于 session 认证）
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)

  // 处理 204 No Content（登出等操作）
  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  // 非 2xx 状态码视为错误
  if (!response.ok) {
    const message = (data as ApiError)?.error?.message || `请求失败 (${response.status})`
    throw new ApiRequestError(response.status, message)
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Auth API — 认证相关请求
// ---------------------------------------------------------------------------

export const authApi = {
  /** 邮箱注册 */
  register: (data: { email: string; username: string; password: string }) =>
    request<{ user: import('../types').User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 邮箱登录 */
  login: (data: { email: string; password: string }) =>
    request<{ user: import('../types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 登出 */
  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  /** 获取当前登录用户 */
  me: () =>
    request<{ user: import('../types').User }>('/auth/me'),
}

// ---------------------------------------------------------------------------
// User API — 用户资料
// ---------------------------------------------------------------------------

export const userApi = {
  /** 通过用户名获取用户公开信息 */
  getByUsername: (username: string) =>
    request<{ user: import('../types').User }>(`/users/${username}`),

  /** 更新当前用户资料 */
  updateMe: (data: import('../types').UpdateProfileRequest) =>
    request<{ user: import('../types').User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
