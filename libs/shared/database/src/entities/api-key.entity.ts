import { BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./base.entity.js";

@Entity()
@Unique({ properties: ["key"] })
export class ApiKey extends BaseEntity {
  @Property()
  configId: string = "default";

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true })
  start?: string;

  @Property({ nullable: true })
  prefix?: string;

  @Property()
  key: string;

  @Property()
  @Index()
  referenceId: string;

  @Property({ nullable: true })
  refillInterval?: number;

  @Property({ nullable: true })
  refillAmount?: number;

  @Property({ nullable: true })
  lastRefillAt?: Date;

  @Property()
  enabled: boolean = true;

  @Property()
  rateLimitEnabled: boolean = false;

  @Property({ nullable: true })
  rateLimitTimeWindow?: number;

  @Property({ nullable: true })
  rateLimitMax?: number;

  @Property()
  requestCount: number = 0;

  @Property({ nullable: true })
  remaining?: number;

  @Property({ nullable: true })
  lastRequest?: Date;

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property({ nullable: true })
  revokedAt?: Date;

  @Property({ nullable: true })
  permissions?: string;

  @Property({ type: "json", nullable: true })
  metadata?: Record<string, unknown>;

  @BeforeCreate()
  beforeCreate() {
    if (this.expiresAt && new Date() > this.expiresAt) {
      throw new Error("API Key 已过期");
    }
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  isValid(): boolean {
    return this.enabled && !this.isExpired() && !this.isRevoked();
  }

  revoke(): void {
    if (this.isRevoked()) {
      throw new Error("API Key 已撤销");
    }
    this.revokedAt = new Date();
    this.enabled = false;
  }

  incrementRequestCount(): void {
    this.requestCount++;
    this.lastRequest = new Date();
  }

  canMakeRequest(): boolean {
    if (!this.isValid()) return false;
    if (this.rateLimitEnabled && this.remaining !== undefined) {
      return this.remaining > 0;
    }
    return true;
  }

  decrementRemaining(): void {
    if (this.remaining !== undefined && this.remaining > 0) {
      this.remaining--;
    }
  }

  refill(): void {
    if (this.refillAmount && this.refillInterval) {
      this.remaining = (this.remaining || 0) + this.refillAmount;
      this.lastRefillAt = new Date();
    }
  }

  constructor(key: string, referenceId: string) {
    super();
    this.key = key;
    this.referenceId = referenceId;
  }
}
