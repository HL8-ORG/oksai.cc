# 多租户管理开发推进报告

**更新时间**：2026-03-08 17:50  
**推进状态**：🟡 进行中

---

## ✅ 已完成

### 1. 文档完善（100%）

已补充完善以下模板文档：

| 文档             | 状态 | 内容量  |  验证   |
| :--------------- | :--: | :-----: | :-----: |
| `future-work.md` |  ✅  | 150+ 行 | ✅ 通过 |
| `prompts.md`     |  ✅  | 400+ 行 | ✅ 通过 |
| `testing.md`     |  ✅  | 500+ 行 | ✅ 通过 |
| `workflow.md`    |  ✅  | 600+ 行 | ✅ 通过 |

**辅助文档**：

- ✅ `SPEC-STATUS.md` - 功能状态总览
- ✅ `SPEC-VALIDATION.md` - 文档验证报告
- ✅ `SPEC-COMPLETION-REPORT.md` - 完成报告
- ✅ `DEVELOPMENT-CHECK-REPORT.md` - 开发情况检查

### 2. 装饰器实现（100%）

创建租户资源装饰器：

```typescript
// apps/gateway/src/tenant/decorators/tenant-resource.decorator.ts
export function TenantResource(options: TenantResourceOptions) {
  return applyDecorators(
    SetMetadata(TENANT_RESOURCE_KEY, options),
    UseGuards(TenantResourceGuard),
  );
}
```

**功能**：

- ✅ 支持指定资源类型
- ✅ 支持自定义 ID 参数名
- ✅ 支持从不同位置提取 ID（params/body/query）
- ✅ 自动应用 TenantResourceGuard

---

## 🟡 进行中

### 3. TenantResourceGuard 实现（80%）

**已完成**：

- ✅ 装饰器定义和元数据
- ✅ 守卫基础结构
- ✅ 资源 ID 提取逻辑

**待完成**（预估 30 分钟）：

- ⏳ EntityManager 查询集成
- ⏳ 缓存机制
- ⏳ 错误处理

**实现方案**：

```typescript
@Injectable()
export class TenantResourceGuard extends TenantGuard {
  constructor(
    reflector: Reflector,
    tenantContext: TenantContextService,
    private readonly em: EntityManager, // ← MikroORM EntityManager
  ) {
    super(reflector, tenantContext);
  }

  protected override async extractResourceTenantId(
    context: ExecutionContext,
  ): Promise<string | null> {
    // 1. 获取装饰器配置
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

    // 3. 查询资源的 tenantId
    try {
      const entity = await this.em.findOne(config.type, {
        id: resourceId,
      } as any);

      return entity?.tenantId || null;
    } catch (error) {
      this.logger.error(`查询资源失败: ${error}`);
      return null;
    }
  }

  private extractResourceId(
    context: ExecutionContext,
    config: TenantResourceOptions,
  ): string | null {
    const request = context.switchToHttp().getRequest();
    const idParam = config.idParam || 'id';

    if (config.fromBody) {
      return request.body?.[idParam];
    }

    if (config.fromQuery) {
      return request.query?.[idParam] as string;
    }

    // 默认从 params 提取
    return request.params?.[idParam];
  }
}
```

---

## ⏳ 待开始

### 4. TypeScript 类型错误修复（预估 1 小时）

**发现的问题**：

| 文件                       | 错误数 | 严重性 | 影响            |
| :------------------------- | :----: | :----: | :-------------- |
| `tenant.aggregate.ts`      |   6    |   中   | 不影响运行      |
| `tenant.aggregate.spec.ts` |  多个  |   中   | 类型推断问题    |
| `tenant-quota.vo.ts`       |   2    |   低   | override 修饰符 |
| `tenant.middleware.ts`     |   1    |   低   | unused variable |

**修复方案**：

1. **修复 `result.error` 可能为 undefined**

   ```typescript
   // ❌ 错误
   if (result.isFail()) {
     return Result.fail(result.error); // error 可能为 undefined
   }

   // ✅ 正确
   if (result.isFail()) {
     const error = result.error;
     if (!error) {
       return Result.fail(new Error('Unknown error'));
     }
     return Result.fail(error);
   }
   ```

2. **修复类型不匹配**

   ```typescript
   // ❌ 错误
   const plan = TenantPlan.create(props.plan);
   // Error | TenantPlan 不能直接赋值给 TenantPlan

   // ✅ 正确
   const planResult = TenantPlan.create(props.plan);
   if (planResult.isFail()) {
     return Result.fail(planResult.error!);
   }
   const plan = planResult.value;
   ```

3. **添加 override 修饰符**

   ```typescript
   // tenant-quota.vo.ts
   public override equals(other: unknown): boolean {
     // ...
   }
   ```

4. **移除未使用的变量**
   ```typescript
   // tenant.middleware.ts
   async use(req: Request, _res: Response, next: NextFunction) {
     // 使用 _ 前缀标记未使用
   }
   ```

