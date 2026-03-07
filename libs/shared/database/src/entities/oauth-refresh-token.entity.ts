import { BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./base.entity.js";

@Entity()
@Unique({ properties: ["refreshToken"] })
export class OAuthRefreshToken extends BaseEntity {
  @Property()
  refreshToken: string;

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

  @BeforeCreate()
  beforeCreate() {
    if (new Date() > this.expiresAt) {
      throw new Error("刷新令牌已过期");
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

  constructor(refreshToken: string, clientId: string, userId: string, scope: string, expiresAt: Date) {
    super();
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.userId = userId;
    this.scope = scope;
    this.expiresAt = expiresAt;
  }
}
