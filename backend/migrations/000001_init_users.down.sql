-- ===========================================================================
-- Migration 000001 回滚：删除用户相关表
-- ===========================================================================

DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS user_identities;
DROP TABLE IF EXISTS users;
