// ===========================================================================
// Auth Store — src/store/authStore.ts
// 
// 使用 Zustand 管理客户端认证状态：
//   - user：当前登录用户信息
//   - isAuthenticated：是否已登录
//   - isLoading：正在检查登录状态
//   - login / register / logout / fetchMe：操作函数
// ===========================================================================

import { create } from 'zustand'
import type { User } from '../types'
import { authApi, ApiRequestError } from '../api/client'

/**
 * AuthStore 状态接口
 */
interface AuthState {
  /** 当前登录用户，未登录时为 null */
  user: User | null
  /** 是否已通过认证 */
  isAuthenticated: boolean
  /** 是否正在加载（初始检查或登录中） */
  isLoading: boolean
  /** 错误信息 */
  error: string | null

  // --- 操作 ---

  /** 登录：发送请求 → 设置 user → 更新 isAuthenticated */
  login: (email: string, password: string) => Promise<void>
  /** 注册：发送请求 → 自动登录 */
  register: (email: string, username: string, password: string) => Promise<void>
  /** 登出：发送请求 → 清除 user */
  logout: () => Promise<void>
  /** 获取当前登录用户（页面刷新时恢复状态） */
  fetchMe: () => Promise<void>
  /** 清除错误 */
  clearError: () => void
}

/**
 * Zustand Store
 * 
 * 使用方式：
 *   const { user, isAuthenticated, login } = useAuthStore()
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,  // 初始加载中，等 fetchMe 完成
  error: null,

  // -----------------------------------------------------------------------
  // 登录
  // -----------------------------------------------------------------------
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.login({ email, password })
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.message
        : '登录失败，请稍后重试'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  // -----------------------------------------------------------------------
  // 注册
  // -----------------------------------------------------------------------
  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.register({ email, username, password })
      // 注册成功 → 自动登录
      const res = await authApi.login({ email, password })
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.message
        : '注册失败，请稍后重试'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  // -----------------------------------------------------------------------
  // 登出
  // -----------------------------------------------------------------------
  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } catch {
      // 即使登出请求失败也清除本地状态
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },

  // -----------------------------------------------------------------------
  // 获取当前用户（初始化 + 页面刷新恢复）
  // -----------------------------------------------------------------------
  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const res = await authApi.me()
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // 未登录是正常情况，不设置 error
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  // -----------------------------------------------------------------------
  // 清除错误
  // -----------------------------------------------------------------------
  clearError: () => set({ error: null }),
}))
