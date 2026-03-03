/**
 * OAuth 2.0 数据库 Schema
 */

import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * OAuth Client 类型枚举
 */
export const oauthClientTypeEnum = pgEnum("oauth_client_type", ["confidential", "public"]);

/**
 * OAuth Clients 表
 */
export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    clientType: oauthClientTypeEnum("client_type").default("confidential").notNull(),
    redirectUris: text("redirect_uris").notNull(),
    allowedScopes: text("allowed_scopes").notNull(),
    description: text("description"),
    homepageUrl: text("homepage_url"),
    logoUrl: text("logo_url"),
    privacyPolicyUrl: text("privacy_policy_url"),
    termsOfServiceUrl: text("terms_of_service_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: text("created_by"),
  },
  (table) => ({
    clientIdIdx: uniqueIndex("oauth_clients_client_id_idx").on(table.clientId),
    createdByIdx: index("oauth_clients_created_by_idx").on(table.createdBy),
  })
);

/**
 * OAuth Authorization Codes 表
 */
export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    clientId: text("client_id").notNull(),
    userId: text("user_id").notNull(),
    redirectUri: text("redirect_uri").notNull(),
    scope: text("scope").notNull(),
    codeChallenge: text("code_challenge"),
    codeChallengeMethod: text("code_challenge_method"),
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
 */
export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accessToken: text("access_token").notNull().unique(),
    clientId: text("client_id").notNull(),
    userId: text("user_id").notNull(),
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
 */
export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    refreshToken: text("refresh_token").notNull().unique(),
    clientId: text("client_id").notNull(),
    userId: text("user_id").notNull(),
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
