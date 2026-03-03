/**
 * Webhook 服务
 */

import { createHmac, randomBytes } from "node:crypto";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { db, webhookDeliveries, webhookEventQueue, webhooks } from "@oksai/database";
import { and, eq } from "drizzle-orm";
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookDeliveryResponse,
  WebhookEventType,
  WebhookPayload,
  WebhookResponse,
} from "./webhook.dto";
import {
  WEBHOOK_EVENT_TYPE_HEADER,
  WEBHOOK_ID_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "./webhook.dto";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async createWebhook(userId: string, dto: CreateWebhookDto): Promise<WebhookResponse> {
    const secret = randomBytes(32).toString("hex");
    const [webhook] = await db
      .insert(webhooks)
      .values({
        name: dto.name,
        url: dto.url,
        secret,
        events: JSON.stringify(dto.events),
        userId,
        organizationId: dto.organizationId,
        description: dto.description,
        headers: dto.headers,
      })
      .returning();

    this.logger.log(`Webhook created: ${webhook.id}`);
    return this.toResponse(webhook);
  }

  async listWebhooks(userId: string): Promise<WebhookResponse[]> {
    const result = await db.select().from(webhooks).where(eq(webhooks.userId, userId));
    return result.map(this.toResponse);
  }

  async getWebhook(id: string, userId: string): Promise<WebhookResponse> {
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)))
      .limit(1);

    if (!webhook) throw new NotFoundException("Webhook not found");
    return this.toResponse(webhook);
  }

  async updateWebhook(id: string, userId: string, dto: UpdateWebhookDto): Promise<WebhookResponse> {
    const updateData: any = { updatedAt: new Date() };
    if (dto.name) updateData.name = dto.name;
    if (dto.url) updateData.url = dto.url;
    if (dto.events) updateData.events = JSON.stringify(dto.events);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.headers !== undefined) updateData.headers = dto.headers;
    if (dto.status) {
      updateData.status = dto.status;
      updateData.isActive = dto.status === "active";
    }

    const [webhook] = await db
      .update(webhooks)
      .set(updateData)
      .where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)))
      .returning();

    if (!webhook) throw new NotFoundException("Webhook not found");
    this.logger.log(`Webhook updated: ${id}`);
    return this.toResponse(webhook);
  }

  async deleteWebhook(id: string, userId: string): Promise<void> {
    const [webhook] = await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)))
      .returning();

    if (!webhook) throw new NotFoundException("Webhook not found");
    this.logger.log(`Webhook deleted: ${id}`);
  }

  async triggerEvent(eventType: WebhookEventType, data: Record<string, any>): Promise<void> {
    this.logger.log(`Triggering event: ${eventType}`);

    await db.insert(webhookEventQueue).values({
      eventType,
      payload: JSON.stringify(data),
    });

    // 异步处理（生产环境应使用消息队列）
    setImmediate(() => this.processQueue());
  }

  async listDeliveries(webhookId: string, userId: string): Promise<WebhookDeliveryResponse[]> {
    await this.getWebhook(webhookId, userId);

    const result = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhookId));

    return result.map((d) => ({
      id: d.id,
      webhookId: d.webhookId,
      eventType: d.eventType as WebhookEventType,
      status: d.status,
      responseStatusCode: d.responseStatusCode ?? undefined,
      errorMessage: d.errorMessage ?? undefined,
      attemptCount: d.attemptCount,
      deliveredAt: d.deliveredAt ?? undefined,
      createdAt: d.createdAt,
    }));
  }

  private async processQueue(): Promise<void> {
    try {
      const events = await db
        .select()
        .from(webhookEventQueue)
        .where(eq(webhookEventQueue.processed, false))
        .limit(10);

      for (const event of events) {
        await this.deliverEvent(event.id, event.eventType as WebhookEventType, JSON.parse(event.payload));
        await db
          .update(webhookEventQueue)
          .set({ processed: true, processedAt: new Date() })
          .where(eq(webhookEventQueue.id, event.id));
      }
    } catch (error) {
      this.logger.error("Process queue failed", error);
    }
  }

  private async deliverEvent(eventId: string, eventType: WebhookEventType, data: any): Promise<void> {
    const allWebhooks = await db.select().from(webhooks).where(eq(webhooks.isActive, true));

    const matched = allWebhooks.filter((w) => {
      const events = JSON.parse(w.events);
      return events.includes(eventType);
    });

    for (const webhook of matched) {
      await this.sendWebhook(webhook, eventType, data);
    }
  }

  private async sendWebhook(webhook: any, eventType: WebhookEventType, data: any): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      eventType,
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
      try {
        Object.assign(headers, JSON.parse(webhook.headers));
      } catch {}
    }

    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({
        webhookId: webhook.id,
        eventType,
        payload: payloadString,
        status: "pending",
      })
      .returning();

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payloadString,
      });

      await db
        .update(webhookDeliveries)
        .set({
          status: response.ok ? "success" : "failed",
          responseStatusCode: response.status,
          deliveredAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      await db
        .update(webhooks)
        .set({
          lastTriggeredAt: new Date(),
          successCount: webhook.successCount + (response.ok ? 1 : 0),
          failureCount: webhook.failureCount + (response.ok ? 0 : 1),
        })
        .where(eq(webhooks.id, webhook.id));

      this.logger.log(`Webhook delivered: ${webhook.id} - ${response.status}`);
    } catch (error) {
      await db
        .update(webhookDeliveries)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown",
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      await db
        .update(webhooks)
        .set({
          lastTriggeredAt: new Date(),
          failureCount: webhook.failureCount + 1,
        })
        .where(eq(webhooks.id, webhook.id));

      this.logger.error(`Webhook failed: ${webhook.id}`, error);
    }
  }

  private toResponse = (w: any): WebhookResponse => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: JSON.parse(w.events),
    status: w.status,
    description: w.description,
    organizationId: w.organizationId,
    isActive: w.isActive,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    lastTriggeredAt: w.lastTriggeredAt,
    failureCount: w.failureCount,
    successCount: w.successCount,
  });
}
