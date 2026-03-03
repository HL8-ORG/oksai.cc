# 数据库 Schema 变更记录

## 变更日期

2026-03-02

## 变更原因

调整数据库 Schema 以兼容 Better Auth 认证框架

## 主要变更

### 1. 表名变更

| 旧表名 | 新表名 | 原因 |
|--------|--------|------|
| `users` | `user` | Better Auth 标准命名 |
| `accounts` | `account` | Better Auth 标准命名 |
| `sessions` | `session` | Better Auth 标准命名 |

### 2. users → user 表变更

| 字段 | 旧定义 | 新定义 | 说明 |
|------|--------|--------|------|
| `emailVerified` | `timestamp` | `boolean` | Better Auth 要求布尔类型 |
| `mfaEnabled` | `boolean` | 删除 | 替换为 `twoFactorEnabled` |
| `twoFactorEnabled` | - | `boolean` | Better Auth 2FA 插件字段 |
| `username` | - | `text` | 新增用户名字段 |
| `locale` | - | `text` | 新增语言设置 |
| `timezone` | - | `text` | 新增时区设置 |
| `tenantId` | `notNull` | `nullable` | 改为可选（支持多租户） |
| `role` | `enum` | `text` | 改为文本类型（兼容 Better Auth admin 插件） |

### 3. accounts → account 表变更

| 字段 | 旧定义 | 新定义 | 说明 |
|------|--------|--------|------|
| `provider` | `varchar(50)` | `providerId` (`text`) | Better Auth 字段名 |
| `providerAccountId` | `text` | `accountId` (`text`) | Better Auth 字段名 |
| `scope` | - | `text` | 新增 OAuth scope 字段 |
| `idToken` | - | `text` | 新增 OpenID Connect token |
| `sessionState` | - | `text` | 新增会话状态字段 |
| `providerEmail` | - | `text` | 新增 Provider 邮箱字段 |

### 4. sessions → session 表变更

无重大变更，仅表名调整。

### 5. 新增表

#### 5.1 verification 表

用于 Magic Link、邮箱验证、密码重置等。

```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### 5.2 two_factor_credential 表（Phase 2）

2FA TOTP 凭证存储。

```sql
CREATE TABLE two_factor_credential (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  secret TEXT NOT NULL, -- 加密存储
  created_at TIMESTAMP NOT NULL
);
```

#### 5.3 backup_code 表（Phase 2）

2FA 备用码存储。

```sql
CREATE TABLE backup_code (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  code TEXT NOT NULL, -- 加密存储
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);
```

### 6. api_keys 表变更

| 字段 | 旧定义 | 新定义 | 说明 |
|------|--------|--------|------|
| `key` | `text` | 删除 | 改为更安全的方式 |
| `hashedKey` | - | `text` | SHA256 hash 存储 |
| `prefix` | - | `text` | 用于快速识别 |
| `revokedAt` | - | `timestamp` | 新增撤销时间字段 |
| `tenantId` | `notNull` | `nullable` | 改为可选 |

## 迁移步骤

### 1. 备份现有数据（如果需要）

```bash
# 如果有现有数据，需要先备份
pg_dump oksai > backup_$(date +%Y%m%d).sql
```

### 2. 生成迁移文件

```bash
pnpm db:generate
```

### 3. 检查迁移文件

检查 `libs/database/drizzle/` 目录下的迁移 SQL 文件。

### 4. 运行迁移

```bash
# 启动数据库（如果未启动）
pnpm docker:up

# 运行迁移
pnpm db:migrate
```

### 5. 验证迁移

```bash
# 使用 Drizzle Studio 查看数据库
pnpm db:studio
```

## 兼容性说明

### Better Auth 兼容性

- ✅ 完全兼容 Better Auth 核心功能
- ✅ 支持 Better Auth 2FA 插件
- ✅ 支持 Better Auth Organization 插件
- ✅ 支持 Better Auth Admin 插件

### 自定义字段

保留了以下自定义字段以支持业务需求：

- `user.tenantId` - 多租户支持
- `user.username` - 用户名（唯一）
- `user.locale` - 语言设置
- `user.timezone` - 时区设置

## 回滚计划

如果需要回滚到旧 Schema：

1. 恢复备份：`psql oksai < backup_YYYYMMDD.sql`
2. 恢复旧 Schema 文件：`cp libs/database/src/schema/index.ts.backup libs/database/src/schema/index.ts`
3. 重新生成迁移：`pnpm db:generate`
4. 运行迁移：`pnpm db:migrate`

## 注意事项

1. **破坏性变更**：此变更会删除旧表并创建新表，**会导致数据丢失**
2. **开发阶段**：当前处于开发阶段（Phase 1），可以接受破坏性变更
3. **生产环境**：生产环境部署前需要完整的迁移脚本和数据迁移计划

## 相关文档

- [Better Auth 数据库 Schema 文档](https://www.better-auth.com/docs/concepts/database)
- [Drizzle ORM 迁移文档](https://orm.drizzle.team/docs/migrations)
- [认证系统技术规格](../../../specs/authentication/design.md)
