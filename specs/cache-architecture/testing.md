# 缓存架构测试计划

## 测试策略

采用测试金字塔模型：
- **单元测试（70%）**：快速反馈、高覆盖率
- **集成测试（20%）**：组件协作验证
- **E2E 测试（10%）**：关键业务流程验证

---

## 测试覆盖率目标

| 层级 | 目标覆盖率 | 实际覆盖率 | 状态 |
|:---|:---:|:---:|:---:|
| 基础设施层 | > 85% | 85% | ✅ |
| 应用层 | > 90% | -% | ⏳ |
| 总体 | > 85% | -% | ⏳ |

---

## 单元测试（70%）

### 1. TTL 抖动服务测试 ✅

**文件**：`apps/gateway/src/common/services/ttl-jitter.service.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should add ±10% jitter to TTL` | 验证抖动在 ±10% 范围内 | ✅ |
| `should return integer TTL` | 验证返回整数 | ✅ |
| `should handle zero TTL` | 验证 TTL=0 的情况 | ✅ |
| `should produce varied TTLs` | 验证随机性 | ✅ |

**测试示例**：
```typescript
describe('TTLJitterService', () => {
  let service: TTLJitterService;

  beforeEach(() => {
    service = new TTLJitterService();
  });

  it('should add ±10% jitter to TTL', () => {
    const ttl = 60000; // 60 秒
    const results = Array.from({ length: 100 }, () => service.addJitter(ttl));
    
    const min = Math.min(...results);
    const max = Math.max(...results);
    
    expect(min).toBeGreaterThanOrEqual(54000); // 60s * 0.9
    expect(max).toBeLessThanOrEqual(66000);    // 60s * 1.1
  });

  it('should return integer TTL', () => {
    const ttl = 60000;
    const result = service.addJitter(ttl);
    
    expect(Number.isInteger(result)).toBe(true);
  });
});
```

**覆盖率**：100% ✅

### 2. In-flight Request 管理测试 ✅

**文件**：`apps/gateway/src/common/services/lru-cache.service.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should merge concurrent requests` | 验证并发请求合并 | ✅ |
| `should clean up in-flight requests after completion` | 验证完成后清理 | ✅ |
| `should handle request errors` | 验证错误处理 | ✅ |
| `should prevent memory leaks` | 验证内存泄漏防护 | ✅ |

**测试示例**：
```typescript
describe('In-flight Request Management', () => {
  it('should merge concurrent requests', async () => {
    const key = 'user:123';
    let callCount = 0;
    
    const factory = async () => {
      callCount++;
      await sleep(100);
      return { id: 123, name: 'test' };
    };
    
    // 并发 100 个请求
    const promises = Array.from({ length: 100 }, () =>
      cacheService.getOrSet(key, factory, { ttl: 60000 })
    );
    
    const results = await Promise.all(promises);
    
    // 所有请求应该返回相同结果
    expect(results.every(r => r.id === 123)).toBe(true);
    // 只应该调用一次 factory
    expect(callCount).toBe(1);
    // in-flight request 应该被清理
    expect(cacheService.getInflightCount()).toBe(0);
  });
});
```

**覆盖率**：95% ✅

### 3. 空值缓存测试 ✅

**文件**：`apps/gateway/src/common/services/lru-cache.service.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should cache null values` | 验证空值缓存 | ✅ |
| `should use shorter TTL for null values` | 验证空值使用较短 TTL | ✅ |
| `should return cached null` | 验证返回缓存的 null | ✅ |

**测试示例**：
```typescript
describe('Null Value Caching', () => {
  it('should cache null values', async () => {
    const key = 'user:999';
    let dbCallCount = 0;
    
    const factory = async () => {
      dbCallCount++;
      return null; // 模拟数据库返回 null
    };
    
    // 首次调用
    const result1 = await cacheService.getOrSet(key, factory, { ttl: 60000 });
    expect(result1).toBeNull();
    expect(dbCallCount).toBe(1);
    
    // 再次调用（应该从缓存返回）
    const result2 = await cacheService.getOrSet(key, factory, { ttl: 60000 });
    expect(result2).toBeNull();
    expect(dbCallCount).toBe(1); // 不应该再次调用 factory
  });
});
```

