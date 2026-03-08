# TenantQuota 值对象示例

## 文件路径

`libs/tenancy/domain/tenant/tenant-quota.vo.ts`

---

## 完整代码

```typescript
import { ValueObject } from '@oksai/kernel';

export interface TenantQuotaProps {
  maxOrganizations: number;
  maxMembers: number;
  maxStorageGB: number;
}

/**
 * 租户配额值对象
 *
 * 表示租户的资源使用限制。
 *
 * @business-rule -1 表示无限制
 * @business-rule 配额不能为负数（-1除外）
 */
export class TenantQuota extends ValueObject<TenantQuotaProps> {
  private constructor(props: TenantQuotaProps) {
    super(props);
  }

  public get maxOrganizations(): number {
    return this.props.maxOrganizations;
  }

  public get maxMembers(): number {
    return this.props.maxMembers;
  }

  public get maxStorageGB(): number {
    return this.props.maxStorageGB;
  }

  public static create(props: TenantQuotaProps): TenantQuota {
    return new TenantQuota(props);
  }

  public toJSON(): Record<string, unknown> {
    return {
      maxOrganizations: this.maxOrganizations,
      maxMembers: this.maxMembers,
      maxStorageGB: this.maxStorageGB,
    };
  }
}
```

---

## 使用示例

```typescript
const quota = TenantQuota.create({
  maxOrganizations: 20,
  maxMembers: 100,
  maxStorageGB: 500,
});

console.log(quota.maxOrganizations); // 20
```
