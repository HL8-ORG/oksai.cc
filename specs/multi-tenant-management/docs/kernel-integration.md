# 多租户管理 - Kernel 集成指南

## 概述

本指南说明如何在多租户管理功能中充分利用 `@oksai/kernel` 提供的 DDD 基础设施。

## @oksai/kernel 提供的核心类

| 类 | 用途 | 使用场景 |
|---|---|---|
| **AggregateRoot** | 聚合根基类 | Tenant 聚合根 |
| **Entity** | 实体基类 | Organization 实体 |
| **ValueObject** | 值对象基类 | TenantQuota, TenantPlan, TenantStatus |
| **DomainEvent** | 领域事件基类 | TenantCreated, TenantActivated 等 |
| **Result** | 函数式错误处理 | 工厂方法返回值 |
| **Guard** | 参数验证 | 创建/更新时的参数检查 |
| **UniqueEntityID** | 唯一标识符 | 所有实体 ID |

## 领域层设计

### 1. Tenant 聚合根（使用 AggregateRoot）

```typescript
// libs/shared/database/src/domain/tenant/tenant.aggregate.ts
import { AggregateRoot, Result, Guard, UniqueEntityID } from "@oksai/kernel";
import { TenantQuota } from "./tenant-quota.vo.js";
import { TenantPlan } from "./tenant-plan.vo.js";
import { TenantStatus } from "./tenant-status.vo.js";
import { TenantCreatedEvent } from "../events/tenant-created.event.js";
import { TenantActivatedEvent } from "../events/tenant-activated.event.js";

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
}

/**
 * 租户聚合根
 * 
 * 使用 AggregateRoot 基类，自动获得领域事件管理能力。
 */
export class Tenant extends AggregateRoot<TenantProps> {
  // ✅ 私有构造函数，通过工厂方法创建
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // ========== Getter 方法 ==========

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get plan(): TenantPlan {
    return this.props.plan;
  }

  get status(): TenantStatus {
    return this.props.status;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get quota(): TenantQuota {
    return this.props.quota;
  }

  // ========== 业务方法 ==========

  /**
   * 激活租户
   * 
   * 业务规则：只有 PENDING 状态的租户才能被激活
   */
  public activate(): Result<void, Error> {
    // 使用 Guard 进行前置条件检查
    if (!this.props.status.isPending()) {
      return Result.fail(new Error("只有待审核的租户才能激活"));
    }

    // 更新状态
    this.props.status = TenantStatus.active();
    
    // 添加领域事件
    this.addDomainEvent(
      new TenantActivatedEvent({
        tenantId: this.id,
        activatedAt: new Date(),
      }, this.id)
    );

    return Result.ok(undefined);
  }

  /**
   * 停用租户
   */
  public suspend(reason: string): Result<void, Error> {
    if (!this.props.status.isActive()) {
      return Result.fail(new Error("只有活跃的租户才能停用"));
    }

    this.props.status = TenantStatus.suspended();
    
    this.addDomainEvent(
      new TenantSuspendedEvent({
        tenantId: this.id,
        reason,
        suspendedAt: new Date(),
      }, this.id)
    );

    return Result.ok(undefined);
  }

  /**
   * 检查配额
   */
  public checkQuota(
    resource: "organizations" | "members" | "storage",
    currentUsage: number
  ): boolean {
    return this.props.quota.isWithinLimit(resource, currentUsage);
  }

  /**
   * 更新配额
   */
  public updateQuota(newQuota: TenantQuota): Result<void, Error> {
    const guardResult = Guard.combine([
      Guard.againstNull("quota", newQuota),
    ]);

    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error[0].message));
    }

    this.props.quota = newQuota;
    
    this.addDomainEvent(
      new TenantQuotaUpdatedEvent({
        tenantId: this.id,
        newQuota: newQuota.getProps(),
      }, this.id)
    );

    return Result.ok(undefined);
  }

  // ========== 工厂方法 ==========

  /**
   * 创建新租户（工厂方法）
   * 
   * 使用 Result 返回值，避免抛出异常
   */
  public static create(
    props: {
      name: string;
      slug: string;
      plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
      ownerId: string;
    },
    id?: UniqueEntityID
  ): Result<Tenant, Error> {
    // ✅ 使用 Guard 进行参数验证
    const guardResult = Guard.combine([
      Guard.againstEmpty("name", props.name),
      Guard.againstEmpty("slug", props.slug),
      Guard.againstEmpty("ownerId", props.ownerId),
      Guard.minLength(props.slug, 3),
      Guard.maxLength(props.slug, 100),
    ]);

    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error.map(e => e.message).join(", ")));
    }

    // 创建值对象
    const planResult = TenantPlan.create(props.plan);
    if (planResult.isFail()) {
      return Result.fail(planResult.error);
    }

    // 创建默认配额（基于套餐）
    const quota = TenantQuota.createForPlan(planResult.value);

    // 创建租户实例
    const tenant = new Tenant(
      {
        name: props.name,
        slug: props.slug,
        plan: planResult.value,
        status: TenantStatus.pending(),
        ownerId: new UniqueEntityID(props.ownerId),
        quota,
        settings: {},
      },
      id
    );

    // ✅ 添加领域事件（AggregateRoot 自动管理）
    tenant.addDomainEvent(
      new TenantCreatedEvent({
        tenantId: tenant.id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan.value,
      }, tenant.id)
    );

    return Result.ok(tenant);
  }

  /**
   * 从持久化重建租户（工厂方法）
   */
  public static reconstitute(
    props: TenantProps,
    id: UniqueEntityID
  ): Tenant {
    return new Tenant(props, id);
  }
}
```

