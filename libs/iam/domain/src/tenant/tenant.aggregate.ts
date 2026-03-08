/**
 * 租户聚合根
 *
 * 租户是 SaaS 平台中的企业客户，包含多个组织。
 * 租户是数据隔离的基本单位。
 *
 * @example
 * ```typescript
 * const result = Tenant.create({
 *   name: "企业A",
 *   slug: "enterprise-a",
 *   plan: "PRO",
 *   ownerId: "user-123",
 * });
 *
 * if (result.isOk()) {
 *   const tenant = result.value;
 *   console.log(tenant.domainEvents); // 自动管理领域事件
 * }
 * ```
 */
import { AggregateRoot, Guard, Result, UniqueEntityID } from "@oksai/kernel";
import { TenantActivatedEvent } from "../events/tenant-activated.event.js";
import { TenantCreatedEvent } from "../events/tenant-created.event.js";
import { TenantQuotaUpdatedEvent } from "../events/tenant-quota-updated.event.js";
import { TenantSuspendedEvent } from "../events/tenant-suspended.event.js";
import { TenantPlan } from "./tenant-plan.vo.js";
import { TenantQuota } from "./tenant-quota.vo.js";
import { TenantStatus } from "./tenant-status.vo.js";

/**
 * 租户属性
 */
export interface TenantProps {
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  ownerId: UniqueEntityID;
  quota: TenantQuota;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

/**
 * 租户聚合根
 *
 * 继承 AggregateRoot，自动获得领域事件管理能力。
 */
export class Tenant extends AggregateRoot<TenantProps> {
  /**
   * 私有构造函数，通过工厂方法创建
   */
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // ========== Getter 方法 ==========

  /**
   * 获取租户名称
   */
  get name(): string {
    return this.props.name;
  }

  /**
   * 获取租户唯一标识（slug）
   */
  get slug(): string {
    return this.props.slug;
  }

  /**
   * 获取租户套餐
   */
  get plan(): TenantPlan {
    return this.props.plan;
  }

  /**
   * 获取租户状态
   */
  get status(): TenantStatus {
    return this.props.status;
  }

  /**
   * 获取租户所有者 ID
   */
  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  /**
   * 获取租户配额
   */
  get quota(): TenantQuota {
    return this.props.quota;
  }

  /**
   * 获取租户设置
   */
  get settings(): Record<string, unknown> {
    return this.props.settings;
  }

  /**
   * 获取租户元数据
   */
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  // ========== 业务方法 ==========

  /**
   * 激活租户
   *
   * 业务规则：只有 PENDING 状态的租户才能被激活
   *
   * @returns Result<void, Error>
   */
  public activate(): Result<void, Error> {
    // 验证前置条件
    if (!this.props.status.canBeActivated()) {
      return Result.fail(
        new Error(`只有待审核的租户才能激活。当前状态：${this.props.status.getDisplayName()}`)
      );
    }

    // 更新状态
    this.props.status = TenantStatus.active();

    // 添加领域事件
    this.addDomainEvent(
      new TenantActivatedEvent(
        {
          tenantId: this.id.toString(),
          activatedAt: new Date(),
        },
        this.id
      )
    );

    return Result.ok(undefined);
  }

  /**
   * 停用租户
   *
   * 业务规则：只有 ACTIVE 状态的租户才能被停用
   *
   * @param reason - 停用原因
   * @returns Result<void, Error>
   */
  public suspend(reason: string): Result<void, Error> {
    // 验证前置条件
    if (!this.props.status.canBeSuspended()) {
      return Result.fail(
        new Error(`只有活跃的租户才能停用。当前状态：${this.props.status.getDisplayName()}`)
      );
    }

    // 验证参数
    if (Guard.isEmpty(reason)) {
      return Result.fail(new Error("停用原因不能为空"));
    }

    // 更新状态
    this.props.status = TenantStatus.suspended();

    // 添加领域事件
    this.addDomainEvent(
      new TenantSuspendedEvent(
        {
          tenantId: this.id.toString(),
          reason,
          suspendedAt: new Date(),
        },
        this.id
      )
    );

    return Result.ok(undefined);
  }

