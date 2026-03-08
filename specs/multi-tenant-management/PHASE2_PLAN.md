# Phase 2 任务清单与执行计划

**开始日期**：2026-03-08 15:42  
**预计完成**：2026-03-22（2 周）  
**阶段**：Phase 2 - 租户管理功能

---

## 📋 Phase 2 任务概览

### Week 1：核心服务实现

#### 1. TenantService（2 天）

- [ ] 创建 `apps/gateway/src/tenant/tenant.service.ts`
- [ ] 实现 `create()` - 创建租户
- [ ] 实现 `getById()` - 根据 ID 查询
- [ ] 实现 `getBySlug()` - 根据 slug 查询
- [ ] 实现 `list()` - 列出所有租户（分页）
- [ ] 实现 `update()` - 更新租户
- [ ] 实现 `activate()` - 激活租户
- [ ] 实现 `suspend()` - 停用租户

#### 2. TenantController（2 天）

- [ ] 创建 `apps/gateway/src/tenant/tenant.controller.ts`
- [ ] `POST /api/admin/tenants` - 创建租户
- [ ] `GET /api/admin/tenants` - 列出租户
- [ ] `GET /api/admin/tenants/:id` - 获取详情
- [ ] `PUT /api/admin/tenants/:id` - 更新租户
- [ ] `POST /api/admin/tenants/:id/activate` - 激活
- [ ] `POST /api/admin/tenants/:id/suspend` - 停用
- [ ] `GET /api/admin/tenants/:id/usage` - 使用情况

#### 3. 配额管理系统（1 天）

- [ ] 创建 `@CheckQuota` 装饰器
- [ ] 实现 `QuotaGuard` 守卫
- [ ] 实现配额检查逻辑
- [ ] 配额超限事件处理

### Week 2：数据迁移与集成

#### 4. Organization 关联（2 天）

- [ ] Organization 添加 `tenantId` 字段
- [ ] 创建迁移脚本
- [ ] 更新现有数据
- [ ] 更新 OrganizationService

#### 5. 集成测试（2 天）

- [ ] 编写端到端测试
- [ ] 测试租户生命周期
- [ ] 测试配额限制
- [ ] 测试跨租户访问

#### 6. 文档和优化（1 天）

- [ ] 更新 API 文档
- [ ] 编写使用指南
- [ ] 性能优化
- [ ] 代码审查

---

## 📝 详细任务分解

### 1. TenantService 实现

**文件路径**：`apps/gateway/src/tenant/tenant.service.ts`

**核心方法**：

```typescript
class TenantService {
  // 创建租户
  async create(dto: CreateTenantDto): Promise<Tenant>;

  // 根据 ID 查询
  async getById(id: string): Promise<Tenant>;

  // 根据 slug 查询
  async getBySlug(slug: string): Promise<Tenant>;

  // 列出租户（分页）
  async list(query: ListTenantsQuery): Promise<PaginatedResult<Tenant>>;

  // 更新租户
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant>;

  // 激活租户
  async activate(id: string): Promise<void>;

  // 停用租户
  async suspend(id: string, reason: string): Promise<void>;

  // 获取使用情况
  async getUsage(id: string): Promise<TenantUsage>;

  // 检查配额
  async checkQuota(id: string, resource: string): Promise<boolean>;
}
```

**测试用例**：

```typescript
describe('TenantService', () => {
  // 创建测试
  it('应该成功创建租户');
  it('应该验证必填字段');
  it('应该验证 slug 格式');
  it('应该设置默认配额');
  it('应该生成领域事件');
  it('应该拒绝重复的 slug');

  // 查询测试
  it('应该根据 ID 查询租户');
  it('应该根据 slug 查询租户');
  it('应该返回 null 如果租户不存在');

  // 更新测试
  it('应该更新租户信息');
  it('应该允许更新配额');
  it('应该生成 TenantUpdatedEvent');

  // 激活测试
  it('应该激活 PENDING 状态的租户');
  it('应该拒绝激活非 PENDING 状态的租户');
  it('应该生成 TenantActivatedEvent');

  // 停用测试
  it('应该停用 ACTIVE 状态的租户');
  it('应该记录停用原因');
  it('应该生成 TenantSuspendedEvent');
  it('应该拒绝停用非 ACTIVE 状态的租户');

  // 配额测试
  it('应该正确检查配额');
  it('应该在配额超限时返回 false');
  it('应该在无限制配额时返回 true');
});
```

### 2. TenantController 实现

**文件路径**：`apps/gateway/src/tenant/tenant.controller.ts`

**API 端点**：

#### 2.1 创建租户

```
POST /api/admin/tenants
Body: {
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "ownerId": "user-123",
  "maxOrganizations": 10,
  "maxMembers": 100,
  "maxStorage": 107374182400
}
```

#### 2.2 列出租户

