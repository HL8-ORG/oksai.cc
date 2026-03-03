/**
 * Better Auth 兼容的数据库 Schema
 *
 * 根据 Better Auth 的要求调整现有表结构，同时保留自定义字段
 */

import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// 用户角色枚举（保留）
export const userRoleEnum = pgEnum("user_role", ["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

// 计划枚举（保留，用于多租户）
export const planEnum = pgEnum("plan", ["FREE", "STARTER", "PRO", "ENTERPRISE"]);

/**
 * 租户表（多租户功能，保留）
 */
export const tenants = pgTable(
  "tenants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    plan: planEnum("plan").default("FREE").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(table.slug),
  })
);

/**
 * 用户表（Better Auth 兼容）
 *
 * 调整：
 * - emailVerified: timestamp → boolean（Better Auth 要求）
 * - 保留 tenantId（自定义字段）
 * - 保留 role（自定义字段）
 * - mfaEnabled → twoFactorEnabled（Better Auth 2FA 插件）
 */
export const users = pgTable(
  "user", // Better Auth 使用 "user" 而非 "users"
  {
    // Better Auth 核心字段
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(), // 改为 boolean
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    // 自定义字段（保留）
    username: text("username").unique(),
    locale: text("locale").default("zh-CN"),
    timezone: text("timezone").default("Asia/Shanghai"),

    // 多租户字段（保留）
    tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

    // 角色和权限（Better Auth admin 插件 + 自定义）
    role: text("role").default("user").notNull(), // Better Auth: user, admin；自定义: OWNER, ADMIN, MEMBER, VIEWER

    // 2FA（Better Auth 2FA 插件）
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),

    // Session 配置（自定义）
    sessionTimeout: integer("session_timeout").default(604800), // Session 超时时间（秒），默认 7 天
    allowConcurrentSessions: boolean("allow_concurrent_sessions").default(true).notNull(), // 是否允许并发登录
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
    usernameIdx: uniqueIndex("user_username_idx").on(table.username),
    tenantIdx: index("user_tenant_idx").on(table.tenantId),
  })
);

/**
 * 账户表（Better Auth 兼容）
 *
 * 调整：
 * - provider → providerId（Better Auth 字段名）
 * - providerAccountId → accountId（Better Auth 字段名）
 * - 添加 scope, idToken, sessionState 字段
 */
export const accounts = pgTable(
  "account", // Better Auth 使用 "account" 而非 "accounts"
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Better Auth 核心字段
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(), // credentials, google, email, etc.

    // OAuth 字段
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"), // 新增
    expiresAt: timestamp("expires_at"),
    scope: text("scope"), // 新增
    sessionState: text("session_state"), // 新增

    // 保留的自定义字段
    providerEmail: text("provider_email"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    providerIdx: index("account_provider_idx").on(table.providerId, table.accountId),
    userIdx: index("account_user_idx").on(table.userId),
  })
);

/**
 * Session 表（Better Auth 兼容）
 *
 * 基本符合，保持不变
 */
export const sessions = pgTable(
  "session", // Better Auth 使用 "session" 而非 "sessions"
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),

    // 可选字段（Better Auth 支持）
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    userIdx: index("session_user_idx").on(table.userId),
  })
);

/**
 * 验证 Token 表（Better Auth 新增）
 *
 * 用于 Magic Link、邮箱验证、密码重置等
 */
export const verifications = pgTable(
  "verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text("identifier").notNull(), // 邮箱或其他标识
    value: text("value").notNull().unique(), // Token
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    valueIdx: uniqueIndex("verification_value_idx").on(table.value),
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  })
);

/**
 * API Key 表（自定义）
 *
 * 用于 API 访问认证
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name"),
    prefix: text("prefix").notNull(), // 用于快速识别，如 "oks_abc123"
    hashedKey: text("hashed_key").notNull().unique(), // SHA256 hash
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    hashedKeyIdx: uniqueIndex("api_keys_hashed_key_idx").on(table.hashedKey),
    prefixIdx: index("api_keys_prefix_idx").on(table.prefix),
    userIdx: index("api_keys_user_idx").on(table.userId),
    tenantIdx: index("api_keys_tenant_idx").on(table.tenantId),
  })
);

/**
 * 2FA TOTP 凭证表（Better Auth 2FA 插件 - Phase 2）
 */
export const twoFactorCredentials = pgTable(
  "two_factor_credential",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(), // 加密存储
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("two_factor_credential_user_idx").on(table.userId),
  })
);

/**
 * 2FA 备用码表（Better Auth 2FA 插件 - Phase 2）
 */
export const backupCodes = pgTable(
  "backup_code",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(), // 加密存储
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("backup_code_user_idx").on(table.userId),
  })
);

/**
 * 审计日志表（自定义，保留）
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId),
    userIdx: index("audit_logs_user_idx").on(table.userId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  })
);
