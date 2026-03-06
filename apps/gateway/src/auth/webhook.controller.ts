/**
 * Webhook Controller
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { CreateWebhookDto, UpdateWebhookDto } from "./dto";
import { WebhookService } from "./webhook.service";

@ApiTags("Webhook 管理")
@ApiHeader({
  name: "x-user-id",
  description: "用户 ID（用于认证）",
  required: true,
})
@Controller("webhooks")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建 Webhook", description: "创建新的 Webhook 端点，用于接收事件通知" })
  @ApiResponse({
    status: 201,
    description: "Webhook 创建成功",
    schema: { example: { id: "xxx", url: "https://...", events: ["user.created"] } },
  })
  @ApiResponse({ status: 400, description: "参数错误" })
  @ApiResponse({ status: 401, description: "未认证" })
  async create(@Headers("x-user-id") userId: string, @Body() dto: CreateWebhookDto) {
    return this.webhookService.createWebhook(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "获取 Webhook 列表", description: "获取当前用户的所有 Webhook" })
  @ApiResponse({ status: 200, description: "成功", schema: { example: { webhooks: [] } } })
  @ApiResponse({ status: 401, description: "未认证" })
  async list(@Headers("x-user-id") userId: string) {
    return this.webhookService.listWebhooks(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单个 Webhook", description: "获取指定 Webhook 的详细信息" })
  @ApiParam({ name: "id", description: "Webhook ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: { example: { id: "xxx", url: "https://...", events: ["user.created"] } },
  })
  @ApiResponse({ status: 404, description: "Webhook 不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async get(@Param("id") id: string, @Headers("x-user-id") userId: string) {
    return this.webhookService.getWebhook(id, userId);
  }

  @Put(":id")
  @ApiOperation({ summary: "更新 Webhook", description: "更新 Webhook 的配置（URL、事件类型等）" })
  @ApiParam({ name: "id", description: "Webhook ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: { example: { id: "xxx", url: "https://...", events: ["user.created"] } },
  })
  @ApiResponse({ status: 404, description: "Webhook 不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async update(@Param("id") id: string, @Headers("x-user-id") userId: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.updateWebhook(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "删除 Webhook", description: "删除指定的 Webhook" })
  @ApiParam({ name: "id", description: "Webhook ID", type: "string" })
  @ApiResponse({ status: 204, description: "删除成功" })
  @ApiResponse({ status: 404, description: "Webhook 不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async delete(@Param("id") id: string, @Headers("x-user-id") userId: string) {
    await this.webhookService.deleteWebhook(id, userId);
  }

  @Get(":id/deliveries")
  @ApiOperation({ summary: "获取 Webhook 投递记录", description: "获取指定 Webhook 的所有投递记录和状态" })
  @ApiParam({ name: "id", description: "Webhook ID", type: "string" })
  @ApiResponse({ status: 200, description: "成功", schema: { example: { deliveries: [] } } })
  @ApiResponse({ status: 404, description: "Webhook 不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async listDeliveries(@Param("id") id: string, @Headers("x-user-id") userId: string) {
    return this.webhookService.listDeliveries(id, userId);
  }
}
