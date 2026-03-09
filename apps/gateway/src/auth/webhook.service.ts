/**
 * Webhook 服务
 */

import { createHmac, randomBytes } from "node:crypto";
import { EntityManager } from "@mikro-orm/core";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Webhook, WebhookDelivery } from "@oksai/iam-identity";
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookDeliveryResponse,
  WebhookEventType,
  WebhookPayload,
  WebhookResponse,
} from "./dto/index.js";
import {
  WEBHOOK_EVENT_TYPE_HEADER,
  WEBHOOK_ID_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "./dto/index.js";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly em: EntityManager) {}

  async createWebhook(userId: string, dto: CreateWebhookDto): Promise<WebhookResponse> {
    const secret = randomBytes(32).toString("hex");
    const headers = dto.headers;
    const webhook = this.em.create(Webhook, {
      name: dto.name,
      url: dto.url,
      secret,
      events: dto.events,
      userId,
      organizationId: dto.organizationId,
      description: dto.description,
      headers,
    } as any);

    await this.em.flush();

    this.logger.log(`Webhook created: ${webhook.id}`);
    return this.toResponse(webhook);
  }

  async listWebhooks(userId: string): Promise<WebhookResponse[]> {
    const webhooks = await this.em.find(Webhook, { userId });
    return webhooks.map(this.toResponse);
  }

  async getWebhook(id: string, userId: string): Promise<WebhookResponse> {
    const webhook = await this.em.findOne(Webhook, { id, userId });

    if (!webhook) throw new NotFoundException("Webhook not found");
    return this.toResponse(webhook);
  }

  async updateWebhook(id: string, userId: string, dto: UpdateWebhookDto): Promise<WebhookResponse> {
    const webhook = await this.em.findOne(Webhook, { id, userId });

    if (!webhook) throw new NotFoundException("Webhook not found");

    if (dto.name) webhook.name = dto.name;
    if (dto.url) webhook.url = dto.url;
    if (dto.events) webhook.events = dto.events;
    if (dto.description !== undefined) webhook.description = dto.description;
    if (dto.headers !== undefined) webhook.headers = dto.headers;
    if (dto.status) {
      if (dto.status === "active") {
        webhook.activate();
      } else {
        webhook.deactivate();
      }
    }

    await this.em.flush();

    this.logger.log(`Webhook updated: ${id}`);
    return this.toResponse(webhook);
  }

  async deleteWebhook(id: string, userId: string): Promise<void> {
    const webhook = await this.em.findOne(Webhook, { id, userId });

    if (!webhook) throw new NotFoundException("Webhook not found");

    await this.em.removeAndFlush(webhook);
    this.logger.log(`Webhook deleted: ${id}`);
  }

  async triggerEvent(eventType: WebhookEventType, data: Record<string, any>): Promise<void> {
    this.logger.log(`Triggering event: ${eventType}`);

    const webhooks = await this.em.find(Webhook, { isActive: true });
    const matched = webhooks.filter((w) => w.shouldTrigger(eventType));

    for (const webhook of matched) {
      await this.sendWebhook(webhook, eventType, data);
    }
  }

  async listDeliveries(webhookId: string, userId: string): Promise<WebhookDeliveryResponse[]> {
    await this.getWebhook(webhookId, userId);

    const deliveries = await this.em.find(WebhookDelivery, {
      webhook: { id: webhookId },
    });

    return deliveries.map((d) => ({
      id: d.id,
      webhookId: d.webhook.id,
      eventType: d.eventType,
      success: d.status === "success",
      statusCode: d.responseStatusCode ?? 0,
      response: d.responseBody ?? "",
      attempts: d.attemptCount,
      createdAt: d.createdAt,
    })) as WebhookDeliveryResponse[];
  }

  private async sendWebhook(webhook: Webhook, eventType: WebhookEventType, data: any): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: eventType,
      timestamp: new Date(),
      data,
    };

    const payloadString = JSON.stringify(payload);
    const signature = createHmac("sha256", webhook.secret).update(payloadString).digest("hex");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [WEBHOOK_SIGNATURE_HEADER]: signature,
      [WEBHOOK_EVENT_TYPE_HEADER]: eventType,
      [WEBHOOK_TIMESTAMP_HEADER]: payload.timestamp.toISOString(),
      [WEBHOOK_ID_HEADER]: payload.id,
    };

    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    const delivery = this.em.create(WebhookDelivery, {
      webhook,
      eventType,
      payload,
      status: "pending",
    } as any);

    await this.em.flush();

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payloadString,
      });

      if (response.ok) {
        webhook.recordSuccess();
      } else {
        webhook.recordFailure();
      }

      delivery.recordSuccess(response.status, Object.fromEntries(response.headers.entries()), "");

      await this.em.flush();
      this.logger.log(`Webhook delivered: ${webhook.id} - ${response.status}`);
    } catch (error) {
      webhook.recordFailure();
      delivery.recordFailure(error instanceof Error ? error.message : "Unknown");
      await this.em.flush();
      this.logger.error(`Webhook failed: ${webhook.id}`, error);
    }
  }

  private toResponse = (w: Webhook): WebhookResponse => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: w.events as WebhookEventType[],
    description: w.description || null,
    isActive: w.isActive,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  });
}