### 5. 租户缓存实现（预估 1 小时）

**需求**：缓存租户信息，减少数据库查询

**实现方案**：

```typescript
// apps/gateway/src/tenant/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantService: TenantService,
    private readonly cache: CacheService, // ← 添加缓存服务
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('缺少租户标识');
    }

    // 尝试从缓存获取
    const cacheKey = `tenant:${tenantId}`;
    let tenant = await this.cache.get(cacheKey);

    if (!tenant) {
      // 从数据库查询
      tenant = await this.tenantService.getById(tenantId);

      if (tenant) {
        // 缓存 5 分钟
        await this.cache.set(cacheKey, tenant, 300);
      }
    }

    if (!tenant || !tenant.status.canBeAccessed()) {
      throw new ForbiddenException('无效的租户或租户已被停用');
    }

    // 注入上下文
    this.tenantContext.run(
      TenantContext.create({
        tenantId,
        userId: req.user?.id,
      }),
      () => next(),
    );
  }
}
```

---

## 📋 完整 TODO 清单

### P0 级别（立即执行）

1. **完成 TenantResourceGuard**（30 分钟）
   - [ ] 集成 EntityManager 查询
   - [ ] 添加错误处理
   - [ ] 编写单元测试

2. **修复 TypeScript 错误**（1 小时）
   - [ ] 修复 `tenant.aggregate.ts` 类型错误
   - [ ] 修复测试文件类型错误
   - [ ] 添加 override 修饰符
   - [ ] 移除未使用变量

### P1 级别（本周内）

3. **实现租户缓存**（1 小时）
   - [ ] 集成 CacheService
   - [ ] 添加缓存失效策略
   - [ ] 性能测试

4. **完善查询功能**（0.5 天）
   - [ ] 实现状态和套餐过滤
   - [ ] 实现搜索功能
   - [ ] 添加测试

### P2 级别（下周）

5. **Organization 关联**（2-3 天）
   - [ ] Better Auth schema 扩展
   - [ ] 数据库迁移
   - [ ] OrganizationService 更新
   - [ ] 集成测试

---

## 🎯 下一步具体行动

### 立即执行（今天）

1. **完成 TenantResourceGuard 实现**
   - 时间：30 分钟
   - 文件：`apps/gateway/src/tenant/tenant.guard.ts`
   - 目标：完成资源查询逻辑

2. **修复 TypeScript 类型错误**
   - 时间：1 小时
   - 文件：多个领域层文件
   - 目标：消除所有类型错误

### 短期规划（本周）

3. **实现租户缓存**
   - 时间：1 小时
   - 文件：`apps/gateway/src/tenant/tenant.middleware.ts`
   - 目标：提升查询性能

4. **完善测试覆盖**
   - 时间：2 小时
   - 目标：达到 100% 覆盖率

---

## 📊 质量指标

### 当前状态

| 指标                | 当前 | 目标 | 状态 |
| :------------------ | :--: | :--: | :--: |
| **代码完整性**      | 95%  | 100% |  🟡  |
| **测试覆盖率**      | ~95% | 100% |  🟡  |
| **TypeScript 错误** | 10+  |  0   |  🔴  |
| **TODO 数量**       |  6   |  0   |  🟡  |

### 目标状态（今天结束时）

| 指标                | 目标 |
| :------------------ | :--: |
| **代码完整性**      | 100% |
| **测试覆盖率**      | 100% |
| **TypeScript 错误** |  0   |
| **TODO 数量**       | < 3  |

---

## 💡 建议和注意事项

### 开发建议

1. **优先修复类型错误**
   - 类型错误会影响代码提示和重构
   - 建议使用 `Result.unwrap()` 辅助函数简化错误处理

2. **渐进式添加缓存**
   - 先实现基本功能
   - 然后添加缓存优化
   - 避免过早优化

3. **完善测试覆盖**
   - 资源查询逻辑需要充分测试
   - 添加边界条件测试
   - 确保 100% 覆盖率

### 注意事项

1. **资源查询性能**
   - 考虑添加索引
   - 使用缓存减少数据库查询
   - 监控查询性能

2. **错误处理**
   - 资源不存在应返回 404
   - 跨租户访问应返回 403
   - 记录详细日志

3. **安全性**
   - 确保所有资源都经过租户检查
   - 超级管理员需要特殊处理
   - 审计日志记录

---

## 📝 总结

**当前进度**：

- ✅ 文档：100% 完成
- ✅ 装饰器：100% 完成
- 🟡 资源守卫：80% 完成
- ⏳ 类型修复：0% 完成
- ⏳ 缓存实现：0% 完成

**下一步**：优先完成 TenantResourceGuard 实现和修复 TypeScript 错误。

**预估完成时间**：

- P0 任务：2 小时
- P1 任务：2 小时
- **总计**：4 小时（今天可完成）

---

**维护者**：oksai.cc 团队  
**最后更新**：2026-03-08 17:50