### 2. TenantQuota 值对象（使用 ValueObject）

```typescript
// libs/shared/database/src/domain/tenant/tenant-quota.vo.ts
import { ValueObject, Result, Guard } from "@oksai/kernel";

/**
 * 租户配额属性
 */
export interface TenantQuotaProps {
  maxOrganizations: number;
  maxMembers: number;
  maxStorage: number; // 字节
}

/**
 * 租户配额值对象
 * 
 * 不可变，所有操作返回新实例。
 */
export class TenantQuota extends ValueObject<TenantQuotaProps> {
  // ========== Getter 方法 ==========

  get maxOrganizations(): number {
    return this.props.maxOrganizations;
  }

  get maxMembers(): number {
    return this.props.maxMembers;
  }

  get maxStorage(): number {
    return this.props.maxStorage;
  }

  // ========== 业务方法 ==========

  /**
   * 检查是否在配额限制内
   */
  public isWithinLimit(
    resource: "organizations" | "members" | "storage",
    currentUsage: number
  ): boolean {
    const limits = {
      organizations: this.props.maxOrganizations,
      members: this.props.maxMembers,
      storage: this.props.maxStorage,
    };

    return currentUsage < limits[resource];
  }

  /**
   * 增加配额（返回新实例）
   */
  public increase(
    resource: "organizations" | "members" | "storage",
    amount: number
  ): TenantQuota {
    const newProps = { ...this.props };

    switch (resource) {
      case "organizations":
        newProps.maxOrganizations += amount;
        break;
      case "members":
        newProps.maxMembers += amount;
        break;
      case "storage":
        newProps.maxStorage += amount;
        break;
    }

    return new TenantQuota(newProps);
  }

  /**
   * 格式化为可读字符串
   */
  public toString(): string {
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return `组织: ${this.props.maxOrganizations}, 成员: ${this.props.maxMembers}, 存储: ${formatBytes(this.props.maxStorage)}`;
  }

  // ========== 工厂方法 ==========

  /**
   * 创建配额
   */
  public static create(props: TenantQuotaProps): Result<TenantQuota, Error> {
    const guardResult = Guard.combine([
      Guard.againstNull("maxOrganizations", props.maxOrganizations),
      Guard.againstNull("maxMembers", props.maxMembers),
      Guard.againstNull("maxStorage", props.maxStorage),
    ]);

    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error[0].message));
    }

    if (props.maxOrganizations < 0 || props.maxMembers < 0 || props.maxStorage < 0) {
      return Result.fail(new Error("配额不能为负数"));
    }

    return Result.ok(new TenantQuota(props));
  }

  /**
   * 根据套餐创建默认配额
   */
  public static createForPlan(plan: TenantPlan): TenantQuota {
    const quotaMap: Record<string, TenantQuotaProps> = {
      FREE: { maxOrganizations: 1, maxMembers: 5, maxStorage: 1073741824 }, // 1GB
      STARTER: { maxOrganizations: 3, maxMembers: 20, maxStorage: 10737418240 }, // 10GB
      PRO: { maxOrganizations: 10, maxMembers: 100, maxStorage: 107374182400 }, // 100GB
      ENTERPRISE: { maxOrganizations: -1, maxMembers: -1, maxStorage: -1 }, // 无限制
    };

    return new TenantQuota(quotaMap[plan.value] || quotaMap.FREE);
  }
}
```

### 3. TenantPlan 值对象

