import { Entity, Index, ManyToOne, Property } from "@mikro-orm/core";
import type { WebhookDeliveryStatus, WebhookEventType } from "../events/webhook.events.js";
import { BaseEntity } from "./base.entity.js";
import { Webhook } from "./webhook.entity.js";

@Entity()
export class WebhookDelivery extends BaseEntity {
  @ManyToOne(() => Webhook)
  @Index()
  webhook: Webhook;

  @Property()
  @Index()
  eventType: WebhookEventType;

  @Property({ type: "json" })
  payload: Record<string, unknown>;

  @Property()
  @Index()
  status: WebhookDeliveryStatus = "pending";

  @Property({ nullable: true })
  responseStatusCode?: number;

  @Property({ type: "json", nullable: true })
  responseHeaders?: Record<string, string>;

  @Property({ nullable: true })
  responseBody?: string;

  @Property({ nullable: true })
  errorMessage?: string;

  @Property()
  attemptCount: number = 0;

  @Property()
  maxAttempts: number = 5;

  @Property({ nullable: true })
  @Index()
  nextRetryAt?: Date;

  @Property({ nullable: true })
  deliveredAt?: Date;

  /**
   * 租户 ID（多租户隔离）
   */
  @Property({ nullable: true })
  @Index()
  tenantId?: string;

  constructor(webhook: Webhook, eventType: WebhookEventType, payload: Record<string, unknown>) {
    super();
    this.webhook = webhook;
    this.eventType = eventType;
    this.payload = payload;
  }

  recordSuccess(statusCode: number, headers: Record<string, string>, body: string): void {
    this.status = "success";
    this.responseStatusCode = statusCode;
    this.responseHeaders = headers;
    this.responseBody = body;
    this.deliveredAt = new Date();
    this.nextRetryAt = undefined;
  }

  recordFailure(error: string): void {
    this.status = this.attemptCount < this.maxAttempts ? "retrying" : "failed";
    this.errorMessage = error;
    this.attemptCount++;

    if (this.status === "retrying") {
      const delay = Math.min(1000 * 2 ** this.attemptCount, 60000);
      this.nextRetryAt = new Date(Date.now() + delay);
    }
  }

  canRetry(): boolean {
    return this.status === "retrying" && this.attemptCount < this.maxAttempts;
  }

  markPending(): void {
    this.status = "pending";
  }
}
