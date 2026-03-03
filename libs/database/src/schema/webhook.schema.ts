/**
 * Webhook 数据库 Schema
 */

import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Webhook 事件类型枚举
 */
export const webhookEventTypeEnum = pgEnum("webhook_event_type", [
  // 用户事件
  "user.created",
  "user.updated",
  "user.deleted",
  "user.email_verified",
  "user.password_changed",

  // 会话事件
  "session.created",
  "session.destroyed",
  "session.extended",

  // 组织事件
  "organization.created",
  "organization.updated",
  "organization.deleted",
  "organization.member_invited",
  "organization.member_joined",
  "organization.member_removed",
  "organization.member_role_changed",

  // OAuth 事件
  "oauth.client_created",
  "oauth.client_updated",
  "oauth.client_deleted",
  "oauth.token_issued",
  "oauth.token_revoked",
  "oauth.authorization_granted",

  // API Key 事件
  "api_key.created",
  "api_key.revoked",
  "api_key.used",
]);

/**
 * Webhook 状态枚举
 */
export const webhookStatusEnum = pgEnum("webhook_status", ["active", "disabled", "failed"]);

/**
 * Webhook 交付状态枚举
 */
export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "success",
  "failed",
  "retrying",
]);

/**
 * Webhooks 表
 */
export const webhooks = pgTable(
  "webhooks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(), // 用于签名验证
    events: text("events").notNull(), // JSON array of event types
    status: webhookStatusEnum("status").default("active").notNull(),
    userId: text("user_id"), // 创建者
    organizationId: text("organization_id"), // 所属组织（可选）
    description: text("description"),
    headers: text("headers"), // JSON object of custom headers
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastTriggeredAt: timestamp("last_triggered_at"),
    failureCount: integer("failure_count").default(0).notNull(),
    successCount: integer("success_count").default(0).notNull(),
  },
  (table) => ({
    userIdIdx: index("webhooks_user_id_idx").on(table.userId),
    organizationIdIdx: index("webhooks_organization_id_idx").on(table.organizationId),
    statusIdx: index("webhooks_status_idx").on(table.status),
    isActiveIdx: index("webhooks_is_active_idx").on(table.isActive),
  })
);

/**
 * Webhook 交付记录表
 */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    eventType: webhookEventTypeEnum("event_type").notNull(),
    payload: text("payload").notNull(), // JSON payload
    status: webhookDeliveryStatusEnum("status").default("pending").notNull(),
    responseStatusCode: integer("response_status_code"),
    responseHeaders: text("response_headers"), // JSON
    responseBody: text("response_body"),
    errorMessage: text("error_message"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    nextRetryAt: timestamp("next_retry_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    webhookIdIdx: index("webhook_deliveries_webhook_id_idx").on(table.webhookId),
    eventTypeIdx: index("webhook_deliveries_event_type_idx").on(table.eventType),
    statusIdx: index("webhook_deliveries_status_idx").on(table.status),
    nextRetryAtIdx: index("webhook_deliveries_next_retry_at_idx").on(table.nextRetryAt),
    createdAtIdx: index("webhook_deliveries_created_at_idx").on(table.createdAt),
  })
);

/**
 * Webhook 事件队列表（用于异步处理）
 */
export const webhookEventQueue = pgTable(
  "webhook_event_queue",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventType: webhookEventTypeEnum("event_type").notNull(),
    payload: text("payload").notNull(), // JSON payload
    processed: boolean("processed").default(false).notNull(),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    processedIdx: index("webhook_event_queue_processed_idx").on(table.processed),
    createdAtIdx: index("webhook_event_queue_created_at_idx").on(table.createdAt),
  })
);
