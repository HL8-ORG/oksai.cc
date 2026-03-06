/**
 * Webhook DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUrl } from "class-validator";

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
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",

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
  API_KEY_UPDATED = "api_key.updated",
  API_KEY_DELETED = "api_key.deleted",
  API_KEY_REVOKED = "api_key.revoked",
  API_KEY_USED = "api_key.used",
}

/**
 * Webhook 请求头常量
 */
export const WEBHOOK_EVENT_TYPE_HEADER = "X-Webhook-Event";
export const WEBHOOK_ID_HEADER = "X-Webhook-ID";
export const WEBHOOK_SIGNATURE_HEADER = "X-Webhook-Signature";
export const WEBHOOK_TIMESTAMP_HEADER = "X-Webhook-Timestamp";

/**
 * Webhook 负载
 */
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  data: any;
  timestamp: Date;
}

/**
 * 创建 Webhook 请求
 */
export class CreateWebhookDto {
  @ApiProperty({ description: "名称" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: "组织 ID" })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: "描述" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Webhook URL", example: "https://example.com/webhook" })
  @IsUrl()
  url!: string;

  @ApiProperty({
    description: "事件类型列表",
    enum: WebhookEventType,
    isArray: true,
    example: [WebhookEventType.USER_CREATED, WebhookEventType.USER_UPDATED],
  })
  @IsArray()
  events!: WebhookEventType[];

  @ApiPropertyOptional({ description: "是否激活", default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "密钥（用于签名验证）" })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({ description: "请求头" })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}

/**
 * 更新 Webhook 请求
 */
export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: "名称" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "描述" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Webhook URL" })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: "事件类型列表", enum: WebhookEventType, isArray: true })
  @IsArray()
  @IsOptional()
  events?: WebhookEventType[];

  @ApiPropertyOptional({ description: "是否激活" })
  @IsBoolean()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: "密钥" })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({ description: "请求头" })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}

/**
 * Webhook 响应
 */
export class WebhookResponse {
  @ApiProperty({ description: "Webhook ID" })
  id!: string;

  @ApiProperty({ description: "名称" })
  name!: string;

  @ApiPropertyOptional({ description: "描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "URL" })
  url!: string;

  @ApiProperty({ description: "事件列表", type: [String] })
  events!: string[];

  @ApiProperty({ description: "是否激活" })
  isActive!: boolean;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

/**
 * Webhook 投递响应
 */
export class WebhookDeliveryResponse {
  @ApiProperty({ description: "投递 ID" })
  id!: string;

  @ApiProperty({ description: "Webhook ID" })
  webhookId!: string;

  @ApiProperty({ description: "事件类型" })
  eventType!: string;

  @ApiProperty({ description: "是否成功" })
  success!: boolean;

  @ApiProperty({ description: "HTTP 状态码" })
  statusCode!: number;

  @ApiProperty({ description: "响应" })
  response!: string;

  @ApiProperty({ description: "尝试次数" })
  attempts!: number;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;
}
