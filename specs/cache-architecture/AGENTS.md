# AGENTS.md — 企业级缓存架构

## 项目背景

构建参考 Novu 的双层缓存系统（L1 本地 LRU + L2 Redis），具备缓存三大问题防护（雪崩、击穿、穿透），支持装饰器模式和完整的监控能力。这是提升应用性能、保护数据库、支持高并发场景的关键基础设施。

## 开始前

1. **阅读设计文档**：`specs/cache-architecture/design.md`
2. **查看当前进度**：`specs/cache-architecture/implementation.md`
3. **了解测试计划**：`specs/cache-architecture/testing.md`
4. **参考 Novu 实现**：`/home/arligle/forks/novu/libs/application-generic/src/services/cache/`
5. **查看现有缓存代码**：`apps/gateway/src/common/cache.service.ts`

## 开发工作流程

### Phase 1: 核心基础设施（3-4 天）

遵循 TDD 循环（Red-Green-Refactor）：

1. **TTLJitterService** ✅
   - 🔴 Red: 编写抖动测试（±10% variance）
   - 🟢 Green: 实现抖动逻辑
   - 🔵 Refactor: 优化性能

2. **增强版 LRUCacheService** ✅
   - 🔴 Red: 编写 in-flight request 测试
   - 🟢 Green: 实现请求合并
   - 🔵 Refactor: 添加空值缓存

3. **增强版 RedisCacheService** 🔄
   - 🔴 Red: 编写 SCAN 命令测试
   - 🟢 Green: 实现 SCAN 替代 KEYS
   - 🔵 Refactor: 添加 Lua 脚本

4. **TwoLayerCacheService** ⏳
   - 🔴 Red: 编写双层缓存测试
   - 🟢 Green: 实现 L1 -> L2 -> DB 逻辑
   - 🔵 Refactor: 优化回填策略

### Phase 2: 装饰器和 API（2-3 天）

1. **@CachedResponse 装饰器**
   - 🔴 Red: 编写装饰器测试
   - 🟢 Green: 实现缓存逻辑
   - 🔵 Refactor: 添加条件跳过

2. **监控 API 更新**
   - 🔴 Red: 编写 API 测试
   - 🟢 Green: 实现 L1/L2 统计
   - 🔵 Refactor: 优化性能

### Phase 3: 迁移和优化（2-3 天）

1. **迁移现有代码**
2. **性能测试**
3. **文档编写**

## 代码模式

### TTL 抖动模式

```typescript
// ttl-jitter.service.ts
export class TTLJitterService {
  private readonly VARIANCE = 0.1; // ±10%

  addJitter(ttl: number): number {
    const variant = this.VARIANCE * ttl * Math.random();
    return Math.floor(ttl - (this.VARIANCE * ttl) / 2 + variant);
  }
}

// 测试示例：ttl-jitter.service.spec.ts
describe('TTLJitterService', () => {
  it('should add ±10% jitter to TTL', () => {
    const ttl = 60000;
    const results = Array.from({ length: 100 }, () => service.addJitter(ttl));
    
    const min = Math.min(...results);
    const max = Math.max(...results);
    
    expect(min).toBeGreaterThanOrEqual(54000); // 60s * 0.9
    expect(max).toBeLessThanOrEqual(66000);    // 60s * 1.1
  });
});
```

### In-flight Request 合并模式

```typescript
// lru-cache.service.ts
class LRUCacheService {
  private inflightRequests = new Map<string, Promise<any>>();

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    // 检查 in-flight request
    const inflight = this.inflightRequests.get(key);
    if (inflight) return inflight;

    // 尝试从缓存获取
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    // 创建 in-flight promise
    const promise = factory()
      .then((result) => {
        // 缓存结果（包括空值）
        const effectiveTTL = result ? ttl : 60000; // 空值缓存 60s
        this.set(key, result ?? null, effectiveTTL);
        return result;
      })
      .finally(() => {
        this.inflightRequests.delete(key);
      });

    this.inflightRequests.set(key, promise);
    return promise;
  }
}

// 测试示例：lru-cache.service.spec.ts
it('should merge concurrent requests', async () => {
  let callCount = 0;
  const factory = async () => {
    callCount++;
    await sleep(100);
    return { id: 123 };
  };

  const promises = Array.from({ length: 100 }, () =>
    cacheService.getOrSet('user:123', factory, 60000)
  );

  await Promise.all(promises);
  expect(callCount).toBe(1); // 只调用一次
});
```

### SCAN 命令模式

```typescript
// redis-cache.service.ts
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

// 测试示例：redis-cache.service.spec.ts
it('should use SCAN instead of KEYS', async () => {
  await redisCache.set('test:key1', 'value1');
  await redisCache.set('test:key2', 'value2');
  await redisCache.set('other:key', 'value3');

  const deleted = await redisCache.deleteByPrefix('test:');
  
  expect(deleted).toBe(2);
  expect(await redisCache.get('test:key1')).toBeUndefined();
  expect(await redisCache.get('other:key')).toBeDefined();
});
```

