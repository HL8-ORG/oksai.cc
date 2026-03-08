-- 多租户性能优化 SQL 脚本
-- 执行此脚本为所有租户相关表添加索引

-- ============================================
-- 1. 基础索引（必需）
-- ============================================

-- 用户表
CREATE INDEX IF NOT EXISTS idx_user_tenant_id ON "user"(tenant_id);

-- 组织表
CREATE INDEX IF NOT EXISTS idx_organization_tenant_id ON organization(tenant_id);

-- Webhook 表
CREATE INDEX IF NOT EXISTS idx_webhook_tenant_id ON webhook(tenant_id);

-- 会话表
CREATE INDEX IF NOT EXISTS idx_session_tenant_id ON session(tenant_id);

-- 账户表
CREATE INDEX IF NOT EXISTS idx_account_tenant_id ON account(tenant_id);

-- API Key 表
CREATE INDEX IF NOT EXISTS idx_api_key_tenant_id ON api_key(tenant_id);

-- OAuth Access Token 表
CREATE INDEX IF NOT EXISTS idx_oauth_access_token_tenant_id ON oauth_access_token(tenant_id);

-- OAuth Refresh Token 表
CREATE INDEX IF NOT EXISTS idx_oauth_refresh_token_tenant_id ON oauth_refresh_token(tenant_id);

-- OAuth Authorization Code 表
CREATE INDEX IF NOT EXISTS idx_oauth_authorization_code_tenant_id ON oauth_authorization_code(tenant_id);

-- Webhook Delivery 表
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_tenant_id ON webhook_delivery(tenant_id);

-- ============================================
-- 2. 复合索引（优化常用查询）
-- ============================================

-- 用户：租户 + 邮箱验证状态（列表查询）
CREATE INDEX IF NOT EXISTS idx_user_tenant_email_verified ON "user"(tenant_id, email_verified);

-- 用户：租户 + 创建时间（时间范围查询）
CREATE INDEX IF NOT EXISTS idx_user_tenant_created ON "user"(tenant_id, created_at DESC);

-- 组织：租户 + 创建时间（时间范围查询）
CREATE INDEX IF NOT EXISTS idx_organization_tenant_created ON organization(tenant_id, created_at DESC);

-- 会话：租户 + 过期时间（会话清理）
CREATE INDEX IF NOT EXISTS idx_session_tenant_expires ON session(tenant_id, expires_at);

-- Webhook：租户 + 活跃状态（活跃 Webhook 查询）
CREATE INDEX IF NOT EXISTS idx_webhook_tenant_active ON webhook(tenant_id, active);

-- ============================================
-- 3. 唯一索引（确保数据完整性）
-- ============================================

-- 租户 slug 唯一
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_slug_unique ON tenant(slug);

-- 租户内用户邮箱唯一（如果需要）
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tenant_email_unique ON "user"(tenant_id, email);

-- ============================================
-- 4. 部分索引（优化特定查询）
-- ============================================

-- 只索引活跃会话
CREATE INDEX IF NOT EXISTS idx_session_active ON session(tenant_id, expires_at) 
WHERE expires_at > NOW();

-- 只索引活跃 Webhook
CREATE INDEX IF NOT EXISTS idx_webhook_active_only ON webhook(tenant_id) 
WHERE active = true;

-- 只索引待审核租户
CREATE INDEX IF NOT EXISTS idx_tenant_pending ON tenant(created_at) 
WHERE status = 'pending';

-- ============================================
-- 5. 分析表（更新统计信息）
-- ============================================

ANALYZE "user";
ANALYZE organization;
ANALYZE webhook;
ANALYZE session;
ANALYZE account;
ANALYZE api_key;
ANALYZE oauth_access_token;
ANALYZE oauth_refresh_token;
ANALYZE oauth_authorization_code;
ANALYZE webhook_delivery;
ANALYZE tenant;

-- ============================================
-- 验证索引创建
-- ============================================

-- 查看所有租户相关索引
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%tenant%'
ORDER BY tablename, indexname;
