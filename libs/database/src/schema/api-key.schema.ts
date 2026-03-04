/**
 * Better Auth API Key Schema
 *
 * @description
 * API Key 插件的数据库表结构
 * 参考：https://better-auth.com/docs/plugins/api-key/reference#schema
 */

import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * API Key 表
 *
 * @description
 * 存储用户的 API Keys，支持：
 * - 速率限制
 * - 权限系统
 * - 元数据
 * - 过期时间
 * - Refill 机制
 */
export const apikey = pgTable("apikey", {
  // 主键
  id: text("id").primaryKey(),

  // 配置 ID（支持多配置）
  configId: text("config_id").notNull().default("default"),

  // API Key 名称
  name: text("name"),

  // API Key 前几个字符（用于 UI 显示）
  start: text("start"),

  // API Key 前缀（明文存储）
  prefix: text("prefix"),

  // API Key（Hash 后）
  key: text("key").notNull(),

  // 引用 ID（用户 ID 或组织 ID，取决于配置）
  referenceId: text("reference_id").notNull(),

  // Refill 机制
  refillInterval: integer("refill_interval"),
  refillAmount: integer("refill_amount"),
  lastRefillAt: timestamp("last_refill_at"),

  // 是否启用
  enabled: boolean("enabled").notNull().default(true),

  // 速率限制
  rateLimitEnabled: boolean("rate_limit_enabled").notNull().default(false),
  rateLimitTimeWindow: integer("rate_limit_time_window"),
  rateLimitMax: integer("rate_limit_max"),
  requestCount: integer("request_count").notNull().default(0),

  // 剩余次数
  remaining: integer("remaining"),

  // 最后请求时间
  lastRequest: timestamp("last_request"),

  // 过期时间
  expiresAt: timestamp("expires_at"),

  // 创建和更新时间
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // 权限（JSON 格式）
  permissions: text("permissions"),

  // 元数据（JSON 格式）
  metadata: jsonb("metadata"),
});

/**
 * 索引
 *
 * 注意：Drizzle Kit 会根据查询模式自动创建索引
 * Better Auth 主要查询：
 * 1. 根据 key 查询（Hash）
 * 2. 根据 referenceId 查询（用户/组织的所有 Keys）
 * 3. 根据 configId 查询（特定配置的 Keys）
 */