  /**
   * 检查配额
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 是否在配额限制内
   */
  public checkQuota(resource: "organizations" | "members" | "storage", currentUsage: number): boolean {
    return this.props.quota.isWithinLimit(resource, currentUsage);
  }

  /**
   * 更新配额
   *
   * @param newQuota - 新配额
   * @returns Result<void, Error>
   */
  public updateQuota(newQuota: TenantQuota): Result<void, Error> {
    // 验证参数
    if (!newQuota) {
      return Result.fail(new Error("配额不能为空"));
    }

    // 保存旧配额
    const oldQuota = this.props.quota;

    // 更新配额
    this.props.quota = newQuota;

    // 添加领域事件
    this.addDomainEvent(
      new TenantQuotaUpdatedEvent(
        {
          tenantId: this.id.toString(),
          oldQuota: oldQuota.getProps(),
          newQuota: newQuota.getProps(),
        },
        this.id
      )
    );

    return Result.ok(undefined);
  }

  /**
   * 更新设置
   *
   * @param settings - 新设置
   */
  public updateSettings(settings: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...settings };
  }

  /**
   * 更新元数据
   *
   * @param metadata - 新元数据
   */
  public updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
  }

  /**
   * 检查是否可以访问系统
   *
   * @returns 是否可以访问
   */
  public canBeAccessed(): boolean {
    return this.props.status.canBeAccessed();
  }

  // ========== 工厂方法 ==========

  /**
   * 创建新租户（工厂方法）
   *
   * @param props - 租户属性
   * @param id - 可选的唯一标识符
   * @returns Result<Tenant, Error>
   */
  public static create(
    props: {
      name: string;
      slug: string;
      plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
      ownerId: string;
      quota?: TenantQuota;
      settings?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
    id?: UniqueEntityID
  ): Result<Tenant, Error> {
    // ✅ 使用 Guard 验证参数
    const guardResults = [
      Guard.againstEmpty("name", props.name),
      Guard.againstEmpty("slug", props.slug),
      Guard.againstEmpty("ownerId", props.ownerId),
    ];

    const guardResult = Guard.combine(guardResults);

    if (guardResult.isFail()) {
      const errorMessage = guardResult.error?.[0]?.message || "验证失败";
      return Result.fail(new Error(errorMessage));
    }

    // 验证 slug 长度
    if (props.slug.length < 3) {
      return Result.fail(new Error("slug 长度不能小于 3 个字符"));
    }
    if (props.slug.length > 100) {
      return Result.fail(new Error("slug 长度不能大于 100 个字符"));
    }

    // 验证 slug 格式（只允许小写字母、数字、连字符）
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(props.slug)) {
      return Result.fail(new Error("slug 只能包含小写字母、数字和连字符"));
    }

    // 创建套餐值对象
    const planResult = TenantPlan.create(props.plan);
    if (planResult.isFail()) {
      const error = planResult.error;
      return Result.fail(error ?? new Error("创建套餐失败"));
    }

    // 获取套餐值（此时 TypeScript 知道 isFail() 为 false，所以 value 是 TenantPlan）
    const plan = planResult.value as TenantPlan;

    // 创建配额（如果没有提供，则根据套餐创建默认配额）
    const quota = props.quota || TenantQuota.createForPlan(plan);

    // 创建租户实例
    const tenant = new Tenant(
      {
        name: props.name,
        slug: props.slug,
        plan,
        status: TenantStatus.pending(),
        ownerId: new UniqueEntityID(props.ownerId),
        quota,
        settings: props.settings || {},
        metadata: props.metadata || {},
      },
      id
    );

    // ✅ 添加领域事件（AggregateRoot 自动管理）
    tenant.addDomainEvent(
      new TenantCreatedEvent(
        {
          tenantId: tenant.id.toString(),
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan.value,
          ownerId: tenant.ownerId.toString(),
        },
        tenant.id
      )
    );

    return Result.ok(tenant);
  }

  /**
   * 从持久化重建租户（工厂方法）
   *
   * @param props - 租户属性
   * @param id - 唯一标识符
   * @returns Tenant 实例
   */
  public static reconstitute(props: TenantProps, id: UniqueEntityID): Tenant {
    return new Tenant(props, id);
  }
}
