# CreateTenantHandler 示例

## 文件路径

`libs/tenancy/application/commands/create-tenant.handler.ts`

---

## 规范要求

根据 `docs/02-architecture/spec/spec-03-application.md`：

- **文件命名**：`[name].handler.ts`
- **类命名**：`[Action][Target]Handler`
- **依赖倒置**：依赖接口而非实现

---

## 完整代码

```typescript
import type { ICommandHandler } from '@oksai/cqrs';
import type { ITenantRepository } from '../../domain/tenant.repository.js';
import type { OksaiLoggerService } from '@oksai/logger';
import { DomainException } from '@oksai/exceptions';
import { CreateTenantCommand } from './create-tenant.command.js';
import { Tenant } from '../../domain/tenant/tenant.aggregate.js';

/**
 * 创建租户命令处理器
 */
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, string>
{
  constructor(
    private readonly tenantRepository: ITenantRepository, // ✅ 依赖接口
    private readonly logger: OksaiLoggerService,
  ) {}

  async execute(command: CreateTenantCommand): Promise<string> {
    this.logger.info('创建租户', { slug: command.slug, plan: command.plan });

    // 1. 验证 slug 唯一性
    const existing = await this.tenantRepository.findBySlug(command.slug);
    if (existing) {
      throw new DomainException('slug 已存在', 'TENANT_SLUG_EXISTS');
    }

    // 2. 创建租户聚合根
    const result = Tenant.create({
      name: command.name,
      slug: command.slug,
      plan: command.plan,
      ownerId: command.ownerId,
    });

    if (result.isFail()) {
      throw result.error;
    }

    const tenant = result.value;

    // 3. 保存租户
    await this.tenantRepository.save(tenant);

    this.logger.info('租户创建成功', { tenantId: tenant.id.toString() });

    return tenant.id.toString();
  }
}
```

---

## 关键改进

### 之前（错误）

```typescript
export class CreateTenantHandler {
  constructor(private readonly tenantRepository: TenantRepository) {} // ❌ 具体类
}
```

### 之后（正确）

```typescript
export class CreateTenantHandler {
  constructor(private readonly tenantRepository: ITenantRepository) {} // ✅ 接口
}
```

**好处**:

- ✅ 遵循依赖倒置原则
- ✅ 可以轻松替换实现
- ✅ 更容易测试（使用 Mock）

---

## 相关文件

- **Command**: `create-tenant.command.example.md`
- **接口**: `tenant.repository.example.md`
- **实现**: `mikro-orm-tenant.repository.example.md`
