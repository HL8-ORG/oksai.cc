import { Entity, Index, Property } from "@mikro-orm/core";
import { WebhookDeliveryStatus, type WebhookEventType, type WebhookStatus } from "../events/webhook.events.js";
import { BaseEntity } from "./base.entity.js";

@Entity()
export class Webhook extends BaseEntity {
  @Property()
  name: string;

  @Property()
  url: string;

  @Property()
  secret: string;

  @Property({ type: "text[]" })
  events: WebhookEventType[] = [];

  @Property()
  status: WebhookStatus = "active";

  @Property({ nullable: true })
  @Index()
  userId?: string;

  @Property({ nullable: true })
  @Index()
  organizationId?: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ type: "json", nullable: true })
  headers?: Record<string, string>;

  @Property()
  isActive: boolean = true;

  @Property({ nullable: true })
  lastTriggeredAt?: Date;

  @Property()
  failureCount: number = 0;

  @Property()
  successCount: number = 0;

  constructor(name: string, url: string, secret: string, events: WebhookEventType[]) {
    super();
    this.name = name;
    this.url = url;
    this.secret = secret;
    this.events = events;
  }

  recordSuccess(): void {
    this.successCount++;
    this.lastTriggeredAt = new Date();
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastTriggeredAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.status = "active";
  }

  deactivate(): void {
    this.isActive = false;
    this.status = "disabled";
  }

  shouldTrigger(eventType: WebhookEventType): boolean {
    return this.isActive && this.events.includes(eventType);
  }
}
