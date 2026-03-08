# TenantPlan 值对象示例

## 文件路径

`libs/tenancy/domain/tenant/tenant-plan.vo.ts`

---

## 规范要求

根据 `docs/02-architecture/spec/spec-02-domain.md`：

- **文件命名**：`[name].vo.ts`
- **类命名**：PascalCase，无后缀（如 `TenantPlan`）

---

## 完整代码

```typescript
import { ValueObject } from '@oksai/kernel';

export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface TenantPlanProps {
  value: PlanType;
}

/**
 * 租户套餐值对象
 *
 * 表示租户的订阅套餐类型，决定了租户的默认配额限制。
 *
 * @business-rule 套餐类型必须是预定义的四种之一
 * @business-rule 每个套餐有对应的默认配额
 */
export class TenantPlan extends ValueObject<TenantPlanProps> {
  private static readonly PLANS = {
    FREE: { maxOrganizations: 1, maxMembers: 5, maxStorageGB: 5 },
    STARTER: { maxOrganizations: 5, maxMembers: 20, maxStorageGB: 50 },
    PRO: { maxOrganizations: 20, maxMembers: 100, maxStorageGB: 500 },
    ENTERPRISE: { maxOrganizations: -1, maxMembers: -1, maxStorageGB: -1 },
  } as const;

  private constructor(props: TenantPlanProps) {
    super(props);
  }

  /**
   * 获取套餐类型值
   */
  public get value(): PlanType {
    return this.props.value;
  }

  /**
   * 创建套餐值对象
   *
   * @param value - 套餐类型
   * @returns 套餐值对象
   */
  public static create(value: PlanType): TenantPlan {
    return new TenantPlan({ value });
  }

  /**
   * 获取该套餐的默认配额
   *
   * @returns 租户配额
   */
  public defaultQuota(): TenantQuota {
    const limits = TenantPlan.PLANS[this.props.value];
    return TenantQuota.create(limits);
  }

  /**
   * 判断是否是从另一个套餐降级
   *
   * @param other - 另一个套餐
   * @returns 如果是降级返回 true
   */
  public isDowngradeFrom(other: TenantPlan): boolean {
    const order = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    return order.indexOf(this.props.value) < order.indexOf(other.value);
  }
}
```

---

## 关键点

1. **继承 ValueObject**：使用 `@oksai/kernel` 的 `ValueObject` 基类
2. **私有构造函数**：防止直接实例化，必须通过 `create()` 工厂方法
3. **静态常量**：`PLANS` 定义了每个套餐的默认配额
4. **业务方法**：`defaultQuota()` 和 `isDowngradeFrom()` 提供业务逻辑

---

## 使用示例

```typescript
import { TenantPlan } from './tenant-plan.vo.js';

// 创建套餐
const plan = TenantPlan.create('PRO');

// 获取默认配额
const quota = plan.defaultQuota();
console.log(quota.maxOrganizations); // 20

// 检查降级
const starterPlan = TenantPlan.create('STARTER');
console.log(starterPlan.isDowngradeFrom(plan)); // true
```

---

## 相关文件

- **租户配额**：`tenant-quota.vo.example.md`
- **租户聚合根**：`tenant.aggregate.example.md`
