import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["FREE", "STARTER", "PRO", "ENTERPRISE"]);
export const userRoleEnum = pgEnum("user_role", ["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const tenants = pgTable(
  "tenants",
  {
    id: text("id").primaryKey(),
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

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    emailVerified: timestamp("email_verified"),
    image: text("image"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").default("MEMBER").notNull(),
    mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    tenantIdx: index("users_tenant_idx").on(table.tenantId),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    userIdx: index("sessions_user_idx").on(table.userId),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    providerIdx: index("accounts_provider_idx").on(table.provider, table.providerAccountId),
    userIdx: index("accounts_user_idx").on(table.userId),
  })
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    key: text("key").notNull(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    keyIdx: uniqueIndex("api_keys_key_idx").on(table.key),
    tenantIdx: index("api_keys_tenant_idx").on(table.tenantId),
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
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
