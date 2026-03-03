/**
 * Webhook DTO
 */

import { IsArray, IsOptional, IsString, IsUrl, Length } from "class-validator";

/**
 * Webhook 事件类型
 */
export enum WebhookEventType {
  // 用户事件
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  USER_EMAIL_VERIFIED = "user.email_verified",
  USER_PASSWORD_CHANGED = "user.password_changed",

  // 会话事件
  SESSION_CREATED = "session.created",
  SESSION_DESTROYED = "session.destroyed",
  SESSION_EXTENDED = "session.extended",

  // 组织事件
  ORGANIZATION_CREATED = "organization.created",
  ORGANIZATION_UPDATED = "organization.updated",
  ORGANIZATION_DELETED = "organization.deleted",
  ORGANIZATION_MEMBER_INVITED = "organization.member_invited",
  ORGANIZATION_MEMBER_JOINED = "organization.member_joined",
  ORGANIZATION_MEMBER_REMOVED = "organization.member_removed",
  ORGANIZATION_MEMBER_ROLE_CHANGED = "organization.member_role_changed",

  // OAuth 事件
  OAUTH_CLIENT_CREATED = "oauth.client_created",
  OAUTH_CLIENT_UPDATED = "oauth.client_updated",
  OAUTH_CLIENT_DELETED = "oauth.client_deleted",
  OAUTH_TOKEN_ISSUED = "oauth.token_issued",
  OAUTH_TOKEN_REVOKED = "oauth.token_revoked",
  OAUTH_AUTHORIZATION_GRANTED = "oauth.authorization_granted",

  // API Key 事件
  API_KEY_CREATED = "api_key.created",
  API_KEY_REVOKED = "api_key.revoked",
  API_KEY_USED = "api_key.used",
}

/**
 * 创建 Webhook 请求
 */
export class CreateWebhookDto {
  /**
   * Webhook 名称
   */
  @IsString()
  @Length(1, 100)
  name!: string;

  /**
   * Webhook URL
   */
  @IsUrl()
  url!: string;

  /**
   * 订阅的事件列表
   */
  @IsArray()
  @IsString({ each: true })
  events!: WebhookEventType[];

  /**
   * 描述
   */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  /**
   * 自定义请求头（JSON）
   */
  @IsOptional()
  @IsString()
  headers?: string;

  /**
   * 组织 ID（可选）
   */
  @IsOptional()
  @IsString()
  organizationId?: string;
}

/**
 * 更新 Webhook 请求
 */
export class UpdateWebhookDto {
  /**
   * Webhook 名称
   */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  /**
   * Webhook URL
   */
  @IsOptional()
  @IsUrl()
  url?: string;

  /**
   * 订阅的事件列表
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: WebhookEventType[];

  /**
   * 描述
   */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  /**
   * 自定义请求头（JSON）
   */
  @IsOptional()
  @IsString()
  headers?: string;

  /**
   * 是否激活
   */
  @IsOptional()
  @IsString()
  status?: "active" | "disabled";
}

/**
 * Webhook 响应
 */
export interface WebhookResponse {
  id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  status: string;
  description?: string;
  organizationId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
  successCount: number;
}

/**
 * Webhook 交付响应
 */
export interface WebhookDeliveryResponse {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  status: string;
  responseStatusCode?: number;
  errorMessage?: string;
  attemptCount: number;
  deliveredAt?: Date;
  createdAt: Date;
}

/**
 * Webhook 事件负载
 */
export interface WebhookPayload {
  id: string;
  eventType: WebhookEventType;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Webhook 签名头部
 */
export const WEBHOOK_SIGNATURE_HEADER = "X-Webhook-Signature-256";
export const WEBHOOK_EVENT_TYPE_HEADER = "X-Webhook-Event-Type";
export const WEBHOOK_TIMESTAMP_HEADER = "X-Webhook-Timestamp";
export const WEBHOOK_ID_HEADER = "X-Webhook-ID";
