import { AfterUpdate, BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { UniqueEntityID } from "@oksai/domain-core";
import { BaseEntity } from "../base.entity.js";

export type OAuthClientType = "confidential" | "public";

@Entity()
@Unique({ properties: ["clientId"] })
export class OAuthClient extends BaseEntity {
  @Property()
  name: string;

  @Property()
  clientId: string;

  @Property({ nullable: true })
  clientSecret?: string;

  @Property()
  clientType: OAuthClientType = "confidential";

  @Property({ type: "text[]" })
  redirectUris: string[] = [];

  @Property({ type: "text[]" })
  allowedScopes: string[] = [];

  @Property({ nullable: true })
  description?: string;

  @Property({ nullable: true })
  homepageUrl?: string;

  @Property({ nullable: true })
  logoUrl?: string;

  @Property({ nullable: true })
  privacyPolicyUrl?: string;

  @Property({ nullable: true })
  termsOfServiceUrl?: string;

  @Property()
  isActive: boolean = true;

  @Property({ nullable: true })
  @Index()
  createdBy?: string;

  /**
   * 租户 ID（多租户隔离）
   */
  @Property({ nullable: true })
  @Index()
  tenantId?: string;

  private _domainEvents: any[] = [];

  get aggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.id);
  }

  get domainEvents(): ReadonlyArray<any> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: any): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  @BeforeCreate()
  beforeCreate() {
    if (!this.clientSecret && this.clientType === "confidential") {
      throw new Error("机密客户端必须设置 clientSecret");
    }
  }

  @AfterUpdate()
  afterUpdate() {
    // 可以添加更新事件
  }

  deactivate(): void {
    if (!this.isActive) {
      throw new Error("客户端已停用");
    }
    this.isActive = false;
  }

  activate(): void {
    if (this.isActive) {
      throw new Error("客户端已激活");
    }
    this.isActive = true;
  }

  rotateSecret(newSecret: string): void {
    this.clientSecret = newSecret;
  }

  validateRedirectUri(redirectUri: string): boolean {
    return this.redirectUris.includes(redirectUri);
  }

  validateScope(scope: string): boolean {
    const requestedScopes = scope.split(" ");
    return requestedScopes.every((s) => this.allowedScopes.includes(s));
  }

  constructor(
    name: string,
    clientId: string,
    redirectUris: string[],
    allowedScopes: string[],
    clientType: OAuthClientType = "confidential"
  ) {
    super();
    this.name = name;
    this.clientId = clientId;
    this.redirectUris = redirectUris;
    this.allowedScopes = allowedScopes;
    this.clientType = clientType;
  }
}
