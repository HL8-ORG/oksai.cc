# 缓存架构迁移计划

## 概述

将缓存架构从 `apps/gateway/src/common` 迁移到独立库 `libs/cache`，并应用装饰器模式简化服务代码。

## 迁移阶段

### Phase 3.0: 独立库迁移 🔄（当前）

**目标**：创建 `@oksai/cache` 独立库

**原因**：
- ✅ 与现有架构一致（`@oksai/config`, `@oksai/logger`, `@oksai/database`）
- ✅ Monorepo 内项目可直接引用
- ✅ 便于其他项目复用
- ✅ 独立版本管理和测试
- ✅ 未来可发布到 npm
- ✅ 集中维护缓存逻辑

**迁移内容**：
| 组件 | 当前位置 | 迁移后位置 |
|:---|:---|:---|
| CacheService | `apps/gateway/src/common/cache.service.ts` | `libs/cache/src/lib/cache.service.ts` |
| RedisCacheService | `apps/gateway/src/common/redis-cache.service.ts` | `libs/cache/src/lib/redis-cache.service.ts` |
| RedisCacheEnhancedService | `apps/gateway/src/common/redis-cache-enhanced.service.ts` | `libs/cache/src/lib/redis-cache-enhanced.service.ts` |
| TTLJitterService | `apps/gateway/src/common/ttl-jitter.service.ts` | `libs/cache/src/lib/ttl-jitter.service.ts` |
| TwoLayerCacheService | `apps/gateway/src/common/two-layer-cache.service.ts` | `libs/cache/src/lib/two-layer-cache.service.ts` |
| @CachedResponse | `apps/gateway/src/common/decorators/cached-response.decorator.ts` | `libs/cache/src/lib/decorators/cached-response.decorator.ts` |
| @CacheInvalidate | `apps/gateway/src/common/decorators/cache-invalidate.decorator.ts` | `libs/cache/src/lib/decorators/cache-invalidate.decorator.ts` |
| CacheModule | `apps/gateway/src/common/cache.module.ts` | `libs/cache/src/lib/cache.module.ts` |
| CacheMonitorController | `apps/gateway/src/common/cache-monitor.controller.ts` | `libs/cache/src/lib/controllers/cache-monitor.controller.ts` |
| 测试文件 | `apps/gateway/src/common/*.spec.ts` | `libs/cache/src/lib/**/*.spec.ts` |

**迁移步骤**：
1. ⏳ 使用 Nx 生成库
   ```bash
   nx g @nx/node:library cache --directory=libs/cache --importPath=@oksai/cache --no-interactive
   ```

2. ⏳ 迁移核心服务
   - 迁移 CacheService + 测试
   - 迁移 RedisCacheService + 测试
   - 迁移 RedisCacheEnhancedService + 测试
   - 迁移 TTLJitterService + 测试（补充）
   - 迁移 TwoLayerCacheService + 测试

3. ⏳ 迁移装饰器
   - 迁移 @CachedResponse + 测试
   - 迁移 @CacheInvalidate + 测试

4. ⏳ 迁移模块和控制器
   - 迁移 CacheModule
   - 迁移 CacheMonitorController + 测试

5. ⏳ 更新导出
   - 更新 `libs/cache/src/index.ts`
   - 更新 `libs/cache/src/lib/cache.module.ts`

6. ⏳ 更新 gateway 依赖
   - 更新 `apps/gateway/package.json`
   - 更新导入路径：`@oksai/cache`
   - 更新模块导入

7. ⏳ 验证功能
   - 运行所有测试
   - 检查覆盖率
   - 验证监控 API

**预计时间**：1-2 小时

**注意事项**：
- 保持 API 向后兼容
- 所有测试必须通过
- 确保导入路径正确
- 更新 package.json 依赖

---

### Phase 3.1: SessionService 迁移 ⏳

**服务**: `apps/gateway/src/auth/session.service.ts`

**迁移目标**:
- 使用 `TwoLayerCacheService` 替代 `CacheService`
- 应用 `@CachedResponse` 装饰器缓存方法结果
- 应用 `@CacheInvalidate` 装饰器失效缓存

**方法映射**:

| 方法 | 当前模式 | 迁移后 | 装饰器 |
|:---|:---|:---|:---|
| `listActiveSessions` | 手动缓存读写 | 装饰器缓存 | `@CachedResponse` |
| `revokeSession` | 手动删除缓存 | 装饰器失效 | `@CacheInvalidate` |
| `revokeOtherSessions` | 手动删除缓存 | 装饰器失效 | `@CacheInvalidate` |
| `getSessionConfig` | 手动缓存读写 | 装饰器缓存 | `@CachedResponse` |
| `updateSessionConfig` | 手动删除缓存 | 装饰器失效 | `@CacheInvalidate` |

