-- ===========================================================================
-- Migration 000001: 初始化用户相关表
-- 
-- 包含：
--   users             — 用户主表
--   user_identities   — OAuth 身份关联
--   email_verification_tokens — 邮箱验证令牌
-- 
-- 注意：使用 UUID v7 作为主键，时间有序且全局唯一
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 用户主表
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY,
    email         TEXT UNIQUE,
    username      TEXT UNIQUE NOT NULL,
    display_name  TEXT,
    avatar_url    TEXT,
    bio           TEXT,
    -- 角色：user | admin | moderator（Phase 1 仅使用 user）
    role          TEXT NOT NULL DEFAULT 'user',
    -- 密码哈希（Argon2id 格式），OAuth 用户可为空
    password_hash TEXT,
    -- 邮箱是否已验证
    email_verified_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按用户名查找
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- 索引：按邮箱查找（登录时使用）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- OAuth 身份关联表
-- 一个用户可以绑定多个 OAuth 提供商（如 GitHub + Google）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_identities (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- 提供商名称：github、google 等
    provider            TEXT NOT NULL,
    -- 提供商返回的用户 ID
    provider_user_id    TEXT NOT NULL,
    provider_username   TEXT,
    provider_email      TEXT,
    -- 加密存储的 access_token / refresh_token（Phase 1 暂不使用）
    access_token_encrypted  TEXT,
    refresh_token_encrypted TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 同一提供商的同一用户只能关联一次
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user ON user_identities(user_id);

-- ---------------------------------------------------------------------------
-- 邮箱验证令牌表（Phase 1 建表但暂不启用邮件发送）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- 随机生成的验证令牌
    token_hash  TEXT NOT NULL UNIQUE,
    -- 令牌过期时间
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);