```typescript
// libs/shared/database/src/domain/tenant/tenant-plan.vo.ts
import { ValueObject, Result, Guard } from "@oksai/kernel";

export type TenantPlanValue = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

/**
 * 租户套餐值对象
 */
export class TenantPlan extends ValueObject<{ value: TenantPlanValue }> {
  get value(): TenantPlanValue {
    return this.props.value;
  }

  /**
   * 检查是否支持某个功能
   */
  public supportsFeature(feature: string): boolean {
    const featuresByPlan: Record<TenantPlanValue, string[]> = {
      FREE: ["basic_auth"],
      STARTER: ["basic_auth", "sso", "webhooks"],
      PRO: ["basic_auth", "sso", "webhooks", "api_access", "custom_domain"],
      ENTERPRISE: ["basic_auth", "sso", "webhooks", "api_access", "custom_domain", "sla", "support"],
    };

    return featuresByPlan[this.props.value].includes(feature);
  }

  /**
   * 比较套餐等级
   */
  public isHigherThan(other: TenantPlan): boolean {
    const levels: Record<TenantPlanValue, number> = {
      FREE: 0,
      STARTER: 1,
      PRO: 2,
      ENTERPRISE: 3,
    };

    return levels[this.props.value] > levels[other.value];
  }

  public static create(value: string): Result<TenantPlan, Error> {
    const validPlans: TenantPlanValue[] = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

    if (!validPlans.includes(value as TenantPlanValue)) {
      return Result.fail(new Error(`无效的套餐类型: ${value}`));
    }

    return Result.ok(new TenantPlan({ value: value as TenantPlanValue }));
  }

  public static free(): TenantPlan {
    return new TenantPlan({ value: "FREE" });
  }

  public static pro(): TenantPlan {
    return new TenantPlan({ value: "PRO" });
  }

  public static enterprise(): TenantPlan {
    return new TenantPlan({ value: "ENTERPRISE" });
  }
}
```

### 4. TenantStatus 值对象

```typescript
// libs/shared/database/src/domain/tenant/tenant-status.vo.ts
import { ValueObject } from "@oksai/kernel";

export type TenantStatusValue = "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";

/**
 * 租户状态值对象
 */
export class TenantStatus extends ValueObject<{ value: TenantStatusValue }> {
  get value(): TenantStatusValue {
    return this.props.value;
  }

  // ========== 状态检查方法 ==========

  public isPending(): boolean {
    return this.props.value === "PENDING";
  }

  public isActive(): boolean {
    return this.props.value === "ACTIVE";
  }

  public isSuspended(): boolean {
    return this.props.value === "SUSPENDED";
  }

  public isDeleted(): boolean {
    return this.props.value === "DELETED";
  }

  public canBeActivated(): boolean {
    return this.isPending();
  }

  public canBeSuspended(): boolean {
    return this.isActive();
  }

  public canBeAccessed(): boolean {
    return this.isActive();
  }

  // ========== 工厂方法 ==========

  public static pending(): TenantStatus {
    return new TenantStatus({ value: "PENDING" });
  }

  public static active(): TenantStatus {
    return new TenantStatus({ value: "ACTIVE" });
  }

  public static suspended(): TenantStatus {
    return new TenantStatus({ value: "SUSPENDED" });
  }

  public static deleted(): TenantStatus {
    return new TenantStatus({ value: "DELETED" });
  }
}
```

### 5. 领域事件（使用 DomainEvent）

```typescript
// libs/shared/database/src/domain/events/tenant-created.event.ts
import { DomainEvent, UniqueEntityID } from "@oksai/kernel";

export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  slug: string;
  plan: string;
}

export class TenantCreatedEvent extends DomainEvent<TenantCreatedPayload> {
  constructor(payload: TenantCreatedPayload, aggregateId: UniqueEntityID) {
    super({
      eventName: "TenantCreated",
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}

// 其他事件...
export class TenantActivatedEvent extends DomainEvent<{
  tenantId: UniqueEntityID;
  activatedAt: Date;
}> {
  constructor(payload: { tenantId: UniqueEntityID; activatedAt: Date }, aggregateId: UniqueEntityID) {
    super({
      eventName: "TenantActivated",
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}
```

## 应用层设计

### TenantService（使用 Result 处理错误）

