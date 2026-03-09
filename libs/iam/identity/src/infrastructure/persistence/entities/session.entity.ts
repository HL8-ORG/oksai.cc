import { BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./base.entity.js";

@Entity()
@Unique({ properties: ["token"] })
export class Session extends BaseEntity {
  @Property()
  @Index()
  userId: string;

  @Property()
  expiresAt: Date;

  @Property()
  token: string;

  @Property({ nullable: true })
  ipAddress?: string;

  @Property({ nullable: true })
  userAgent?: string;

  /**
   * 租户 ID（多租户隔离）
   */
  @Property({ nullable: true })
  @Index()
  tenantId?: string;

  @Property({ nullable: true })
  revokedAt?: Date;

  @BeforeCreate()
  beforeCreate() {
    if (new Date() > this.expiresAt) {
      throw new Error("会话已过期");
    }
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(): void {
    if (this.isRevoked()) {
      throw new Error("会话已撤销");
    }
    this.revokedAt = new Date();
  }

  extend(durationSeconds: number): void {
    this.expiresAt = new Date(Date.now() + durationSeconds * 1000);
  }

  constructor(userId: string, token: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    super();
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }
}
