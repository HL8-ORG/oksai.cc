# 认证系统运维指南

**版本：** v1.0  
**更新日期：** 2026-03-04  
**维护团队：** Platform Team

---

## 目录

1. [快速开始](#快速开始)
2. [部署指南](#部署指南)
3. [配置管理](#配置管理)
4. [监控告警](#监控告警)
5. [故障排查](#故障排查)
6. [性能优化](#性能优化)
7. [安全加固](#安全加固)
8. [备份恢复](#备份恢复)

---

## 快速开始

### 环境要求

```yaml
Node.js: >= 20.0.0
pnpm: >= 9.0.0
PostgreSQL: >= 15.0
Redis: >= 7.0 (可选，用于缓存)
```

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/oksai/oksai.cc.git
cd oksai.cc

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，设置必要的环境变量

# 4. 启动数据库
pnpm docker:up

# 5. 运行迁移
pnpm db:migrate

# 6. 启动开发服务器
pnpm dev
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/health

# 检查认证端点
curl http://localhost:3000/api/auth/session
```

---

## 部署指南

### 生产环境部署

#### 1. 环境变量配置

**必需环境变量：**

```bash
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=https://api.yourdomain.com

# OAuth 加密密钥（重要！）
OAUTH_ENCRYPTION_KEY=your-32-char-encryption-key-here

# 邮件服务
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password

# OAuth Providers（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Redis（可选，用于缓存）
REDIS_URL=redis://localhost:6379
```

**安全注意事项：**
- ✅ 使用强随机密钥（至少 32 字符）
- ✅ 定期轮换密钥（每 90 天）
- ✅ 使用环境变量管理工具（Vault、AWS Secrets Manager）
- ❌ 不要提交 `.env` 文件到版本控制

#### 2. 数据库迁移

```bash
# 生产环境迁移
pnpm db:migrate

# 验证迁移
pnpm db:studio  # 打开 Drizzle Studio 检查表结构
```

#### 3. 构建和部署

```bash
# 构建
pnpm build

# 启动生产服务器
NODE_ENV=production pnpm start

# 使用 PM2（推荐）
pm2 start ecosystem.config.js
```

#### 4. PM2 配置示例

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "oksai-gateway",
      script: "apps/gateway/dist/main.js",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/gateway-error.log",
      out_file: "./logs/gateway-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

#### 5. Nginx 配置示例

```nginx
upstream gateway {
  server 127.0.0.1:3000;
  keepalive 64;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # 安全头
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  location / {
    proxy_pass http://gateway;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 配置管理

### Better Auth 配置

**文件位置：** `libs/auth/config/src/auth.config.ts`

**关键配置项：**

```typescript
export const auth = betterAuth({
  // 数据库配置
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // 基础配置
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // 会话配置
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24, // 每天更新
  },

  // 邮箱密码认证
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  // 插件
  plugins: [
    organization(),
    twoFactor(),
    admin(),
  ],
});
```

### OAuth 加密配置

**生成加密密钥：**

```bash
# 方法 1：使用 OpenSSL
openssl rand -base64 32

# 方法 2：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**配置位置：** `.env`

```bash
OAUTH_ENCRYPTION_KEY=生成的32字符密钥
```

**重要：** 
- 密钥丢失将导致所有 Token 和 Client Secret 无法解密
- 轮换密钥需要重新注册所有 OAuth 客户端

---

## 监控告警

### 关键指标

#### 1. 应用指标

| 指标 | 阈值 | 告警级别 |
|:---|:---:|:---:|
| **请求响应时间** | > 500ms | Warning |
| **请求响应时间** | > 1000ms | Critical |
| **错误率** | > 1% | Warning |
| **错误率** | > 5% | Critical |
| **5xx 错误** | > 10/min | Critical |
| **登录成功率** | < 95% | Warning |

#### 2. 业务指标

| 指标 | 阈值 | 告警级别 |
|:---|:---:|:---:|
| **登录失败率** | > 20% | Warning |
| **注册转化率** | < 10% | Warning |
| **OAuth 授权失败** | > 10/min | Warning |
| **API Key 验证失败** | > 100/min | Warning |

#### 3. 系统指标

| 指标 | 阈值 | 告警级别 |
|:---|:---:|:---:|
| **CPU 使用率** | > 80% | Warning |
| **内存使用率** | > 85% | Warning |
| **数据库连接数** | > 80% | Warning |
| **Redis 连接数** | > 80% | Warning |

### 监控配置

#### Prometheus 配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "oksai-gateway"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/metrics"
```

#### Grafana Dashboard

**导入 JSON：** `monitoring/grafana-dashboard.json`

**关键面板：**
1. 请求速率和响应时间
2. 错误率统计
3. 登录/注册漏斗
4. OAuth 流程监控
5. API Key 使用情况

### 告警规则

```yaml
# alerting-rules.yml
groups:
  - name: auth-alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "高错误率：{{ $value }}"

      - alert: SlowResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        annotations:
          summary: "响应时间过慢：{{ $value }}s"
```

---

## 故障排查

### 常见问题

#### 1. 登录失败

**症状：** 用户无法登录，返回 401 错误

**排查步骤：**

```bash
# 1. 检查日志
pm2 logs oksai-gateway --lines 100

# 2. 检查数据库连接
psql $DATABASE_URL -c "SELECT 1"

# 3. 检查会话表
psql $DATABASE_URL -c "SELECT COUNT(*) FROM session"

# 4. 检查用户状态
psql $DATABASE_URL -c "SELECT email, email_verified FROM \"user\" WHERE email = 'user@example.com'"
```

**可能原因：**
- 邮箱未验证
- 密码错误
- 账户被锁定
- 会话过期

**解决方案：**
```bash
# 手动验证邮箱（开发环境）
psql $DATABASE_URL -c "UPDATE \"user\" SET email_verified = true WHERE email = 'user@example.com'"

# 重置密码（使用 Better Auth API）
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

#### 2. OAuth 授权失败

**症状：** OAuth 流程中断，返回错误

**排查步骤：**

```bash
# 1. 检查客户端配置
psql $DATABASE_URL -c "SELECT * FROM oauth_clients WHERE client_id = 'your_client_id'"

# 2. 检查 redirect_uri 是否匹配
psql $DATABASE_URL -c "SELECT redirect_uris FROM oauth_clients WHERE client_id = 'your_client_id'"

# 3. 检查授权码
psql $DATABASE_URL -c "SELECT * FROM oauth_authorization_codes WHERE code = 'auth_code' LIMIT 1"

# 4. 检查加密密钥
echo $OAUTH_ENCRYPTION_KEY | wc -c  # 应该 > 32
```

**可能原因：**
- redirect_uri 不匹配
- Client Secret 错误
- 授权码已使用或过期
- 加密密钥不正确

**解决方案：**
```bash
# 更新 redirect_uris
psql $DATABASE_URL -c "UPDATE oauth_clients SET redirect_uris = '[\"https://yourdomain.com/callback\"]' WHERE client_id = 'your_client_id'"

# 重新生成 Client Secret
curl -X POST http://localhost:3000/api/oauth/clients/{id}/rotate-secret \
  -H "Authorization: Bearer {admin_token}"
```

#### 3. API Key 验证失败

**症状：** API 请求返回 401 错误

**排查步骤：**

```bash
# 1. 检查 API Key 前缀
curl -H "Authorization: Bearer oks_abc123..." http://localhost:3000/api/protected

# 2. 检查数据库
psql $DATABASE_URL -c "SELECT * FROM api_keys WHERE prefix = 'oks_abc123'"

# 3. 检查是否撤销
psql $DATABASE_URL -c "SELECT revoked_at FROM api_keys WHERE prefix = 'oks_abc123'"

# 4. 检查作用域
psql $DATABASE_URL -c "SELECT scopes FROM api_keys WHERE prefix = 'oks_abc123'"
```

#### 4. Token 解密失败

**症状：** Token 验证返回错误

**排查步骤：**

```bash
# 1. 检查加密密钥是否正确
echo $OAUTH_ENCRYPTION_KEY

# 2. 检查 Token 格式
# Token 格式：salt:iv:authTag:ciphertext

# 3. 查看日志
pm2 logs oksai-gateway | grep "decrypt"
```

**可能原因：**
- 加密密钥不匹配
- Token 格式错误
- Token 已损坏

**解决方案：**
- 恢复正确的加密密钥
- 或者撤销所有 Token，让用户重新登录

### 性能问题

#### 1. 登录响应慢

**排查：**

```bash
# 1. 检查数据库查询时间
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM \"user\" WHERE email = 'user@example.com'"

# 2. 检查索引
psql $DATABASE_URL -c "\d user"

# 3. 检查网络延迟
ping -c 10 your-db-host
```

**优化：**
- 添加数据库索引
- 启用 Redis 缓存
- 优化数据库查询

#### 2. Token 验证慢

**当前问题：** Token 验证需要遍历解密（性能问题）

**解决方案：**
- 启用 Redis 缓存（Phase 5 任务）
- 预期提升：10x

---

## 性能优化

### 数据库优化

#### 1. 索引优化

```sql
-- 用户表索引
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_created_at ON "user"(created_at);

-- 会话表索引
CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_expires_at ON session(expires_at);

-- OAuth 表索引
CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX idx_oauth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX idx_oauth_tokens_access_token ON oauth_access_tokens(access_token);
```

#### 2. 连接池配置

```typescript
// database/config.ts
export const db = drizzle(pool, {
  logger: true,
  pool: {
    min: 5,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
```

### 缓存优化

#### Redis 缓存策略

```typescript
// Token 验证缓存
const cacheKey = `token:${accessToken}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// 验证 Token
const result = await validateAccessToken(accessToken);

// 缓存结果（5 分钟）
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

**缓存命中率目标：** > 90%

---

## 安全加固

### 1. 密钥管理

**最佳实践：**
- ✅ 使用 Vault 或 AWS Secrets Manager
- ✅ 定期轮换密钥（90 天）
- ✅ 使用强随机密钥（32+ 字符）
- ❌ 不要硬编码密钥
- ❌ 不要提交到版本控制

### 2. 网络安全

**Nginx 配置：**

```nginx
# 速率限制
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

location /api/auth/sign-in {
  limit_req zone=login burst=10 nodelay;
  proxy_pass http://gateway;
}

location /api/ {
  limit_req zone=api burst=200 nodelay;
  proxy_pass http://gateway;
}
```

### 3. 日志审计

**审计事件：**
- 登录成功/失败
- OAuth 授权
- API Key 创建/使用/撤销
- 权限变更

**日志格式：**

```json
{
  "timestamp": "2026-03-04T00:00:00Z",
  "event": "login_success",
  "userId": "user-123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {}
}
```

---

## 备份恢复

### 数据库备份

#### 1. 自动备份脚本

```bash
#!/bin/bash
# backup-auth-db.sh

BACKUP_DIR="/backups/auth"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/auth_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump $DATABASE_URL > $BACKUP_FILE

# 压缩
gzip $BACKUP_FILE

# 删除 30 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### 2. Cron 配置

```cron
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-auth-db.sh >> /var/log/auth-backup.log 2>&1
```

### 恢复流程

```bash
# 1. 停止服务
pm2 stop oksai-gateway

# 2. 恢复数据库
gunzip -c /backups/auth/auth_20260304_020000.sql.gz | psql $DATABASE_URL

# 3. 验证数据
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"user\""

# 4. 重启服务
pm2 start oksai-gateway
```

---

## 联系方式

**技术支持：**
- Slack: #platform-support
- Email: platform@oksai.cc
- PagerDuty: Platform Team

**紧急联系：**
- Primary: +86 138-0000-0000
- Secondary: +86 139-0000-0000

---

**文档维护：**
- 更新频率：每月
- 负责人：Platform Team
- 下次更新：2026-04-04