**代码示例**：

```typescript
// ❌ 迁移前
async listActiveSessions(userId: string, currentSessionToken?: string) {
  const cacheKey = `${SessionService.CACHE_PREFIX_LIST}${userId}`;
  
  // 手动缓存读取
  const cachedResponse = this.cacheService.get<SessionListResponse>(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 业务逻辑
  const result = await this.apiClient.listActiveSessions(userId, currentSessionToken);
  
  // 手动缓存写入
  this.cacheService.set(cacheKey, response, SessionService.CACHE_TTL_LIST);
  
  return response;
}

// ✅ 迁移后
@CachedResponse({
  cacheKey: (userId: string) => `session:list:${userId}`,
  ttl: 60000, // 1 分钟
})
async listActiveSessions(userId: string, currentSessionToken?: string) {
  const result = await this.apiClient.listActiveSessions(userId, currentSessionToken);
  
  // 转换为我们的格式
  const sessionList = result.sessions?.map(session => ({
    id: session.id,
    userId: session.userId,
    // ...
  })) || [];
  
  return {
    success: true,
    message: "获取活跃 Session 列表成功",
    sessions: sessionList,
  };
}
```

**优势**:
- ✅ 减少重复代码 40%+
- ✅ 双层缓存提升性能
- ✅ 自动 TTL 抖动防雪崩
- ✅ In-flight request 防击穿

**预计时间**：2-3 小时

---

### Phase 3.2: OAuthService 迁移 ⏳

**服务**: `apps/gateway/src/auth/oauth.service.ts`

**迁移目标**:
- 使用 `TwoLayerCacheService` 替代 `CacheService`
- 更新 Token 缓存逻辑

**方法映射**:

| 方法 | 当前模式 | 迁移后 | 装饰器 |
|:---|:---|:---|:---|
| `validateAccessToken` | 手动缓存 + 过期检查 | 保留手动缓存 | ❌ 不适用装饰器 |
| `revokeToken` | 无缓存失效 | 添加缓存失效 | ✅ `@CacheInvalidate` |

**特殊情况**:
- `validateAccessToken` 有自定义过期检查逻辑，不适合使用装饰器
- 需要手动处理缓存失效逻辑

**预计时间**：1-2 小时

---

### Phase 3.3: 其他服务迁移 ⏳

**服务列表**:
- AuthService
- TokenBlacklistService
- ApiKeyService
- OrganizationService

**迁移策略**: 待 Phase 3.1 和 3.2 完成后评估

**预计时间**：2-3 小时

---

## 总体时间估算

| 阶段 | 任务 | 预计时间 |
|:---|:---|:---:|
| Phase 3.0 | 独立库迁移 | 1-2 小时 |
| Phase 3.1 | SessionService 迁移 | 2-3 小时 |
| Phase 3.2 | OAuthService 迁移 | 1-2 小时 |
| Phase 3.3 | 其他服务迁移 | 2-3 小时 |
| **总计** | | **6-10 小时** |

---

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|:---|:---:|:---:|:---|
| 独立库迁移影响现有功能 | 高 | 低 | 完整测试验证、渐进式迁移 |
| 装饰器注入失败 | 高 | 低 | 确保服务正确注入 cacheService |
| 缓存键冲突 | 中 | 低 | 使用唯一前缀 + 用户 ID |
| 性能下降 | 中 | 低 | 性能对比测试 |
| 功能回归 | 高 | 低 | 完整的测试覆盖 |

---

## 回滚计划

如果迁移出现问题：
1. 保留原始代码备份
2. 通过配置切换回 CacheService
3. 添加功能开关控制新缓存行为
4. Git revert 到稳定版本

---

## 成功指标

- ✅ 所有测试通过（99/99）
- ✅ 代码覆盖率 >85%
- ✅ 代码量减少 30%+
- ✅ 缓存命中率 >80%（生产环境验证）
- ✅ 响应时间 <100ms
- ✅ 零功能回归
- ✅ 独立库可复用

---

## 参考文档

- [Nx Library Generation](https://nx.dev/packages/node/generators/library)
- [装饰器使用文档](./decorators-usage.md)
- [TwoLayerCacheService API](./api-reference.md)
- [性能测试报告](./performance-report.md)
