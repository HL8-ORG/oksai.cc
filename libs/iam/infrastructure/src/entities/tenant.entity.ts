import { AfterUpdate, BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { UniqueEntityID } from "@oksai/kernel";
import { TenantActivatedEvent, TenantCreatedEvent, TenantUpdatedEvent } from "../events/tenant.events.js";
import { BaseEntity } from "./base.entity.js";

@Entity()
@Unique({ properties: ["slug"] })
export class Tenant extends BaseEntity {
  @Property()
  name: string;

  /**
   * 租户唯一标识（URL 友好）
   */
  @Property()
  @Index()
  slug!: string;

  @Property()
  plan: string;

  @Property()
  @Index()
  status: string;

  /**
   * 租户所有者 ID
   */
  @Property({ nullable: true })
  @Index()
  ownerId?: string;

  /**
   * 最大组织数（-1 表示无限制）
   */
  @Property({ default: 1 })
  maxOrganizations: number = 1;

  /**
   * 最大成员数（-1 表示无限制）
   */
  @Property({ default: 10 })
  maxMembers: number = 10;

  /**
   * 最大存储空间（字节，-1 表示无限制）
   */
  @Property({ default: 1073741824 })
  maxStorage: number = 1073741824;

  /**
   * 租户自定义配置
   */
  @Property({ type: "json", nullable: true })
  settings?: Record<string, unknown>;

  /**
   * 租户元数据
   */
  @Property({ type: "json", nullable: true })
  metadata?: Record<string, unknown>;

  private _domainEvents: Array<TenantCreatedEvent | TenantUpdatedEvent | TenantActivatedEvent> = [];

  constructor(name: string, plan: string, slug?: string, ownerId?: string) {
    super();
    this.name = name;
    this.plan = plan;
    this.slug = slug || name.toLowerCase().replace(/\s+/g, "-").substring(0, 100);
    this.ownerId = ownerId;
    this.status = "pending";

    // 在构造函数中生成领域事件（聚合根创建时即生成事件）
    // 注意：@BeforeCreate() 只在 MikroORM 持久化时触发
    // 但领域事件应该在聚合创建时就生成
    this.addDomainEvent(
      new TenantCreatedEvent(this.aggregateId, {
        tenantId: this.id,
        name: this.name,
        plan: this.plan,
      })
    );
  }

  get aggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.id);
  }

  get domainEvents(): ReadonlyArray<TenantCreatedEvent | TenantUpdatedEvent | TenantActivatedEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: TenantCreatedEvent | TenantUpdatedEvent | TenantActivatedEvent): void {
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
    this.status = "pending";
    // 领域事件已在构造函数中生成，此处仅设置默认状态
  }

  @AfterUpdate()
  afterUpdate() {
    this.addDomainEvent(
      new TenantUpdatedEvent(this.aggregateId, {
        tenantId: this.id,
        updates: {},
      })
    );
  }

  activate(): void {
    if (this.status !== "pending") {
      throw new Error("只有待审核的租户才能激活");
    }
    this.status = "active";
    this.addDomainEvent(
      new TenantActivatedEvent(this.aggregateId, {
        tenantId: this.id,
        activatedAt: new Date(),
      })
    );
  }

  /**
   * 停用租户
   */
  suspend(reason: string): void {
    if (this.status !== "active") {
      throw new Error("只有活跃的租户才能停用");
    }
    this.status = "suspended";
    this.metadata = {
      ...this.metadata,
      suspensionReason: reason,
      suspendedAt: new Date(),
    };
  }

  /**
   * 检查配额
   */
  checkQuota(resource: "organizations" | "members" | "storage", currentUsage: number): boolean {
    const limits = {
      organizations: this.maxOrganizations,
      members: this.maxMembers,
      storage: this.maxStorage,
    };

    const limit = limits[resource];
    if (limit === -1) return true; // -1 表示无限制
    return currentUsage < limit;
  }
}