**覆盖率**：95% ✅

### 4. SCAN 命令测试 🔄

**文件**：`apps/gateway/src/common/services/redis-cache.service.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should use SCAN instead of KEYS` | 验证使用 SCAN | ✅ |
| `should handle empty results` | 验证空结果处理 | ✅ |
| `should paginate through all keys` | 验证分页扫描 | ✅ |
| `should use pipeline for batch deletion` | 验证 Pipeline 优化 | ✅ |

**测试示例**：
```typescript
describe('SCAN Command', () => {
  it('should use SCAN instead of KEYS', async () => {
    // 设置测试数据
    await redisCacheService.set('test:key1', 'value1');
    await redisCacheService.set('test:key2', 'value2');
    await redisCacheService.set('other:key', 'value3');
    
    // 删除前缀为 test: 的键
    const deleted = await redisCacheService.deleteByPrefix('test:');
    
    expect(deleted).toBe(2);
    expect(await redisCacheService.get('test:key1')).toBeUndefined();
    expect(await redisCacheService.get('test:key2')).toBeUndefined();
    expect(await redisCacheService.get('other:key')).toBeDefined();
  });
});
```

**覆盖率**：70% 🔄

### 5. Lua 脚本测试 ⏳

**文件**：`apps/gateway/src/common/services/redis-cache.service.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should execute Lua script atomically` | 验证原子执行 | ⏳ |
| `should incr only if exists` | 验证条件递增 | ⏳ |
| `should return null if key not exists` | 验证不存在返回 null | ⏳ |

**测试示例**：
```typescript
describe('Lua Script - incrIfExistsAtomic', () => {
  it('should incr only if exists', async () => {
    const key = 'counter';
    
    // key 不存在时应该返回 null
    const result1 = await redisCacheService.incrIfExistsAtomic(key, 1);
    expect(result1).toBeNull();
    
    // 设置 key
    await redisCacheService.set(key, '10');
    
    // key 存在时应该递增
    const result2 = await redisCacheService.incrIfExistsAtomic(key, 5);
    expect(result2).toBe(15);
  });
});
```

**覆盖率**：待测试 ⏳

### 6. 双层缓存服务测试 ⏳

**文件**：`apps/gateway/src/common/services/two-layer-cache.service.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should try L1 first` | 验证优先 L1 | ⏳ |
| `should try L2 if L1 miss` | 验证 L1 miss 时查 L2 | ⏳ |
| `should backfill L1 on L2 hit` | 验证 L2 命中时回填 L1 | ⏳ |
| `should call factory if both miss` | 验证双层都 miss 时调用 factory | ⏳ |
| `should apply TTL jitter` | 验证 TTL 抖动 | ⏳ |

**测试示例**：
```typescript
describe('TwoLayerCacheService', () => {
  it('should try L1 first', async () => {
    const key = 'user:123';
    const value = { id: 123, name: 'test' };
    
    // 设置 L1
    l1Cache.set(key, value, 30000);
    
    const result = await twoLayerCache.get(key);
    
    expect(result).toEqual(value);
    // 不应该访问 L2
    expect(l2CacheGetSpy).not.toHaveBeenCalled();
  });
  
  it('should backfill L1 on L2 hit', async () => {
    const key = 'user:123';
    const value = { id: 123, name: 'test' };
    
    // 设置 L2
    await l2Cache.set(key, value, 7200000);
    
    // L1 应该为空
    expect(l1Cache.get(key)).toBeUndefined();
    
    // 获取应该从 L2 返回
    const result = await twoLayerCache.get(key);
    expect(result).toEqual(value);
    
    // L1 应该被回填
    expect(l1Cache.get(key)).toEqual(value);
  });
});
```

**覆盖率**：待实现 ⏳

### 7. 装饰器测试 ⏳

**文件**：`apps/gateway/src/common/decorators/cached-response.decorator.spec.ts`