### 双层缓存模式

```typescript
// two-layer-cache.service.ts
class TwoLayerCacheService {
  constructor(
    private l1Cache: LRUCacheService,
    private l2Cache: RedisCacheService,
    private ttlJitterService: TTLJitterService
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    // 1. 尝试 L1
    const l1Value = this.l1Cache.get<T>(key);
    if (l1Value !== undefined) return l1Value;

    // 2. 尝试 L2
    const l2Value = await this.l2Cache.get<T>(key);
    if (l2Value !== undefined) {
      // 回填 L1
      this.l1Cache.set(key, l2Value, 30000);
      return l2Value;
    }

    return undefined;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // 添加抖动
    const ttlWithJitter = this.ttlJitterService.addJitter(ttl);

    // 写入双层
    await Promise.all([
      this.l1Cache.set(key, value, Math.min(ttlWithJitter, 30000)),
      this.l2Cache.set(key, value, ttlWithJitter),
    ]);
  }
}

// 测试示例：two-layer-cache.service.spec.ts
it('should backfill L1 on L2 hit', async () => {
  await twoLayerCache.set('user:123', { id: 123 }, 60000);
  
  // 清空 L1（模拟 L1 miss）
  l1Cache.clear();
  
  // L2 应该存在
  expect(await l2Cache.get('user:123')).toBeDefined();
  
  // L1 应该为空
  expect(l1Cache.get('user:123')).toBeUndefined();
  
  // 获取数据
  const result = await twoLayerCache.get('user:123');
  expect(result).toEqual({ id: 123 });
  
  // L1 应该被回填
  expect(l1Cache.get('user:123')).toEqual({ id: 123 });
});
```

### 装饰器模式

```typescript
// cached-response.decorator.ts
export function CachedResponse(options: {
  builder: (...args: any[]) => string;
  ttl?: number;
  skipCache?: (...args: any[]) => boolean;
  skipSaveToCache?: (response: any) => boolean;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService as TwoLayerCacheService;

      // 检查是否跳过缓存
      if (options.skipCache?.(...args)) {
        return await originalMethod.apply(this, args);
      }

      // 构建缓存键
      const cacheKey = options.builder(...args);

      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      if (!options.skipSaveToCache?.(result)) {
        await cacheService.set(cacheKey, result, options.ttl || 60000);
      }

      return result;
    };

    return descriptor;
  };
}

// 使用示例
class UserService {
  constructor(private cacheService: TwoLayerCacheService) {}

  @CachedResponse({
    builder: (id: string) => `user:${id}`,
    ttl: 60000,
    skipCache: (id) => id === 'admin',
  })
  async getUser(id: string) {
    return this.userRepository.findById(id);
  }
}

// 测试示例：cached-response.decorator.spec.ts
it('should cache method result', async () => {
  const service = new UserService(mockCacheService);

  const result1 = await service.getUser('123');
  expect(result1).toEqual({ id: '123', name: 'test' });

  const result2 = await service.getUser('123');
  expect(result2).toEqual({ id: '123', name: 'test' });
  
  // 验证只调用了一次
  expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
});
```

## 不要做

### ❌ 不要使用 KEYS 命令

```typescript
// ❌ 错误
const keys = await this.client.keys(`${prefix}*`);

// ✅ 正确
const stream = this.client.scanIterator({
  MATCH: `${prefix}*`,
  COUNT: 100,
});
```

### ❌ 不要使用固定 TTL

```typescript
// ❌ 错误
await this.cache.set(key, value, 60000);

// ✅ 正确
const ttlWithJitter = this.ttlJitterService.addJitter(60000);
await this.cache.set(key, value, ttlWithJitter);
```

### ❌ 不要忘记处理空值

```typescript
// ❌ 错误
const result = await factory();
if (result) {
  await this.cache.set(key, result, ttl);
}

// ✅ 正确
const result = await factory();
const effectiveTTL = result ? ttl : 60000; // 空值缓存 60s
await this.cache.set(key, result ?? null, effectiveTTL);
```

### ❌ 不要忘记清理 in-flight requests

```typescript
// ❌ 错误
const promise = factory().then((result) => {
  this.cache.set(key, result, ttl);
  return result;
});

// ✅ 正确
const promise = factory()
  .then((result) => {
    this.cache.set(key, result, ttl);
    return result;
  })
  .finally(() => {
    this.inflightRequests.delete(key);
  });
```

### ❌ 不要跳过测试