```
GET /api/admin/tenants?page=1&limit=20&status=active
Response: {
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### 2.3 获取详情

```
GET /api/admin/tenants/:id
Response: {
  "id": "tenant-123",
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "status": "active",
  "quota": {...},
  "usage": {...}
}
```

#### 2.4 更新租户

```
PUT /api/admin/tenants/:id
Body: {
  "name": "企业A（更新）",
  "maxMembers": 200
}
```

#### 2.5 激活租户

```
POST /api/admin/tenants/:id/activate
Response: {
  "success": true,
  "tenant": {...}
}
```

#### 2.6 停用租户

```
POST /api/admin/tenants/:id/suspend
Body: {
  "reason": "违反服务条款"
}
```

#### 2.7 获取使用情况

```
GET /api/admin/tenants/:id/usage
Response: {
  "organizations": 5,
  "members": 48,
  "storage": 53687091200
}
```

### 3. 配额管理系统

**文件路径**：

- `apps/gateway/src/tenant/decorators/check-quota.decorator.ts`
- `apps/gateway/src/tenant/guards/quota.guard.ts`

**@CheckQuota 装饰器**：

```typescript
@Controller('organizations')
export class OrganizationController {
  @Post()
  @CheckQuota('organizations')
  async create(@Body() dto: CreateOrganizationDto) {
    // 自动检查组织配额
  }
}
```

**QuotaGuard**：

```typescript
@Injectable()
export class QuotaGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 获取当前租户
    // 2. 获取要检查的资源类型
    // 3. 查询当前使用量
    // 4. 比较配额
    // 5. 超限则抛出 QuotaExceededException
  }
}
```

### 4. Organization 关联

**数据库迁移**：

```sql
-- 添加 tenantId 字段
ALTER TABLE organization ADD COLUMN tenant_id VARCHAR(36);

-- 创建索引
CREATE INDEX idx_organization_tenant ON organization(tenant_id);

-- 更新现有数据（如果需要）
UPDATE organization SET tenant_id = 'default-tenant' WHERE tenant_id IS NULL;
```

**OrganizationService 更新**：

```typescript
class OrganizationService {
  async create(dto: CreateOrganizationDto): Promise<Organization> {
    // 1. 检查配额
    // 2. 自动注入当前租户 ID
    // 3. 创建组织
    // 4. 更新使用量
  }
}
```

---

## 🧪 测试计划

### 单元测试

1. **TenantService 测试**（100% 覆盖）
   - 所有公共方法
   - 边界情况
   - 错误处理

2. **TenantController 测试**（100% 覆盖）
   - 所有端点
   - 输入验证
   - 权限检查

3. **QuotaGuard 测试**（100% 覆盖）
   - 配额检查逻辑
   - 超限处理
   - 装饰器集成

### 集成测试

1. **租户生命周期**

   ```
   创建 → 激活 → 使用 → 停用 → 重新激活
   ```

2. **配额限制**

   ```
   创建组织 → 检查配额 → 达到限制 → 拒绝创建
   ```

3. **跨租户隔离**
   ```
   租户 A → 尝试访问租户 B 的资源 → 403 Forbidden
   ```

### E2E 测试

1. **完整流程测试**

   ```typescript
   // 1. 创建租户
   const tenant = await createTenant();

   // 2. 激活租户
   await activateTenant(tenant.id);

   // 3. 创建组织
   const org = await createOrganization(tenant.id);

   // 4. 检查配额
   const quota = await checkQuota(tenant.id);

   // 5. 验证隔离
   await expect(accessOtherTenant()).rejects.toThrow();
   ```

---

## 📅 时间线

### Week 1

**Day 1-2**：

- 创建 `TenantService` 基础结构
- 实现 CRUD 方法
- 编写单元测试

**Day 3-4**：

- 创建 `TenantController`
- 实现 API 端点
- 编写控制器测试

**Day 5**：

- 实现配额管理系统
- 创建装饰器和守卫
- 编写测试

### Week 2

**Day 6-7**：

- Organization 关联 Tenant
- 创建迁移脚本
- 更新服务层

**Day 8-9**：

- 编写集成测试
- 编写 E2E 测试
- 验证所有功能

**Day 10**：

- 文档编写
- 性能优化
- 代码审查

---

## ✅ 验收标准

### 功能完整性

- [ ] 所有 API 端点可用
- [ ] 租户 CRUD 正常工作
- [ ] 配额检查正常工作
- [ ] Organization 关联正常

### 测试覆盖率

- [ ] 单元测试 >90%
- [ ] 集成测试 >85%
- [ ] E2E 测试覆盖主要流程

### 代码质量

- [ ] 遵循项目规范
- [ ] 无 Lint 错误
- [ ] 代码审查通过

### 文档完整性

- [ ] API 文档完整
- [ ] 使用指南清晰
- [ ] 部署指南完整

---

## 🚀 开始执行

**第一步**：创建 `TenantService` 基础结构

```bash
# 创建文件
touch apps/gateway/src/tenant/tenant.service.ts
touch apps/gateway/src/tenant/tenant.service.spec.ts
```

**准备好开始实施 Phase 2！**