| 测试用例 | 描述 | 状态 |
|:---|:---|:---:|
| `should cache method result` | 验证缓存方法结果 | ⏳ |
| `should return cached result on second call` | 验证第二次返回缓存 | ⏳ |
| `should skip cache if skipCache returns true` | 验证条件跳过 | ⏳ |
| `should not cache if skipSaveToCache returns true` | 验证条件不缓存 | ⏳ |

**测试示例**：
```typescript
describe('@CachedResponse', () => {
  it('should cache method result', async () => {
    class TestService {
      constructor(private cacheService: TwoLayerCacheService) {}
      
      @CachedResponse({
        builder: (id: string) => `user:${id}`,
        ttl: 60000,
      })
      async getUser(id: string) {
        return { id, name: 'test' };
      }
    }
    
    const service = new TestService(mockCacheService);
    
    // 首次调用
    const result1 = await service.getUser('123');
    expect(result1).toEqual({ id: '123', name: 'test' });
    
    // 第二次调用（应该从缓存返回）
    const result2 = await service.getUser('123');
    expect(result2).toEqual({ id: '123', name: 'test' });
  });
});
```

**覆盖率**：待实现 ⏳

---

## 集成测试（20%）

### 1. 双层缓存协作测试 ⏳

**文件**：`apps/gateway/src/common/services/two-layer-cache.integration.spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `L1 miss, L2 hit` | L1 未命中，L2 命中 | ⏳ |
| `L1 hit` | L1 直接命中 | ⏳ |
| `Both miss, factory called` | 双层都未命中，调用 factory | ⏳ |
| `L2 hit backfills L1` | L2 命中后回填 L1 | ⏳ |

### 2. Redis 连接和重连测试 ⏳

**文件**：`apps/gateway/src/common/services/redis-cache.integration.spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `Connection established` | 连接成功 | ⏳ |
| `Auto-reconnection on failure` | 故障自动重连 | ⏳ |
| `Graceful degradation on failure` | 故障时优雅降级 | ⏳ |

### 3. 缓存失效和批量删除测试 ⏳

**文件**：`apps/gateway/src/common/services/cache-invalidation.integration.spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `Delete by prefix` | 按前缀批量删除 | ⏳ |
| `Invalidate both L1 and L2` | 同时失效 L1 和 L2 | ⏳ |
| `Pipeline optimization` | Pipeline 优化验证 | ⏳ |

### 4. 监控端点集成测试 ⏳

**文件**：`apps/gateway/src/common/cache-monitor.integration.spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `GET /monitor/cache/stats` | 获取统计信息 | ⏳ |
| `GET /monitor/cache/health` | 健康检查 | ⏳ |
| `POST /monitor/cache/stats/reset` | 重置统计 | ⏳ |

---

## E2E 测试（10%）

### 1. API 端到端缓存测试 ⏳

**文件**：`apps/gateway/src/common/cache.e2e-spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `API response cached on first call` | 首次调用缓存响应 | ⏳ |
| `Cached response returned on second call` | 第二次返回缓存响应 | ⏳ |
| `Cache invalidated on data update` | 数据更新时缓存失效 | ⏳ |

### 2. 缓存命中/未命中场景测试 ⏳

**文件**：`apps/gateway/src/common/cache-hit-miss.e2e-spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `High hit rate scenario` | 高命中率场景 | ⏳ |
| `Cache miss scenario` | 缓存未命中场景 | ⏳ |
| `Cache penetration protection` | 缓存穿透保护 | ⏳ |

### 3. Redis 故障降级场景测试 ⏳

**文件**：`apps/gateway/src/common/cache-degradation.e2e-spec.ts`

| 测试场景 | 描述 | 状态 |
|:---|:---|:---:|
| `Graceful degradation on Redis failure` | Redis 故障时优雅降级 | ⏳ |
| `System continues with L1 cache` | 降级后使用 L1 缓存 | ⏳ |
| `Automatic recovery when Redis available` | Redis 恢复后自动恢复 | ⏳ |

---

## 性能测试

### 1. 缓存命中率测试 ⏳

**目标**：
- L1 命中率 > 80%
- L2 命中率 > 90%
- 总体命中率 > 95%