每个功能都必须遵循 TDD 流程：
1. 先写失败的测试（Red）
2. 写最简代码通过测试（Green）
3. 重构优化代码（Refactor）

## 测试策略

### 单元测试（70%）

**基础设施层测试**：
- TTLJitterService：抖动计算
- LRUCacheService：in-flight request、空值缓存
- RedisCacheService：SCAN 命令、Lua 脚本
- TwoLayerCacheService：双层逻辑

**测试命名**：`should {behavior} when {condition}`

### 集成测试（20%）

**基础设施层测试**：
- 双层缓存协作
- Redis 连接和重连
- 缓存失效和批量删除

### E2E 测试（10%）

**关键场景测试**：
- API 端到端缓存
- Redis 故障降级
- 高并发场景

## 常见问题

### Q: 为什么需要 TTL 抖动？

**A:** 防止缓存雪崩。如果所有缓存使用固定 TTL，可能同时失效导致数据库压力激增。抖动将失效时间分散，避免雪崩。

### Q: in-flight request 合并有什么用？

**A:** 防止缓存击穿。当大量并发请求访问同一未缓存数据时，只让一个请求访问数据库，其他请求等待结果，避免数据库压力。

### Q: 为什么要缓存空值？

**A:** 防止缓存穿透。恶意请求不存在的数据时，如果不缓存空值，每次都会访问数据库。缓存空值 60 秒可以有效防护。

### Q: 为什么要使用 SCAN 替代 KEYS？

**A:** KEYS 命令会阻塞 Redis，在生产环境中可能导致性能问题。SCAN 命令是非阻塞的分页扫描，更适合生产环境。

### Q: L1 和 L2 的 TTL 如何设置？

**A:**
- L1 (本地缓存): 30 秒，快速失效，减少内存占用
- L2 (Redis): 2 小时，持久缓存，减少数据库访问
- L2 命中时回填 L1，保持数据一致性

### Q: 如何验证缓存效果？

**A:**
1. 检查缓存命中率：`GET /monitor/cache/stats`
2. 性能测试：对比缓存前后的响应时间
3. 监控告警：缓存降级事件触发告警

### Q: 如何处理 Redis 故障？

**A:**
1. 自动降级到 L1 缓存
2. 记录降级事件日志
3. 触发告警通知
4. Redis 恢复后自动重连

## 性能指标

### 目标指标

| 指标 | 目标 | 说明 |
|:---|:---:|:---|
| L1 命中率 | >80% | 本地缓存命中率 |
| L2 命中率 | >90% | Redis 缓存命中率 |
| 总体命中率 | >95% | 整体缓存命中率 |
| L1 响应时间 | <1ms | 本地缓存读取时间 |
| L2 响应时间 | <10ms | Redis 缓存读取时间 |
| In-flight 合并率 | >99% | 并发请求合并率 |

### 性能测试命令

```bash
# 运行性能测试
k6 run performance/cache-performance.js

# 检查缓存统计
curl http://localhost:3000/monitor/cache/stats

# 检查缓存健康
curl http://localhost:3000/monitor/cache/health
```

## 参考实现

### Novu 缓存架构

**核心文件**：
- `/home/arligle/forks/novu/libs/application-generic/src/services/cache/cache.service.ts`
- `/home/arligle/forks/novu/libs/application-generic/src/services/in-memory-lru-cache/in-memory-lru-cache.service.ts`
- `/home/arligle/forks/novu/libs/application-generic/src/services/cache/interceptors/cached-response.decorator.ts`

**关键特性**：
- ✅ TTL 抖动防雪崩
- ✅ In-flight request 合并防击穿
- ✅ 空值缓存防穿透
- ✅ SCAN 命令替代 KEYS
- ✅ Lua 脚本原子操作
- ✅ 装饰器模式

## 开发工具

### 测试命令

```bash
# 运行所有缓存测试
pnpm vitest run --grep "cache"

# 运行特定文件测试
pnpm vitest run apps/gateway/src/common/services/ttl-jitter.service.spec.ts

# 运行覆盖率
pnpm vitest run --coverage --grep "cache"

# 监听模式
pnpm vitest watch --grep "cache"
```

### 调试命令

```bash
# 查看 Redis 连接状态
redis-cli ping

# 查看所有缓存键
redis-cli KEYS "oksai:*"

# 查看缓存统计
curl http://localhost:3000/monitor/cache/stats | jq

# 清空所有缓存
redis-cli FLUSHDB
```

## 下一步

1. ✅ 完成 TTLJitterService
2. ✅ 完成 LRUCacheService 增强版
3. 🔄 完成 RedisCacheService 增强版（SCAN + Lua）
4. ⏳ 开始 TwoLayerCacheService 实现
5. ⏳ 实现装饰器模式
6. ⏳ 迁移现有代码
7. ⏳ 性能测试和优化
