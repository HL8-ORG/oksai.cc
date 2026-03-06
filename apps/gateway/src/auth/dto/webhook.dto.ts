/**
 * Webhook DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUrl } from "class-validator";

/**
 * Webhook 事件类型
 */
export enum WebhookEventType {
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",
  API_KEY_CREATED = "api_key.created",
  API_KEY_UPDATED = "api_key.updated",
  API_KEY_DELETED = "api_key.deleted",
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

  @ApiProperty({ description: "事件类型列表", type: [String], example: ["user.created", "user.updated"] })
  @IsArray()
  @IsString({ each: true })
  events!: string[];

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

  @ApiPropertyOptional({ description: "事件类型列表", type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];

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
