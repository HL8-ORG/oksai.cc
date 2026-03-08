# 多租户系统决策

## 通用决策

以下是适用于所有功能的通用决策，无需重复记录：

### UDR-001：优先使用共享模块

**背景**
项目中已有成熟的共享模块提供通用功能，避免重复实现。

**决策**
当需要使用以下功能时，优先使用 `libs/shared` 目录下的共享模块：

| 功能类型 | 共享模块            | 使用场景                   |
| -------- | ------------------- | -------------------------- |
| 日志     | `@oksai/logger`     | 统一日志记录、结构化日志   |
| 异常     | `@oksai/exceptions` | 统一异常处理、DDD 分层异常 |
| 契约     | `@oksai/constants`  | 错误码、事件名称、API 契约 |
| 配置     | `@oksai/config`     | 环境配置、配置验证         |
| 上下文   | `@oksai/context`    | 租户上下文、请求上下文     |

**理由**

- ✅ 避免重复造轮子
- ✅ 保持一致性和可维护性
- ✅ 统一错误处理和日志格式
- ✅ 便于跨功能共享契约

**示例**

```typescript
// ✅ 推荐：使用共享模块
import { OksaiLoggerService } from '@oksai/logger';
import { DomainException } from '@oksai/exceptions';
import { ExceptionCode } from '@oksai/constants';

// ❌ 避免：自己实现
import { Logger } from '@nestjs/common'; // 不统一
import { CustomError } from './custom-error'; // 重复造轮子
```

### UDR-002：文档管理规范

**背景**
项目文档分散在各处，需要统一的文档组织方式，便于查找和维护。

**决策**
当需要创建开发文档时，优先在当前项目的 `docs` 目录下创建。

**文档组织规范**

| 文档类型     | 存放位置                                 | 说明                     |
| ------------ | ---------------------------------------- | ------------------------ |
| 功能设计文档 | `specs/{feature}/docs/`                  | 带截图的功能文档         |
| 技术指南     | `apps/{app}/docs/` 或 `libs/{lib}/docs/` | 特定应用/库的技术文档    |
| 项目文档     | `docs/`                                  | 跨项目共享文档、最佳实践 |
| API 文档     | Swagger/Scalar                           | 自动生成，无需手动维护   |

**理由**

- ✅ 文档就近原则，易于查找
- ✅ 保持项目结构清晰
- ✅ 便于文档版本管理
- ✅ 避免文档分散混乱

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：多租户独立包设计

### 背景

租户相关代码当前分散在：

1. `libs/iam/domain/tenant` — 租户领域模型
2. `libs/shared/context` — 租户上下文管理
3. `libs/shared/database/entities` — 租户数据库实体

这种分散的架构导致：

- 代码职责不清，难以维护
- 复用性差，无法在其他项目中独立使用
- 测试困难，缺乏统一的测试策略

### 备选方案

1. **方案 A：保持现状** — 代码继续分散在多个模块中
   - 优点：无需迁移，风险低
   - 缺点：长期维护困难，复用性差

2. **方案 B：合并到 IAM 模块** — 将所有租户代码合并到 `@oksai/iam`
   - 优点：统一管理，减少包数量
   - 缺点：违反单一职责原则，IAM 过于庞大

3. **方案 C：独立多租户包** — 创建 `@oksai/tenancy` 独立包
   - 优点：职责清晰、可复用、易测试、易维护
   - 缺点：需要代码迁移，短期工作量增加

### 决策

**选择方案 C：创建 `@oksai/tenancy` 独立包**

理由：

- ✅ 符合单一职责原则（SRP）
- ✅ 可以独立开发、测试、发布
- ✅ 其他项目可以直接引入
- ✅ 清晰的模块边界和依赖关系
- ✅ 长期维护成本低

### 影响

- **短期影响**：需要迁移代码，增加工作量（约 1-2 周）
- **长期影响**：
  - 提高代码可维护性和可复用性
  - 降低跨模块依赖复杂度
  - 便于多租户能力的独立演进

### 实施计划

1. Phase 1：创建包结构，迁移代码（1-2 天）
2. Phase 2-5：增强功能，完善测试（7-10 天）
3. Phase 6：清理旧代码，发布新包（1 天）

---

## ADR-002：租户上下文管理策略

### 背景

需要在请求处理过程中自动管理租户上下文，包括：

- 从请求中提取租户标识（Header、子域名、Cookie）
- 设置租户上下文到 AsyncLocalStorage
- 提供租户上下文访问接口
- 确保跨异步操作的上下文传递

### 备选方案

1. **方案 A：使用 CLS（Continuation Local Storage）**
   - 优点：成熟方案，社区支持好
   - 缺点：需要额外依赖 `cls-hooked`

2. **方案 B：使用 Node.js AsyncLocalStorage**
   - 优点：Node.js 原生支持，性能好，无需额外依赖
   - 缺点：需要 Node.js 12.17.0+ 版本

3. **方案 C：使用 NestJS Request Scope**
   - 优点：NestJS 原生支持
   - 缺点：性能开销大，每个请求创建新实例

### 决策

**选择方案 B：使用 Node.js AsyncLocalStorage**

理由：

- ✅ Node.js 原生 API，无需额外依赖
- ✅ 性能优于 CLS 和 Request Scope
- ✅ 项目已经在使用（`libs/shared/context`）
- ✅ 支持异步操作和 Promise 链

### 影响

- 需要确保 Node.js 版本 >= 20（项目已满足）
- 需要在 NestJS 中正确集成（通过 Provider 和 Interceptor）

