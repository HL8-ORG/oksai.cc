# TenantStatus 值对象示例

## 文件路径

`libs/tenancy/domain/tenant/tenant-status.vo.ts`

---

## 规范要求

- **文件命名**：`[name].vo.ts`
- **类命名**：PascalCase，无后缀

---

## 完整代码

```typescript
import { ValueObject } from '@oksai/domain-core';

export type StatusType = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface TenantStatusProps {
  value: StatusType;
}

/**
 * 租户状态值对象
 *
 * 表示租户的生命周期状态。
 *
 * @business-rule 状态转换必须遵循状态机规则
 * @business-rule PENDING → ACTIVE → SUSPENDED → DELETED
 */
export class TenantStatus extends ValueObject<TenantStatusProps> {
  private constructor(props: TenantStatusProps) {
    super(props);
  }

  public get value(): StatusType {
    return this.props.value;
  }

  public static pending(): TenantStatus {
    return new TenantStatus({ value: 'PENDING' });
  }

  public static active(): TenantStatus {
    return new TenantStatus({ value: 'ACTIVE' });
  }

  public static suspended(): TenantStatus {
    return new TenantStatus({ value: 'SUSPENDED' });
  }

  public static deleted(): TenantStatus {
    return new TenantStatus({ value: 'DELETED' });
  }

  /**
   * 是否可以激活
   */
  public canBeActivated(): boolean {
    return this.props.value === 'PENDING';
  }

  /**
   * 是否可以停用
   */
  public canBeSuspended(): boolean {
    return this.props.value === 'ACTIVE';
  }

  /**
   * 是否可以删除
   */
  public canBeDeleted(): boolean {
    return this.props.value === 'SUSPENDED';
  }
}
```

---

## 状态转换规则

```
PENDING → ACTIVE → SUSPENDED → DELETED
   ↓         ↓          ↓
 (删除)   (删除)    (删除)
```

---

## 使用示例

```typescript
const status = TenantStatus.pending();
if (status.canBeActivated()) {
  // 可以激活
}
```
