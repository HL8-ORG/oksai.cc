# 多租户管理开发推进计划

**时间**：2026-03-08 17:45  
**状态**：🟡 进行中

---

## 📊 当前进度

### ✅ 已完成

1. **文档完善**（100%）
   - ✅ `future-work.md` - 后续工作计划
   - ✅ `prompts.md` - 常用提示词
   - ✅ `testing.md` - 测试计划
   - ✅ `workflow.md` - 开发工作流程
   - ✅ `SPEC-STATUS.md` - 功能状态
   - ✅ `SPEC-VALIDATION.md` - 文档验证报告
   - ✅ `DEVELOPMENT-CHECK-REPORT.md` - 开发情况检查报告

2. **装饰器创建**（100%）
   - ✅ `tenant-resource.decorator.ts` - 租户资源装饰器
   - ✅ `decorators/index.ts` - 装饰器导出

### 🟡 进行中

3. **资源查询逻辑实现**（50%）
   - ✅ 创建了装饰器
   - ⏳ 正在实现 TenantResourceGuard
   - ⏳ 需要添加 EntityManager 查询
   - ⏳ 需要添加缓存机制

### ⏳ 待开始

4. **TypeScript 类型错误修复**（0%）
   - 需要修复 `tenant.aggregate.ts` 中的类型错误
   - 需要修复测试文件中的类型错误

5. **租户缓存实现**（0%）
   - 需要集成 Redis 缓存
   - 需要添加缓存失效策略

---

## 🎯 下一步行动计划

### 优先级 P0（立即执行）

#### 1. 完成 TenantResourceGuard 实现（预估 1 小时）

**当前状态**：已创建装饰器，需要实现查询逻辑

**待完成**：

```typescript
// apps/gateway/src/tenant/tenant.guard.ts
@Injectable()
export class TenantResourceGuard extends TenantGuard {
  constructor(
    reflector: Reflector,
    tenantContext: TenantContextService,
    private readonly em: EntityManager, // ← 添加
    private readonly cache?: CacheService, // ← 可选缓存
  ) {
    super(reflector, tenantContext);
  }

  protected override async extractResourceTenantId(
    context: ExecutionContext,
  ): Promise<string | null> {
    // 1. 获取资源配置
    const config = this.reflector.getAllAndOverride<TenantResourceOptions>(
      TENANT_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!config) {
      return super.extractResourceTenantId(context);
    }

    // 2. 提取资源 ID
    const resourceId = this.extractResourceId(context, config);
    if (!resourceId) {
      return null;
    }

    // 3. 查询资源（带缓存）
    const cacheKey = `tenant:resource:${config.type.name}:${resourceId}`;
    let resource = await this.cache?.get(cacheKey);

    if (!resource) {
      resource = await this.em.findOne(config.type, { id: resourceId });
      if (resource) {
        await this.cache?.set(cacheKey, resource, 300); // 5分钟
      }
    }

    // 4. 返回资源的 tenantId
    return resource?.tenantId ?? null;
  }
}
```

#### 2. 修复 TypeScript 类型错误（预估 30 分钟）

**需要修复的文件**：

- `libs/shared/database/src/domain/tenant/tenant.aggregate.ts`
- `libs/shared/database/src/domain/tenant/tenant-quota.vo.ts`
- `libs/shared/database/src/domain/tenant/tenant.aggregate.spec.ts`

**主要错误类型**：

1. `result.error` 可能为 undefined
2. `Error | TenantPlan` 类型不匹配
3. 测试中的属性访问错误

**修复方案**：

```typescript
// 方案 1: 使用类型守卫
if (result.isFail()) {
  const error = result.error; // Error | undefined
  if (!error) {
    return Result.fail(new Error('未知错误'));
  }
  return Result.fail(error);
}

// 方案 2: 使用可选链
const plan = planResult.value; // 确保不是 Error
if (planResult.isFail() || planResult.value instanceof Error) {
  return Result.fail(planResult.error ?? new Error('无效的套餐'));
}

// 方案 3: 在测试中使用类型断言
if (result.isOk()) {
  const tenant = result.value; // 此时 TypeScript 知道是 Tenant
  expect(tenant.slug).toBe('test-tenant');
}
```