```typescript
// apps/gateway/src/tenant/tenant.service.ts
import { Injectable } from "@nestjs/common";
import { Result } from "@oksai/kernel";
import { Tenant } from "@oksai/database/domain/tenant/tenant.aggregate.js";
import { TenantRepository } from "./repositories/tenant.repository.js";

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  /**
   * 创建租户
   * 
   * ✅ 使用 Result 返回值，避免抛出异常
   */
  async createTenant(props: {
    name: string;
    slug: string;
    plan: string;
    ownerId: string;
  }): Promise<Result<Tenant, Error>> {
    // 调用聚合根的工厂方法
    const tenantResult = Tenant.create(props);

    if (tenantResult.isFail()) {
      return Result.fail(tenantResult.error);
    }

    const tenant = tenantResult.value;

    // 持久化
    await this.tenantRepo.save(tenant);

    // ✅ 聚合根自动管理领域事件
    // 发布事件（由事件发布器处理）
    // for (const event of tenant.domainEvents) {
    //   await this.eventPublisher.publish(event);
    // }
    // tenant.clearDomainEvents();

    return Result.ok(tenant);
  }

  /**
   * 激活租户
   */
  async activateTenant(tenantId: string): Promise<Result<void, Error>> {
    const tenant = await this.tenantRepo.findById(tenantId);

    if (!tenant) {
      return Result.fail(new Error("租户不存在"));
    }

    // ✅ 调用聚合根的业务方法（返回 Result）
    const activateResult = tenant.activate();

    if (activateResult.isFail()) {
      return Result.fail(activateResult.error);
    }

    await this.tenantRepo.save(tenant);

    return Result.ok(undefined);
  }

  /**
   * 检查配额
   */
  async checkQuota(
    tenantId: string,
    resource: "organizations" | "members" | "storage"
  ): Promise<Result<boolean, Error>> {
    const tenant = await this.tenantRepo.findById(tenantId);

    if (!tenant) {
      return Result.fail(new Error("租户不存在"));
    }

    const usage = await this.getUsage(tenantId, resource);
    const hasQuota = tenant.checkQuota(resource, usage);

    return Result.ok(hasQuota);
  }

  private async getUsage(
    tenantId: string,
    resource: string
  ): Promise<number> {
    // 实现使用量统计逻辑
    return 0;
  }
}
```

## 测试示例

```typescript
// libs/shared/database/src/domain/tenant/tenant.aggregate.spec.ts
import { describe, it, expect } from "vitest";
import { Tenant } from "./tenant.aggregate.js";
import { TenantPlan } from "./tenant-plan.vo.js";
import { TenantStatus } from "./tenant-status.vo.js";

describe("Tenant", () => {
  describe("create", () => {
    it("should create tenant with valid props", () => {
      const result = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });

      expect(result.isOk()).toBe(true);
      
      const tenant = result.value;
      expect(tenant.name).toBe("企业A");
      expect(tenant.slug).toBe("enterprise-a");
      expect(tenant.plan.value).toBe("PRO");
      expect(tenant.status.isPending()).toBe(true);
      expect(tenant.hasDomainEvents()).toBe(true);
      expect(tenant.domainEventsCount).toBe(1);
      expect(tenant.domainEvents[0].eventName).toBe("TenantCreated");
    });

    it("should fail with empty name", () => {
      const result = Tenant.create({
        name: "",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("name 不能为空");
    });
  });

  describe("activate", () => {
    it("should activate pending tenant", () => {
      const tenantResult = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });
      
      const tenant = tenantResult.value;
      expect(tenant.status.isPending()).toBe(true);

      const activateResult = tenant.activate();
      
      expect(activateResult.isOk()).toBe(true);
      expect(tenant.status.isActive()).toBe(true);
      expect(tenant.domainEventsCount).toBe(2); // Created + Activated
    });

    it("should fail to activate non-pending tenant", () => {
      const tenantResult = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });
      
      const tenant = tenantResult.value;
      tenant.activate(); // 第一次激活

      const activateAgainResult = tenant.activate(); // 再次激活
      
      expect(activateAgainResult.isFail()).toBe(true);
      expect(activateAgainResult.error.message).toContain("只有待审核的租户才能激活");
    });
  });

  describe("checkQuota", () => {
    it("should return true when under quota", () => {
      const tenantResult = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO", // maxMembers: 100
        ownerId: "user-123",
      });
      
      const tenant = tenantResult.value;
      const hasQuota = tenant.checkQuota("members", 99);
      
      expect(hasQuota).toBe(true);
    });

    it("should return false when at quota", () => {
      const tenantResult = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO", // maxMembers: 100
        ownerId: "user-123",
      });
      
      const tenant = tenantResult.value;
      const hasQuota = tenant.checkQuota("members", 100);
      
      expect(hasQuota).toBe(false);
    });
  });
});
```

## 优势总结

### ✅ 使用 AggregateRoot
- 自动管理领域事件
- 清晰的聚合边界
- 事件发布机制

### ✅ 使用 ValueObject
- 不可变性保证
- 值对象相等性
- 业务逻辑封装（如配额检查）

### ✅ 使用 Result
- 函数式错误处理
- 避免异常抛出
- 明确的成功/失败状态

### ✅ 使用 Guard
- 参数验证
- 组合多个验证
- 清晰的错误信息

### ✅ 使用 UniqueEntityID
- 类型安全的 ID
- 自动生成 ID
- ID 相等性比较

## 下一步

1. 重构 `Tenant` 实体，使用 `AggregateRoot` 基类
2. 创建值对象：`TenantQuota`, `TenantPlan`, `TenantStatus`
3. 更新领域事件，使用 `DomainEvent` 基类
4. 重构 `TenantService`，使用 `Result` 处理错误
5. 编写完整的单元测试

## 参考资料

- DDD 领域驱动设计
- 函数式错误处理（Result Pattern）
- 值对象模式
- 聚合根模式
