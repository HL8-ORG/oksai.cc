import { AfterUpdate, BeforeCreate, Entity, Property } from "@mikro-orm/core";
import { UniqueEntityID } from "@oksai/kernel";
import { TenantActivatedEvent, TenantCreatedEvent, TenantUpdatedEvent } from "../events/tenant.events.js";
import { BaseEntity } from "./base.entity.js";

@Entity()
export class Tenant extends BaseEntity {
  @Property()
  name: string;

  @Property()
  plan: string;

  @Property()
  status: string;

  private _domainEvents: Array<TenantCreatedEvent | TenantUpdatedEvent | TenantActivatedEvent> = [];

  constructor(name: string, plan: string) {
    super();
    this.name = name;
    this.plan = plan;
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
}
