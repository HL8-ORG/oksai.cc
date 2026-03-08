# Phase 2 任务清单

**开始日期**：2026-03-08 15:42  
**预计完成**：2026-03-22（2 周）  
**阶段**：Phase 2 - 租户管理功能

---

## 🎯 Phase 2 目标

实现完整的租户管理功能，包括：

1. 租户 CRUD 操作
2. 租户激活/停用
3. 配额管理系统
4. Organization 关联 Tenant

---

## 📋 任务清单

### Week 1：核心服务实现

#### Day 1-2：TenantService 实现

**任务**：

- [ ] 创建 `TenantService` 基础结构
- [ ] 实现 `create()` 方法
- [ ] 实现 `getById()` 方法
- [ ] 实现 `getBySlug()` 方法
- [ ] 实现 `update()` 方法
- [ ] 实现 `activate()` 方法
- [ ] 实现 `suspend()` 方法

**文件**：

- `apps/gateway/src/tenant/tenant.service.ts`
- `apps/gateway/src/tenant/tenant.service.spec.ts`

**测试用例**：

```typescript
describe('TenantService', () => {
  describe('create', () => {
    it('应该成功创建租户');
    it('应该验证必填字段');
    it('应该验证 slug 格式');
    it('应该设置默认配额');
    it('应该生成领域事件');
  });

  describe('activate', () => {
    it('应该激活 PENDING 状态的租户');
    it('应该拒绝激活非 PENDING 状态的租户');
    it('应该生成 TenantActivatedEvent');
  });

  describe('suspend', () => {
    it('应该停用 ACTIVE 状态的租户');
    it('应该记录停用原因');
    it('应该生成 TenantSuspendedEvent');
  });
});
```

#### Day 3-4：TenantController 实现

**任务**：

- [ ] 创建 `TenantController` 基础结构
- [ ] 实现 `POST /api/admin/tenants` （创建租户）
- [ ] 实现 `GET /api/admin/tenants` （列出租户）
- [ ] 实现 `GET /api/admin/tenants/:id` （获取租户详情）
- [ ] 实现 `PUT /api/admin/tenants/:id` （更新租户）
- [ ] 实现 `POST /api/admin/tenants/:id/activate` （激活租户）
- [ ] 实现 `POST /api/admin/tenants/:id/suspend` （停用租户）
- [ ] 实现 `GET /api/admin/tenants/:id/usage` （获取租户使用情况）

**文件**：

- `apps/gateway/src/tenant/tenant.controller.ts`
- `apps/gateway/src/tenant/tenant.controller.spec.ts`
- `apps/gateway/src/tenant/dto/create-tenant.dto.ts`
- `apps/gateway/src/tenant/dto/update-tenant.dto.ts`
- `apps/gateway/src/tenant/dto/tenant-response.dto.ts`

**API 设计**：

```typescript
// POST /api/admin/tenants
{
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "ownerId": "user-123",
  "maxOrganizations": 10,
  "maxMembers": 100,
  "maxStorage": 107374182400
}

// Response
{
  "id": "tenant-uuid",
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "status": "PENDING",
  "ownerId": "user-123",
  "quota": {
    "maxOrganizations": 10,
    "maxMembers": 100,
    "maxStorage": 107374182400
  },
  "createdAt": "2026-03-08T07:00:00Z",
  "updatedAt": "2026-03-08T07:00:00Z"
}
```

#### Day 5：配额管理系统

**任务**：

- [ ] 创建 `@CheckQuota()` 装饰器
- [ ] 实现 `QuotaGuard`
- [ ] 实现 `TenantQuotaService`
- [ ] 编写测试用例

**文件**：

- `apps/gateway/src/tenant/decorators/check-quota.decorator.ts`
- `apps/gateway/src/tenant/guards/quota.guard.ts`
- `apps/gateway/src/tenant/services/tenant-quota.service.ts`
- `apps/gateway/src/tenant/services/tenant-quota.service.spec.ts`

**使用示例**：

```typescript
@Controller('organizations')
export class OrganizationController {
  @Post()
  @CheckQuota('organizations')
  async create(@Body() dto: CreateOrganizationDto) {
    // 自动检查配额
    // 如果超过配额，返回 403 Forbidden
  }
}
```

### Week 2：数据迁移和测试

#### Day 6-7：Organization 关联 Tenant

**任务**：

- [ ] 为 Organization 添加 `tenantId` 字段
- [ ] 创建迁移脚本
- [ ] 更新 OrganizationService
- [ ] 更新 OrganizationController
- [ ] 编写测试用例

**文件**：

- `libs/shared/database/src/entities/organization.entity.ts`（修改）
- `libs/shared/database/src/migrations/Migration20260308155000.ts`（新建）
- `apps/gateway/src/auth/organization.service.ts`（修改）

**迁移内容**：

```sql
ALTER TABLE organization ADD COLUMN tenant_id VARCHAR(36);
CREATE INDEX idx_organization_tenant ON organization(tenant_id);
```

#### Day 8-9：集成测试

**任务**：

- [ ] 编写租户生命周期测试
- [ ] 编写配额限制测试
- [ ] 编写 Organization 关联测试
- [ ] 编写 E2E 测试

**文件**：

- `apps/gateway/src/tenant/tenant.lifecycle.spec.ts`
- `apps/gateway/src/tenant/quota-limits.spec.ts`
- `apps/gateway/src/tenant/organization-tenant.spec.ts`
- `apps/gateway/test/tenant.e2e-spec.ts`

#### Day 10：文档和优化

**任务**：

- [ ] 更新 API 文档
- [ ] 更新使用指南
- [ ] 性能优化
- [ ] 代码审查

**文件**：

- `docs/api/tenant-api.md`
- `docs/guides/tenant-management.md`
- `specs/multi-tenant-management/implementation.md`（更新）

---

## 🎯 验收标准

### 功能验收

- [ ] 可以创建租户并设置配额
- [ ] 可以激活/停用租户
- [ ] 配额检查正常工作
- [ ] Organization 正确关联 Tenant
- [ ] 所有 API 接口正常工作

### 测试验收

- [ ] 单元测试覆盖率 > 90%
- [ ] 集成测试覆盖主要场景
- [ ] E2E 测试通过
- [ ] 性能测试通过

### 文档验收

- [ ] API 文档完整
- [ ] 使用指南清晰
- [ ] 架构决策记录完整

---

## 🚀 开始实现

### 第一步：创建 TenantService

```bash
# 创建文件
touch apps/gateway/src/tenant/tenant.service.ts
touch apps/gateway/src/tenant/tenant.service.spec.ts

# 运行测试
pnpm vitest watch apps/gateway/src/tenant/tenant.service.spec.ts
```

### 第二步：实现基础方法

```typescript
@Injectable()
export class TenantService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: Logger,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    // 1. 验证参数
    // 2. 创建租户
    // 3. 保存到数据库
    // 4. 返回结果
  }

  async getById(id: string): Promise<Tenant> {
    // 根据 ID 查询租户
  }

  async activate(id: string): Promise<Tenant> {
    // 激活租户
  }
}
```

---

## 📚 参考资料

- **Phase 1 完成报告**：`specs/multi-tenant-management/PHASE1_COMPLETION_REPORT.md`
- **技术设计**：`specs/multi-tenant-management/design.md`
- **Better Auth Organization**：https://better-auth.com/docs/plugins/organization
- **NestJS Guards**：https://docs.nestjs.com/guards

---

**开始日期**：2026-03-08 15:42  
**预计完成**：2026-03-22  
**状态**：📋 规划中
