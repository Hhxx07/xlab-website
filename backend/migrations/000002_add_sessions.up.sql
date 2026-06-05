-- ===========================================================================
-- Migration 000002: 初始化会话表
-- 
-- 会话管理方式：
--   1. 用户登录后生成 256-bit 随机 token
--   2. token 的 SHA-256 哈希存入 sessions.token_hash
--   3. 原始 token 通过 HttpOnly Cookie 返回给浏览器
--   4. 后续请求携带 Cookie，后端验证哈希
-- ===========================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- token 的 SHA-256 哈希（不存原始 token）
    token_hash  TEXT NOT NULL UNIQUE,
    -- 客户端信息（用于审计与风控）
    user_agent  TEXT,
    ip_hash     TEXT,
    -- 会话过期时间（默认 7 天）
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按用户查找所有会话
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
-- 索引：按过期时间清理（定时任务删除过期会话）
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