#### 3. 实现租户缓存（预估 1 小时）

**需要修改的文件**：

- `apps/gateway/src/tenant/tenant.middleware.ts`

**实现方案**：

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantService: TenantService,
    private readonly cache?: RedisCacheService, // ← 添加缓存服务
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('缺少租户标识');
    }

    // 尝试从缓存获取
    const cacheKey = `tenant:info:${tenantId}`;
    let tenant = await this.cache?.get<Tenant>(cacheKey);

    if (!tenant) {
      tenant = await this.tenantService.getById(tenantId);
      if (tenant) {
        // 缓存 5 分钟
        await this.cache?.set(cacheKey, tenant, 300);
      }
    }

    if (!tenant || !tenant.status.canBeAccessed()) {
      throw new ForbiddenException('无效的租户或租户已被停用');
    }

    // 注入到上下文
    this.tenantContext.run(context, () => next());
  }
}
```

---

## 📝 实施步骤

### Step 1: 完成 TenantResourceGuard（30 分钟）

1. 修改 `tenant.guard.ts` 添加 EntityManager
2. 实现 `extractResourceTenantId` 方法
3. 添加错误处理
4. 编写单元测试

### Step 2: 修复 TypeScript 错误（30 分钟）

1. 修复 `tenant.aggregate.ts` 中的 Result 错误处理
2. 修复 `tenant-quota.vo.ts` 中的 override 修饰符
3. 修复测试文件中的类型断言
4. 运行类型检查确认修复

### Step 3: 实现租户缓存（1 小时）

1. 集成 Redis 缓存服务
2. 修改 `tenant.middleware.ts` 添加缓存逻辑
3. 添加缓存失效策略
4. 性能测试

### Step 4: 集成测试（30 分钟）

1. 测试资源守卫功能
2. 测试租户缓存效果
3. 测试类型安全性
4. 更新文档

---

## 🚧 阻塞项

1. **EntityManager 依赖**
   - 需要确保 TenantModule 正确导入 MikroORMModule
   - 需要处理事务边界

2. **缓存服务依赖**
   - 需要确认 RedisCacheService 是否可用
   - 需要处理缓存失效场景

3. **测试环境**
   - 需要测试数据库连接
   - 需要 Redis 服务（可选）

---

## 📈 预期成果

完成后将达到：

| 指标           | 当前 | 目标 |   提升   |
| :------------- | :--: | :--: | :------: |
| **功能完整度** | 90%  | 95%  |   +5%    |
| **测试覆盖率** | 95%  | 98%  |   +3%    |
| **类型安全性** | 90%  | 100% |   +10%   |
| **性能**       | 基准 | +50% | 缓存加速 |
| **代码质量**   |  A   |  A+  |   提升   |

---

## 💡 建议

1. **优先完成 TypeScript 错误修复**
   - 影响范围小，风险低
   - 可以立即提升代码质量
   - 30 分钟内可完成

2. **分步实施资源守卫**
   - 先实现基本查询功能
   - 再添加缓存优化
   - 最后完善错误处理

3. **使用渐进式缓存策略**
   - 第一阶段：不使用缓存（简化实现）
   - 第二阶段：添加内存缓存（快速验证）
   - 第三阶段：集成 Redis（生产就绪）

---

## ✅ 验证清单

完成以下验证后，可以认为开发推进成功：

- [ ] 所有 TypeScript 错误已修复
- [ ] TenantResourceGuard 可以正确查询资源
- [ ] 资源的 tenantId 检查正确
- [ ] 所有现有测试仍然通过
- [ ] 新增单元测试覆盖新功能
- [ ] 文档已更新
- [ ] 代码 Review 通过

---

**下次更新**：完成 P0 任务后  
**预计完成时间**：今天 19:00