### 实施方案

```typescript
// tenant-context.service.ts
@Injectable()
export class TenantContextService {
  private readonly asyncLocalStorage: AsyncLocalStorage<TenantContext>;

  get currentContext(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  runWithContext<T>(context: TenantContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }
}

// tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = this.extractTenantId(request);

    return new Observable((subscriber) => {
      this.tenantContextService.runWithContext({ tenantId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
```

---

## ADR-003：租户隔离策略

### 背景

需要确保租户数据隔离，防止跨租户数据泄露：

- 行级隔离：数据库查询自动添加租户过滤条件
- 逻辑隔离：业务逻辑层面强制租户检查
- 物理隔离：不同租户使用不同数据库（可选，高级功能）

### 备选方案

1. **方案 A：手动过滤** — 每个查询手动添加 `tenantId` 过滤
   - 优点：灵活，开发者完全控制
   - 缺点：容易遗漏，存在安全隐患

2. **方案 B：ORM 钩子** — 使用 MikroORM 钩子自动添加过滤条件
   - 优点：自动化，开发者无感知
   - 缺点：需要正确配置，调试困难

3. **方案 C：装饰器 + 拦截器** — 通过装饰器声明隔离策略，拦截器自动处理
   - 优点：灵活，可配置，易于理解
   - 缺点：需要开发自定义拦截器

### 决策

**选择方案 C：装饰器 + 拦截器 + ORM 钩子（混合方案）**

理由：

- ✅ 灵活：通过装饰器控制隔离级别
- ✅ 安全：默认强制隔离，防止遗漏
- ✅ 可调试：装饰器明确声明，易于理解
- ✅ 兼顾性能：ORM 钩子自动过滤，减少查询次数

### 影响

- 需要实现 `@TenantIsolated()` 装饰器
- 需要实现 `TenantInterceptor` 拦截器
- 需要配置 MikroORM 钩子（`filters`）

### 实施方案

```typescript
// 装饰器
@TenantIsolated({ level: 'strict' })
@Controller('/organizations')
export class OrganizationController {
  // 自动添加租户过滤条件
}

// MikroORM 配置
{
  filters: {
    tenant: {
      cond: { tenantId: { $in: [currentTenantId] } },
      default: true,
    },
  },
}
```

---

## ADR-004：租户配额管理策略

### 背景

需要限制租户资源使用，防止滥用：

- 组织数量限制
- 成员数量限制
- 存储空间限制
- API 调用频率限制（可选）

### 备选方案

1. **方案 A：实时检查** — 每次操作都查询当前使用量
   - 优点：准确
   - 缺点：性能开销大，数据库压力大

2. **方案 B：缓存 + 定期同步** — 使用缓存记录使用量，定期同步数据库
   - 优点：性能好
   - 缺点：可能存在延迟，不够准确

3. **方案 C：混合方案** — 关键操作实时检查，非关键操作使用缓存
   - 优点：平衡性能和准确性
   - 缺点：实现复杂度较高

### 决策

**选择方案 C：混合方案（关键操作实时检查，非关键操作使用缓存）**

理由：

- ✅ 平衡性能和准确性
- ✅ 关键操作（创建组织、邀请成员）实时检查，保证准确
- ✅ 非关键操作（列表查询、统计）使用缓存，提升性能

### 影响

- 需要实现配额检查服务（支持实时和缓存两种模式）
- 需要实现配额使用量更新机制（事件驱动）
- 需要缓存失效策略

### 实施方案

```typescript
// quota-check.service.ts
@Injectable()
export class QuotaCheckService {
  async checkQuota(
    tenantId: string,
    resource: 'organizations' | 'members' | 'storage',
    mode: 'realtime' | 'cached' = 'realtime',
  ): Promise<QuotaCheckResult> {
    if (mode === 'realtime') {
      // 实时查询数据库
      return this.checkRealtime(tenantId, resource);
    } else {
      // 使用缓存
      return this.checkCached(tenantId, resource);
    }
  }
}

// 事件监听器，更新缓存
@EventHandler(OrganizationCreatedEvent)
export class UpdateQuotaCacheHandler {
  async handle(event: OrganizationCreatedEvent) {
    await this.cacheService.increment(`quota:${event.tenantId}:organizations`);
  }
}
```

---

## ADR-005：向后兼容和迁移策略

### 背景

需要将现有租户代码从 `libs/iam` 和 `libs/shared/context` 迁移到 `libs/tenancy`，同时保证不影响现有功能。

### 备选方案

1. **方案 A：一次性迁移** — 一次性完成所有迁移，立即删除旧代码
   - 优点：干净彻底
   - 缺点：风险高，影响范围大

2. **方案 B：渐进式迁移** — 分阶段迁移，保持向后兼容，最后清理
   - 优点：风险低，可回滚
   - 缺点：过渡期维护两套代码

### 决策

**选择方案 B：渐进式迁移（分 6 个阶段）**

理由：

- ✅ 风险可控，每阶段都可验证和回滚
- ✅ 保持向后兼容，不影响现有功能
- ✅ 可以分阶段测试和发布

### 影响

- 过渡期间（Phase 1-5）需要维护重导出
- Phase 6 才能移除旧代码和重导出
- 需要更新所有依赖包的 import 路径

### 实施计划

详见 `design.md` 中的实现计划。

### 向后兼容策略

```typescript
// libs/iam/domain/src/index.ts (Phase 1-5)
export * from '@oksai/tenancy'; // 重导出，保持向后兼容

// Phase 6 后移除此文件
```
