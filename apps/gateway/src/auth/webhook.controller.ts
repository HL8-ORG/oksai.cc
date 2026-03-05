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
import type { CreateWebhookDto, UpdateWebhookDto } from "./webhook.dto";
import type { WebhookService } from "./webhook.service";

@Controller("webhooks")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Headers("x-user-id") userId: string, @Body() dto: CreateWebhookDto) {
    return this.webhookService.createWebhook(userId, dto);
  }

  @Get()
  async list(@Headers("x-user-id") userId: string) {
    return this.webhookService.listWebhooks(userId);
  }

  @Get(":id")
  async get(@Param("id") id: string, @Headers("x-user-id") userId: string) {
    return this.webhookService.getWebhook(id, userId);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Headers("x-user-id") userId: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.updateWebhook(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Headers("x-user-id") userId: string) {
    await this.webhookService.deleteWebhook(id, userId);
  }

  @Get(":id/deliveries")
  async listDeliveries(@Param("id") id: string, @Headers("x-user-id") userId: string) {
    return this.webhookService.listDeliveries(id, userId);
  }
}
