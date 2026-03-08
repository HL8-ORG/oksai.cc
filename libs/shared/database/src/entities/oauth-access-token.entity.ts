import { BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./base.entity.js";

@Entity()
@Unique({ properties: ["accessToken"] })
export class OAuthAccessToken extends BaseEntity {
  @Property()
  accessToken: string;

  @Property()
  @Index()
  clientId: string;

  @Property()
  @Index()
  userId: string;

  @Property()
  scope: string;

  @Property()
  expiresAt: Date;

  @Property({ nullable: true })
  revokedAt?: Date;

  /**
   * 租户 ID（多租户隔离）
   */
  @Property({ nullable: true })
  @Index()
  tenantId?: string;

  @BeforeCreate()
  beforeCreate() {
    if (new Date() > this.expiresAt) {
      throw new Error("访问令牌已过期");
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
      throw new Error("令牌已撤销");
    }
    this.revokedAt = new Date();
  }

  constructor(accessToken: string, clientId: string, userId: string, scope: string, expiresAt: Date) {
    super();
    this.accessToken = accessToken;
    this.clientId = clientId;
    this.userId = userId;
    this.scope = scope;
    this.expiresAt = expiresAt;
  }
}
