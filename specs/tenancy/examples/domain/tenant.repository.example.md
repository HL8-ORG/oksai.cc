# ITenantRepository 接口示例

## 文件路径

`libs/tenancy/domain/tenant.repository.ts`

---

## 规范要求

根据 `docs/02-architecture/spec/spec-02-domain.md`：

- **文件命名**：`[name].repository.ts`
- **接口命名**：`I[Name]Repository`

---

## 完整代码

```typescript
import type { Tenant } from './tenant.aggregate.js';

/**
 * 租户仓储接口
 *
 * 定义租户持久化的契约接口。
 */
export interface ITenantRepository {
  /**
   * 根据 ID 查找租户
   */
  findById(id: string): Promise<Tenant | null>;

  /**
   * 根据 slug 查找租户
   */
  findBySlug(slug: string): Promise<Tenant | null>;

  /**
   * 根据所有者查找租户列表
   */
  findByOwnerId(ownerId: string): Promise<Tenant[]>;

  /**
   * 保存租户
   */
  save(tenant: Tenant): Promise<void>;

  /**
   * 检查 slug 是否存在
   */
  existsBySlug(slug: string): Promise<boolean>;
}
```

---

## 关键点

1. **接口命名**：使用 `I` 前缀标识接口
2. **返回类型**：使用领域对象（`Tenant`）
3. **无实现细节**：接口只定义契约，不包含实现

4. **依赖倒置**：应用层依赖此接口，而非具体实现

---

## 使用示例

```typescript
import type { ITenantRepository } from './tenant.repository.js';

// 在应用层使用接口
export class CreateTenantHandler {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(command: CreateTenantCommand): Promise<string> {
    // 依赖接口而非具体实现
    const existing = await this.tenantRepository.findBySlug(command.slug);
    if (existing) {
      throw new DomainException('slug 已存在', 'TENANT_SLUG_EXISTS');
    }
    // ...
  }
}
```

---

## 相关文件

- **聚合根**: `tenant.aggregate.example.md`
- **实现**: `infrastructure/persistence/mikro-orm-tenant.repository.example.md`
