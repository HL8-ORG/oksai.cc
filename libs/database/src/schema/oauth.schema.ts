/**
 * OAuth 2.0 数据库 Schema
 */

import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * OAuth Client 类型枚举
 */
export const oauthClientTypeEnum = pgEnum("oauth_client_type", [
  "confidential", // 机密客户端（服务器端应用）
  "public", // 公共客户端（SPA、移动应用）
]);

/**
 * OAuth Grant 类型枚举
 */
export const oauthGrantTypeEnum = pgEnum("oauth_grant_type", [
  "authorization_code", // 授权码模式
  "client_credentials", // 客户端凭据模式
  "refresh_token", // 刷新令牌
]);

/**
 * OAuth Clients 表
 *
 * @description
 * 存储注册的 OAuth 客户端应用
 */
export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"), // 机密客户端加密存储
    clientType: oauthClientTypeEnum("client_type").default("confidential").notNull(),
    redirectUris: text("redirect_uris").notNull(), // JSON 数组
    allowedScopes: text("allowed_scopes").notNull(), // JSON 数组
    description: text("description"),
    homepageUrl: text("homepage_url"),
    logoUrl: text("logo_url"),
    privacyPolicyUrl: text("privacy_policy_url"),
    termsOfServiceUrl: text("terms_of_service_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => ({
    clientIdIdx: uniqueIndex("oauth_clients_client_id_idx").on(table.clientId),
    createdByIdx: index("oauth_clients_created_by_idx").on(table.createdBy),
  })
);

/**
 * OAuth Authorization Codes 表
 *
 * @description
 * 存储 OAuth 授权码（短期有效）
 */
export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redirectUri: text("redirect_uri").notNull(),
    scope: text("scope").notNull(),
    codeChallenge: text("code_challenge"), // PKCE
    codeChallengeMethod: text("code_challenge_method"), // S256 or plain
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at"),
  },
  (table) => ({
    codeIdx: uniqueIndex("oauth_authorization_codes_code_idx").on(table.code),
    clientIdIdx: index("oauth_authorization_codes_client_id_idx").on(table.clientId),
    userIdIdx: index("oauth_authorization_codes_user_id_idx").on(table.userId),
  })
);

/**
 * OAuth Access Tokens 表
 *
 * @description
 * 存储访问令牌
 */
export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accessToken: text("access_token").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    accessTokenIdx: uniqueIndex("oauth_access_tokens_token_idx").on(table.accessToken),
    clientIdIdx: index("oauth_access_tokens_client_id_idx").on(table.clientId),
    userIdIdx: index("oauth_access_tokens_user_id_idx").on(table.userId),
  })
);

/**
 * OAuth Refresh Tokens 表
 *
 * @description
 * 存储刷新令牌
 */
export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    refreshToken: text("refresh_token").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    refreshTokenIdx: uniqueIndex("oauth_refresh_tokens_token_idx").on(table.refreshToken),
    clientIdIdx: index("oauth_refresh_tokens_client_id_idx").on(table.clientId),
    userIdIdx: index("oauth_refresh_tokens_user_id_idx").on(table.userId),
  })
);
