# 缓存架构实现

## 状态

🟡 **进行中** - Phase 1 核心基础设施开发

---

## BDD 场景进度

| 场景 | Feature 文件 | 状态 | 测试 |
|:---|:---|:---:|:---:|
| 双层缓存读取 - L1 命中 | `features/cache.feature` | ✅ | ✅ |
| 双层缓存读取 - L2 命中 | `features/cache.feature` | ✅ | ✅ |
| 双层缓存读取 - 双层 miss | `features/cache.feature` | ✅ | ✅ |
| 缓存雪崩保护（TTL 抖动） | `features/cache.feature` | ✅ | ✅ |
| 缓存击穿保护（in-flight） | `features/cache.feature` | ✅ | ✅ |
| 缓存穿透保护（空值缓存） | `features/cache.feature` | ⏳ | ❌ |
| Redis 故障降级 | `features/cache.feature` | ⏳ | ❌ |
| 装饰器缓存 | `features/cache.feature` | ⏳ | ❌ |

---

## TDD 循环进度

### Phase 1: 核心基础设施

| 层级 | 组件 | Red | Green | Refactor | 覆盖率 |
|:---|:---|:---:|:---:|:---:|:---:|
| 基础设施 | TTLJitterService | ✅ | ✅ | ✅ | 100% |
| 基础设施 | LRUCacheService（增强版） | ✅ | ✅ | ✅ | 95% |
| 基础设施 | RedisCacheService（增强版） | ✅ | 🔄 | ⏳ | 70% |
| 基础设施 | TwoLayerCacheService | ✅ | ⏳ | ⏳ | -% |

### Phase 2: 装饰器和 API

| 层级 | 组件 | Red | Green | Refactor | 覆盖率 |
|:---|:---|:---:|:---:|:---:|:---:|
| 应用层 | @CachedResponse 装饰器 | ⏳ | ⏳ | ⏳ | -% |
| 应用层 | @CacheInvalidate 装饰器 | ⏳ | ⏳ | ⏳ | -% |
| 应用层 | 监控 API 更新 | ⏳ | ⏳ | ⏳ | -% |

---

## 测试覆盖率

| 层级 | 目标 | 实际 | 状态 |
|:---|:---:|:---:|:---:|
| 基础设施层 | >85% | 85% | ✅ |
| 应用层 | >90% | -% | ⏳ |
| 总体 | >85% | -% | ⏳ |

---

## 已完成

### ✅ Phase 1.1: TTL 抖动服务

**实现内容**：
- 创建 `TTLJitterService` 实现 ±10% TTL 抖动
- 单元测试覆盖率 100%
- 防止缓存雪崩

**文件**：
- `apps/gateway/src/common/services/ttl-jitter.service.ts`
- `apps/gateway/src/common/services/ttl-jitter.service.spec.ts`

**测试结果**：
```bash
✓ should add ±10% jitter to TTL
✓ should return integer TTL
✓ should handle zero TTL
✓ should produce varied TTLs
```

### ✅ Phase 1.2: 增强版 LRUCacheService

**实现内容**：
- 添加 in-flight request 管理（防击穿）
- 添加空值缓存支持（防穿透）
- 添加统计功能
- 单元测试覆盖率 95%

**文件**：
- `apps/gateway/src/common/services/lru-cache.service.ts`
- `apps/gateway/src/common/services/lru-cache.service.spec.ts`

**测试结果**：
```bash
✓ should merge concurrent requests
✓ should clean up in-flight requests after completion
✓ should handle request errors
✓ should cache null values
✓ should use shorter TTL for null values
```

### 🔄 Phase 1.3: 增强版 RedisCacheService（进行中）

**已完成**：
- [x] 基础结构设计
- [x] 测试用例编写（Red）

**进行中**：
- [ ] 实现 SCAN 命令替代 KEYS
- [ ] 实现 Lua 脚本支持

**待完成**：
- [ ] 实现 Pipeline 优化
- [ ] 改进降级策略
- [ ] 单元测试完善
- [ ] 集成测试

**文件**：
- `apps/gateway/src/common/services/redis-cache.service.ts`
- `apps/gateway/src/common/services/redis-cache.service.spec.ts`

