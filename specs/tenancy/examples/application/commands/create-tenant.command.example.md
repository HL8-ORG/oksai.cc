# CreateTenantCommand 示例

## 文件路径

`libs/tenancy/application/commands/create-tenant.command.ts`

---

## 规范要求

根据 `docs/02-architecture/spec/spec-03-application.md`：

- **文件命名**：`[name].command.ts`
- **类命名**：`[Action][Target]Command`

---

## 完整代码

```typescript
import type { ICommand } from '@oksai/cqrs';
import type { PlanType } from '../../domain/tenant/tenant-plan.vo.js';

export interface CreateTenantCommandProps {
  name: string;
  slug: string;
  plan: PlanType;
  ownerId: string;
}

/**
 * 创建租户命令
 */
export class CreateTenantCommand implements ICommand {
  public readonly name: string;
  public readonly slug: string;
  public readonly plan: PlanType;
  public readonly ownerId: string;

  constructor(props: CreateTenantCommandProps) {
    this.name = props.name;
    this.slug = props.slug;
    this.plan = props.plan;
    this.ownerId = props.ownerId;
  }
}
```

---

## 关键点

1. **实现 ICommand**：使用 `@oksai/cqrs` 的接口
2. **不可变属性**：所有属性都是 `readonly`
3. **简单数据载体**：Command 只包含数据，不包含逻辑
