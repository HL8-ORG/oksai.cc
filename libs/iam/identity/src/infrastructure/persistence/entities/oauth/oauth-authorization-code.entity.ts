import { BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "../base.entity.js";

@Entity()
@Unique({ properties: ["code"] })
export class OAuthAuthorizationCode extends BaseEntity {
  @Property()
  code: string;

  @Property()
  @Index()
  clientId: string;

  @Property()
  @Index()
  userId: string;

  @Property()
  redirectUri: string;

  @Property()
  scope: string;

  @Property({ nullable: true })
  codeChallenge?: string;

  @Property({ nullable: true })
  codeChallengeMethod?: string;

  @Property()
  expiresAt: Date;

  @Property({ nullable: true })
  usedAt?: Date;

  /**
   * 租户 ID（多租户隔离）
   */
  @Property({ nullable: true })
  @Index()
  tenantId?: string;

  @BeforeCreate()
  beforeCreate() {
    if (new Date() > this.expiresAt) {
      throw new Error("授权码已过期");
    }
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return !!this.usedAt;
  }

  markAsUsed(): void {
    if (this.isUsed()) {
      throw new Error("授权码已使用");
    }
    this.usedAt = new Date();
  }

  constructor(
    code: string,
    clientId: string,
    userId: string,
    redirectUri: string,
    scope: string,
    expiresAt: Date
  ) {
    super();
    this.code = code;
    this.clientId = clientId;
    this.userId = userId;
    this.redirectUri = redirectUri;
    this.scope = scope;
    this.expiresAt = expiresAt;
  }
}
