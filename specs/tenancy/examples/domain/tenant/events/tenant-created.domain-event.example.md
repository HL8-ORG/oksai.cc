# TenantCreatedEvent 领域事件示例

## 文件路径

`libs/tenancy/domain/tenant/events/tenant-created.domain-event.ts`

---

## 规范要求

根据 `docs/02-architecture/spec/spec-02-domain.md`：

- **文件命名**：`[name].domain-event.ts`
- **类命名**：`[实体][过去式]Event`

---

## 完整代码

```typescript
import { DomainEvent, UniqueEntityID } from '@oksai/domain-core';
import type { PlanType } from '../tenant-plan.vo.js';

export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  slug: string;
  plan: PlanType;
}

/**
 * 租户创建事件
 *
 * 当租户聚合根被创建时触发。
 *
 * @business-rule 租户创建后必须发布此事件
 */
export class TenantCreatedEvent extends DomainEvent<TenantCreatedPayload> {
  constructor(aggregateId: UniqueEntityID, payload: TenantCreatedPayload) {
    super({
      eventName: 'TenantCreated',
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}
```

---

## 关键点

1. **继承 DomainEvent**：使用 `@oksai/domain-core` 的 `DomainEvent` 基类
2. **事件命名**：`[实体][过去式]Event` (如 `TenantCreatedEvent`)
3. **Payload 接口**：明确定义事件携带的数据
4. **事件版本**：`eventVersion: 1` 用于事件演进

---

## 相关事件

- `TenantActivatedEvent`
- `TenantSuspendedEvent`
- `TenantPlanChangedEvent`
- `TenantQuotaUpdatedEvent`
