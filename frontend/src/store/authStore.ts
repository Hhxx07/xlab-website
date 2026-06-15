import { create } from 'zustand'
import type { User } from '../types'
import { authApi, ApiRequestError } from '../api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

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

  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.register({ email, username, password })
      set({
        user: null,
        isAuthenticated: false,
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

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } catch {
      // Local state should be cleared even if the server-side session is already gone.
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },

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
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