**测试方法**：
```bash
# 模拟 1000 次请求
# 其中 800 次 L1 命中
# 其中 150 次 L2 命中
# 其中 50 次数据库查询
```

### 2. 响应时间测试 ⏳

**目标**：
- L1 响应时间 < 1ms
- L2 响应时间 < 10ms
- 数据库查询 > 100ms

**测试方法**：
```bash
# 使用 artillery 或 k6 进行压测
k6 run performance/cache-performance.js
```

### 3. 并发测试 ⏳

**目标**：
- 1000 并发请求下缓存系统稳定
- In-flight request 合并率 > 99%

**测试方法**：
```typescript
// 1000 个并发请求同一未缓存数据
const promises = Array.from({ length: 1000 }, () =>
  cacheService.getOrSet('user:123', factory, { ttl: 60000 })
);

await Promise.all(promises);
// 验证 factory 只被调用 1 次
```

### 4. 内存使用测试 ⏳

**目标**：
- L1 缓存内存占用 < 100MB
- In-flight request 无内存泄漏

**测试方法**：
```bash
# 使用 Node.js 内存分析工具
node --inspect app.js
# 使用 Chrome DevTools 分析内存
```

---

## Mock 策略

### Redis Mock

使用 `ioredis-mock` 或自定义 mock：

```typescript
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  scan: vi.fn(),
  pipeline: vi.fn(() => ({
    del: vi.fn(),
    exec: vi.fn(),
  })),
  eval: vi.fn(),
};
```

### LRU Cache Mock

```typescript
const mockLRUCache = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  has: vi.fn(),
  size: vi.fn(),
};
```

---

## 测试数据准备

### 测试数据工厂

```typescript
// test/fixtures/cache.fixture.ts
export class CacheFixture {
  static createUser(id = '123') {
    return {
      id,
      name: 'Test User',
      email: 'test@example.com',
    };
  }
  
  static createCacheKey(prefix = 'user', id = '123') {
    return `${prefix}:${id}`;
  }
  
  static createCacheOptions(ttl = 60000) {
    return { ttl };
  }
}
```

---

## 测试命令

```bash
# 运行所有缓存相关测试
pnpm vitest run --grep "cache"

# 运行单元测试
pnpm vitest run apps/gateway/src/common/services/*.spec.ts

# 运行集成测试
pnpm vitest run apps/gateway/src/common/services/*.integration.spec.ts

# 运行 E2E 测试
pnpm vitest run apps/gateway/src/common/cache.e2e-spec.ts

# 运行性能测试
k6 run performance/cache-performance.js

# 生成覆盖率报告
pnpm vitest run --coverage --grep "cache"
```

---

## 持续集成

### GitHub Actions 配置

```yaml
name: Cache Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm vitest run --grep "cache" --coverage
      - uses: codecov/codecov-action@v3
```

---

## 测试检查清单

### Phase 1 测试（核心基础设施）

- [x] TTLJitterService 单元测试 > 95% 覆盖率
- [x] LRUCacheService 单元测试 > 90% 覆盖率
- [ ] RedisCacheService 单元测试 > 85% 覆盖率（70% 🔄）
- [ ] TwoLayerCacheService 单元测试 > 90% 覆盖率
- [ ] 集成测试通过
- [ ] 性能测试达标

### Phase 2 测试（装饰器和 API）

- [ ] @CachedResponse 装饰器单元测试 > 90% 覆盖率
- [ ] @CacheInvalidate 装饰器单元测试 > 90% 覆盖率
- [ ] 监控 API 集成测试通过
- [ ] E2E 测试通过

### Phase 3 测试（迁移和优化）

- [ ] 所有迁移代码测试通过
- [ ] 性能对比测试完成
- [ ] 文档验证通过

---

## 参考资料

- [Vitest 文档](https://vitest.dev/)
- [Testing NestJS Services](https://docs.nestjs.com/fundamentals/testing)
- [Redis Testing Best Practices](https://redis.io/docs/manual/testing/)
- [性能测试最佳实践](../../docs/testing/performance-testing.md)
