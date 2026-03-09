# Tenant 聚合根示例（简化版）

## 文件路径

`libs/tenancy/domain/tenant/tenant.aggregate.ts`

---

## 规范要求

根据 `docs/02-architecture/spec/spec-02-domain.md`：

- **文件命名**：`[name].aggregate.ts`
- **类命名**：PascalCase，无后缀

---

## 关键代码

```typescript
import { AggregateRoot, Result, UniqueEntityID, Guard } from '@oksai/domain-core';
import type { DomainEvent } from '@oksai/domain-core';
import { DomainException } from '@oksai/exceptions';
import { TenantPlan } from './tenant-plan.vo.js';
import { TenantStatus } from './tenant-status.vo.js';
import { TenantQuota } from './tenant-quota.vo.js';
import { TenantCreatedEvent } from './events/tenant-created.domain-event.js';

export interface TenantProps {
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  ownerId: string;
  quota: TenantQuota;
}

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public get name(): string {
    return this.props.name;
  }

  public get slug(): string {
    return this.props.slug;
  }

  public activate(): Result<void, DomainException> {
    if (!this.props.status.canBeActivated()) {
      return Result.fail(
        new DomainException(
          '只有待审核的租户才能激活',
          'TENANT_CANNOT_ACTIVATE',
        ),
      );
    }

    this.props.status = TenantStatus.active();
    this.addDomainEvent(
      new TenantActivatedEvent(this.id, { tenantId: this.id.toString() }),
    );

    return Result.ok(undefined);
  }

  public static create(
    props: CreateTenantProps,
    id?: UniqueEntityID,
  ): Result<Tenant, DomainException> {
    const guardResult = Guard.combine([
      Guard.againstEmpty('name', props.name),
      Guard.againstEmpty('slug', props.slug),
    ]);

    if (guardResult.isFail()) {
      return Result.fail(
        new DomainException(
          guardResult.error?.[0]?.message || '验证失败',
          'VALIDATION_ERROR',
        ),
      );
    }

    if (!this.isValidSlug(props.slug)) {
      return Result.fail(
        new DomainException('slug 格式不正确', 'INVALID_SLUG'),
      );
    }

    const plan = TenantPlan.create(props.plan);
    const quota = plan.defaultQuota();

    const tenant = new Tenant(
      {
        name: props.name,
        slug: props.slug,
        plan,
        status: TenantStatus.pending(),
        ownerId: props.ownerId,
        quota,
      },
      id,
    );

    tenant.addDomainEvent(
      new TenantCreatedEvent(tenant.id, {
        tenantId: tenant.id.toString(),
        name: tenant.name,
        slug: tenant.slug,
      }),
    );

    return Result.ok(tenant);
  }

  private static isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]{3,100}$/.test(slug);
  }
}
```

---

## 关键点

1. **继承 AggregateRoot**：使用 `@oksai/domain-core` 的基类
2. **Result 模式**：使用 `Result<T, E>` 处理错误
3. **领域事件**：使用 `addDomainEvent()` 发布事件
4. **验证**：使用 `Guard` 验证输入
5. **工厂方法**：使用 `create()` 静态方法创建实例

---

## 相关文件

- **值对象**: `tenant-plan.vo.ts`, `tenant-status.vo.ts`, `tenant-quota.vo.ts`
- **领域事件**: `events/tenant-created.domain-event.ts` 等
- **测试**: `tenant.aggregate.spec.ts`