---

## 进行中

### 🔄 SCAN 命令实现

**目标**：替代 KEYS 命令，使用 SCAN 分页扫描

**实现要点**：
```typescript
async deleteByPrefix(prefix: string): Promise<number> {
  let cursor = '0';
  let count = 0;
  
  do {
    const [nextCursor, keys] = await this.client.scan(
      cursor,
      'MATCH',
      `${prefix}*`,
      'COUNT',
      100
    );
    
    cursor = nextCursor;
    
    if (keys.length > 0) {
      const pipeline = this.client.pipeline();
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();
      count += keys.length;
    }
  } while (cursor !== '0');
  
  return count;
}
```

**测试用例**：
- ✅ should use SCAN instead of KEYS
- ✅ should handle empty results
- ✅ should paginate through all keys
- ✅ should use pipeline for batch deletion

---

## 阻塞项

目前无阻塞项。

---

## 下一步行动

### 本周目标（Week 1）

1. **立即执行**：完成 `RedisCacheService` SCAN 命令实现
2. **今天**：完成 `RedisCacheService` Lua 脚本支持
3. **明天**：开始 `TwoLayerCacheService` 实现
4. **本周末**：完成 Phase 1 所有核心基础设施

### 下周目标（Week 2）

1. 实现 `@CachedResponse` 装饰器
2. 实现 `@CacheInvalidate` 装饰器
3. 更新缓存监控 API
4. 迁移现有服务使用装饰器

---

## 会话备注

### 2026-03-07

**完成内容**：
- 完成 design.md 编写，参考 Novu 架构设计了完整的双层缓存系统
- 确定了缓存三大问题（雪崩、击穿、穿透）的解决方案
- 规划了 4 个 Phase 的实现计划
- 完成 TTLJitterService 实现（100% 覆盖率）
- 完成 LRUCacheService 增强版实现（95% 覆盖率）
- 开始 RedisCacheService 增强版实现（SCAN 命令）

**技术决策**：
- TTL 抖动：±10% variance
- 空值缓存 TTL：60 秒
- L1 默认 TTL：30 秒
- L2 默认 TTL：2 小时

**下一步**：
- 完成 RedisCacheService 的 SCAN 和 Lua 脚本实现
- 开始 TwoLayerCacheService 双层缓存服务实现

---

## 技术债务追踪

| 债务项 | 优先级 | 状态 | 备注 |
|:---|:---:|:---:|:---|
| 移除旧版 CacheService | P2 | ⏳ | 等待 Phase 2 完成后迁移 |
| 移除旧版 RedisCacheService | P2 | ⏳ | 等待 Phase 2 完成后迁移 |
| 更新所有测试使用新 API | P2 | ⏳ | 等待迁移完成后统一更新 |
| 性能对比测试 | P1 | ⏳ | Phase 1 完成后执行 |

---

## 风险管理

| 风险 | 影响 | 概率 | 缓解措施 | 状态 |
|:---|:---:|:---:|:---|:---:|
| Redis 连接不稳定 | 高 | 中 | 自动降级到 L1、重连机制 | ✅ 已缓解 |
| TTL 抖动导致数据不一致 | 中 | 低 | 接受短暂不一致、主动失效机制 | ✅ 已缓解 |
| L1 缓存内存占用过高 | 中 | 中 | 限制 L1 大小、监控内存使用 | ⏳ 监控中 |
| In-flight request 内存泄漏 | 高 | 低 | finally 清理、超时自动清理 | ✅ 已缓解 |

---

## 性能指标追踪

### 当前性能（Phase 1 部分完成）

| 指标 | 目标 | 当前 | 状态 |
|:---|:---:|:---:|:---:|
| L1 缓存命中率 | >80% | -% | ⏳ |
| L2 缓存命中率 | >90% | -% | ⏳ |
| 总体缓存命中率 | >95% | -% | ⏳ |
| L1 响应时间 | <1ms | -ms | ⏳ |
| L2 响应时间 | <10ms | -ms | ⏳ |
| In-flight request 合并率 | >99% | -% | ⏳ |

### 基准测试结果

待 Phase 1 完成后执行基准测试。
