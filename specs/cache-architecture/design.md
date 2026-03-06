# 企业级缓存架构设计

## 概述

构建参考 Novu 的双层缓存系统，支持本地 LRU 缓存（L1）+ Redis 分布式缓存（L2），具备缓存三大问题防护（雪崩、击穿、穿透），支持多种 Redis 部署模式，提供装饰器模式和完整的监控能力。

## 问题陈述

当前 oksai.cc 项目缓存机制存在以下问题：

1. **缺乏防雪崩保护**：所有缓存使用固定 TTL，可能同时失效导致数据库压力激增
2. **缺乏防击穿保护**：高并发场景下可能导致大量请求穿透到数据库
3. **缺乏防穿透保护**：未缓存空值，可能导致恶意请求攻击数据库
4. **Redis KEYS 命令性能问题**：批量删除使用 KEYS 命令，生产环境不安全
5. **缺乏装饰器模式**：需要手动调用缓存 API，代码侵入性强
6. **单层缓存架构**：仅支持内存或 Redis 二选一，无法充分利用双层缓存优势
7. **降级策略不足**：Redis 故障时直接绕过缓存，可能导致数据库雪崩

## 用户故事

### 主用户故事

```gherkin
作为 系统开发者
我想要 一个健壮的企业级缓存系统
以便于 提升应用性能、保护数据库、支持高并发场景
```

### 验收标准（INVEST 原则）

| 原则 | 说明 | 检查点 |
|:---|:---|:---|
| **I**ndependent | 独立性 | ✅ 可独立部署，不依赖其他新功能 |
| **N**egotiable | 可协商 | ✅ 实现细节可根据实际情况调整 |
| **V**aluable | 有价值 | ✅ 提升性能、保护数据库、增强可靠性 |
| **E**stimable | 可估算 | ✅ 基于现有代码和 Novu 参考可估算 |
| **S**mall | 足够小 | ✅ 可拆分为多个阶段实现 |
| **T**estable | 可测试 | ✅ 有明确的性能和功能指标 |

### 相关用户故事

- 作为**后端开发者**，我希望使用装饰器快速添加缓存，以便减少重复代码
- 作为**运维工程师**，我希望缓存系统支持多种 Redis 部署模式，以便灵活部署
- 作为**系统架构师**，我希望缓存系统有完整的监控指标，以便及时发现性能问题
- 作为**安全工程师**，我希望缓存系统能防止缓存穿透攻击，以便保护数据库

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Scenario: 双层缓存读取 - L1 命中
  Given 用户请求获取用户信息 userId=123
  And L1 缓存中存在用户数据
  When 系统执行缓存查询
  Then 直接从 L1 返回数据
  And 不访问 L2 缓存和数据库
  And 响应时间 < 1ms

Scenario: 双层缓存读取 - L1 未命中，L2 命中
  Given 用户请求获取用户信息 userId=123
  And L1 缓存中不存在
  And L2 缓存中存在用户数据
  When 系统执行缓存查询
  Then 从 L2 返回数据
  And 回填 L1 缓存
  And 不访问数据库
  And 响应时间 < 10ms

Scenario: 使用装饰器缓存方法结果
  Given 定义了带 @CachedResponse 装饰器的方法
  When 方法首次被调用
  Then 执行方法逻辑并将结果缓存
  When 方法再次被调用
  Then 直接返回缓存结果
```

### 异常流程（Error Cases）

```gherkin
Scenario: Redis 连接失败降级
  Given Redis 服务不可用
  When 系统尝试访问 L2 缓存
  Then 自动降级到 L1 缓存
  And 记录降级日志
  And 系统正常工作

Scenario: 缓存雪崩保护
  Given 大量缓存在相近时间创建
  And 都设置了 60 秒 TTL
  When TTL 到期时
  Then 缓存失效时间分散在 54-66 秒之间
  And 数据库负载平稳
```

### 边界条件（Edge Cases）

```gherkin
Scenario: 高并发请求同一未缓存数据（缓存击穿保护）
  Given 100 个并发请求访问同一未缓存数据
  And 数据库查询耗时 200ms
  When 所有请求同时到达
  Then 只有 1 个请求访问数据库
  And 其他 99 个请求等待结果
  And 总数据库查询次数 = 1

Scenario: 缓存空值防止穿透
  Given 用户请求不存在的数据 userId=999
  And 数据库查询返回 null
  When 系统缓存结果
  Then 空值被缓存 60 秒
  When 再次请求相同数据
  Then 直接返回 null（不访问数据库）
```

## 技术设计

### 领域层

**值对象**：
- `CacheKey`: 缓存键，包含前缀、版本、标识符
- `TTL`: 生存时间，支持抖动计算
- `CacheLayer`: 缓存层级（L1/L2）

**领域服务**：
- `CacheStrategyService`: 缓存策略服务（读取、写入、失效策略）
- `CacheStatisticsService`: 缓存统计服务（命中率、大小、性能）

**领域事件**：
- `CacheHitEvent`: 缓存命中事件
- `CacheMissEvent`: 缓存未命中事件
- `CacheInvalidatedEvent`: 缓存失效事件
- `CacheDegradedEvent`: 缓存降级事件

**业务规则**：
- **BR-1**: TTL 必须添加 ±10% 抖动防止雪崩
- **BR-2**: 并发请求相同键值时必须合并请求（in-flight request deduplication）
- **BR-3**: 空值必须缓存 60 秒防止穿透
- **BR-4**: L1 缓存失效时必须尝试 L2
- **BR-5**: L2 缓存命中时必须回填 L1

### 应用层

**Command**：
- `SetCacheCommand`: 设置缓存（支持双层）
- `InvalidateCacheCommand`: 失效缓存（支持前缀批量）
- `WarmupCacheCommand`: 缓存预热

**Query**：
- `GetCacheQuery`: 获取缓存（L1 -> L2 -> DB）
- `GetCacheStatsQuery`: 获取缓存统计信息

**Handler**：
- `SetCacheHandler`: 双层写入逻辑、TTL 抖动计算
- `GetCacheHandler`: 双层读取逻辑、in-flight request 管理
- `InvalidateCacheHandler`: SCAN 命令批量删除、Pipeline 优化

### 基础设施层

**Repository**：
- `ILRUCacheRepository`: 本地 LRU 缓存接口（基于 lru-cache）
- `IRedisCacheRepository`: Redis 缓存接口（基于 ioredis）
- `RedisProviderFactory`: Redis 提供者工厂（支持单节点/主从/集群）

**Adapter**：
- `LRUCacheAdapter`: LRU 缓存适配器
- `RedisCacheAdapter`: Redis 缓存适配器（封装 ioredis）
- `CacheMonitorAdapter`: 缓存监控适配器（统计、健康检查）

**装饰器**：
- `@CachedResponse`: 方法结果缓存装饰器
- `@CacheInvalidate`: 失效缓存装饰器
- `@Cacheable`: 标记可缓存对象

### 缓存架构设计

```
┌─────────────────────────────────────────────────┐
│              Application Layer                  │
│   @CachedResponse / @CacheInvalidate            │
├─────────────────────────────────────────────────┤
│          TwoLayerCacheService                   │
│  ┌───────────────────────────────────────────┐ │
│  │  get/set/invalidate/getOrSet              │ │
│  │  - TTL with jitter                        │ │
│  │  - In-flight request dedup                │ │
│  │  - Null value caching                     │ │
│  └───────────────────────────────────────────┘ │
├────────────────┬────────────────────────────────┤
│ L1: Local LRU  │ L2: Distributed Redis Cache   │
│ Cache Service  │ Cache Service                  │
│ ┌────────────┐ │ ┌────────────────────────────┐ │
│ │ lru-cache  │ │ │ Redis Provider Factory     │ │
│ │ - 1000     │ │ │ - Redis Single Node        │ │
│ │ - 30-60s   │ │ │ - Redis Master-Slave       │ │
│ │ - In-memory│ │ │ - Redis Cluster            │ │
│ └────────────┘ │ │ - ElastiCache (future)     │ │
│                │ └────────────────────────────┘ │
├────────────────┴────────────────────────────────┤
│            Infrastructure Layer                 │
│  ┌────────────────────────────────────────────┐ │
│  │  Redis Client (ioredis)                    │ │
│  │  - SCAN instead of KEYS                    │ │
│  │  - Pipeline optimization                   │ │
│  │  - Lua scripts for atomic operations       │ │
│  │  - Auto-reconnection                       │ │
│  └────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│          Monitoring & Health Check              │
│  - Cache hit rate                              │
│  - L1/L2 size                                  │
│  - In-flight requests                          │
│  - Degradation status                          │
└─────────────────────────────────────────────────┘
```

### 核心功能模块

#### 1. 双层缓存服务（TwoLayerCacheService）

```typescript
class TwoLayerCacheService {
  // L1: 本地缓存（30-60s TTL）
  private l1Cache: LRUCacheService;
  
  // L2: Redis 缓存（2h TTL）
  private l2Cache: RedisCacheService;
  
  // In-flight request 合并（防击穿）
  private inflightRequests: Map<string, Promise<any>>;
  
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
  
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // 检查 in-flight request
    const inflight = this.inflightRequests.get(key);
    if (inflight) return inflight;
    
    // 尝试从缓存获取
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;
    
    // 创建 in-flight promise
    const promise = factory()
      .then((result) => {
        // 缓存结果（包括空值）
        const ttl = result ? options.ttl : 60000;
        this.set(key, result ?? null, ttl);
        return result;
      })
      .finally(() => {
        this.inflightRequests.delete(key);
      });
    
    this.inflightRequests.set(key, promise);
    return promise;
  }
}
```

#### 2. TTL 抖动防雪崩

```typescript
class TTLJitterService {
  private readonly VARIANCE = 0.1; // ±10%
  
  addJitter(ttl: number): number {
    const variant = this.VARIANCE * ttl * Math.random();
    return Math.floor(ttl - (this.VARIANCE * ttl) / 2 + variant);
  }
}

// 使用示例
const ttl = 60000; // 60 秒
const ttlWithJitter = jitterService.addJitter(ttl); // 54-66 秒
```

#### 3. SCAN 替代 KEYS（性能优化）

```typescript
class RedisCacheService {
  async deleteByPrefix(prefix: string): Promise<number> {
    let cursor = '0';
    let count = 0;
    
    do {
      // 使用 SCAN 替代 KEYS
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100
      );
      
      cursor = nextCursor;
      
      if (keys.length > 0) {
        // Pipeline 批量删除
        const pipeline = this.client.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
        count += keys.length;
      }
    } while (cursor !== '0');
    
    return count;
  }
}
```

#### 4. Lua 脚本原子操作

```typescript
class RedisCacheService {
  // 原子递增（仅当 key 存在时）
  private readonly INCR_IF_EXISTS_SCRIPT = `
    if redis.call('exists', KEYS[1]) == 1 then
      return redis.call('incrby', KEYS[1], ARGV[1])
    else
      return nil
    end
  `;
  
  async incrIfExistsAtomic(key: string, increment = 1): Promise<number | null> {
    return await this.eval<number | null>(
      this.INCR_IF_EXISTS_SCRIPT,
      [key],
      [increment]
    );
  }
}
```

#### 5. 装饰器模式

```typescript
// 方法结果缓存装饰器
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
        await cacheService.set(cacheKey, result, options.ttl);
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
```

#### 6. 多 Redis 部署模式支持

```typescript
enum RedisProviderType {
  SINGLE_NODE = 'single-node',
  MASTER_SLAVE = 'master-slave',
  CLUSTER = 'cluster',
  ELASTICACHE = 'elasticache',
}

class RedisProviderFactory {
  static create(config: RedisConfig): Redis {
    switch (config.type) {
      case RedisProviderType.SINGLE_NODE:
        return new Redis(config.port, config.host, config.options);
      
      case RedisProviderType.MASTER_SLAVE:
        return new Redis({
          sentinels: config.sentinels,
          name: config.masterName,
        });
      
      case RedisProviderType.CLUSTER:
        return new Redis.Cluster(config.nodes, config.options);
      
      default:
        throw new Error(`Unsupported Redis provider: ${config.type}`);
    }
  }
}
```

### 数据库变更

无需数据库变更，仅涉及缓存层。

### API 变更

**新增缓存监控接口**：

```typescript
// GET /monitor/cache/stats
interface CacheStatsResponse {
  l1: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  };
  l2: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    status: 'connected' | 'disconnected' | 'degraded';
  };
  inflightRequests: number;
  degradedMode: boolean;
}

// GET /monitor/cache/health
interface CacheHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  l1: { status: string };
  l2: { status: string; latency?: number };
  timestamp: string;
}

// POST /monitor/cache/stats/reset
interface ResetStatsResponse {
  success: boolean;
  message: string;
}
```

### 配置变更

```typescript
// apps/gateway/src/config/cache.config.ts
export const cacheConfig = {
  // L1 配置
  l1: {
    max: 1000,         // 最大缓存条数
    ttl: 30000,        // 默认 30s TTL
    enableStats: true, // 启用统计
  },
  
  // L2 配置
  l2: {
    enabled: process.env.REDIS_ENABLED === 'true',
    type: process.env.REDIS_TYPE || 'single-node',
    url: process.env.REDIS_URL,
    ttl: 7200000,      // 默认 2h TTL
    keyPrefix: 'oksai:',
    connectTimeout: 50000,
    maxRetriesPerRequest: 3,
  },
  
  // TTL 抖动配置
  jitter: {
    enabled: true,
    variance: 0.1,     // ±10%
  },
  
  // 防穿透配置
  nullCache: {
    enabled: true,
    ttl: 60000,        // 空值缓存 60s
  },
};
```

### 环境变量

```bash
# Redis 配置
REDIS_ENABLED=true
REDIS_TYPE=single-node  # single-node | master-slave | cluster
REDIS_URL=redis://localhost:6379
REDIS_TTL=7200          # 2 小时（秒）
REDIS_PREFIX=oksai:
REDIS_CONNECT_TIMEOUT=50000

# L1 缓存配置
L1_CACHE_MAX=1000
L1_CACHE_TTL=30         # 30 秒（秒）

# 缓存特性开关
CACHE_JITTER_ENABLED=true
CACHE_NULL_VALUE_ENABLED=true
```

## 边界情况

### 缓存雪崩

**场景**：大量缓存在同一时间失效
**处理**：TTL 抖动（±10% variance）分散失效时间

### 缓存击穿

**场景**：高并发请求访问同一未缓存数据
**处理**：In-flight request deduplication 合并请求

### 缓存穿透

**场景**：恶意请求不存在的数据
**处理**：缓存空值 60 秒

### Redis 故障

**场景**：Redis 服务不可用
**处理**：自动降级到 L1 缓存，记录降级事件

### 热点数据

**场景**：某个缓存键访问量极高
**处理**：L1 缓存本地存储，减少 L2 访问

### 大键值

**场景**：缓存值过大（> 1MB）
**处理**：记录警告日志，建议拆分或压缩

## 范围外

以下功能不在本次实现范围内：

- ❌ Redis Cluster 支持（Phase 2）
- ❌ ElastiCache / Azure Cache for Redis 支持（Phase 2）
- ❌ Feature Flag 控制缓存开关（Phase 2）
- ❌ 缓存预热自动化（Phase 2）
- ❌ 分布式锁（Phase 2）
- ❌ 二级缓存同步机制（Phase 2）

## 测试策略

### 单元测试（70%）

**领域层测试**：
- TTL 抖动计算逻辑
- In-flight request 管理逻辑
- 缓存键构建逻辑

**应用层测试**：
- 双层缓存读写逻辑
- 装饰器功能测试
- 降级逻辑测试

**基础设施层测试**：
- LRU 缓存适配器测试
- Redis 缓存适配器测试（使用 mock）
- SCAN 命令测试
- Lua 脚本测试

### 集成测试（20%）

- 双层缓存协作测试
- Redis 连接和重连测试
- 缓存失效和批量删除测试
- 监控端点集成测试

### E2E 测试（10%）

- 使用装饰器的 API 端到端测试
- 缓存命中/未命中场景测试
- Redis 故障降级场景测试

### 性能测试

```bash
# 缓存命中率测试
- L1 命中率 > 80%
- L2 命中率 > 90%
- 总体命中率 > 95%

# 响应时间测试
- L1 响应时间 < 1ms
- L2 响应时间 < 10ms
- 数据库查询 > 100ms

# 并发测试
- 1000 并发请求下缓存系统稳定
- In-flight request 合并率 > 99%
```

### 测试覆盖率目标

- 领域层：> 95%
- 应用层：> 90%
- 基础设施层：> 85%
- 总体：> 85%

---

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|:---|:---:|:---:|:---|
| Redis 连接不稳定 | 高 | 中 | 自动降级到 L1、重连机制、熔断器 |
| TTL 抖动导致数据不一致 | 中 | 低 | 接受短暂不一致、主动失效机制 |
| L1 缓存内存占用过高 | 中 | 中 | 限制 L1 大小、监控内存使用 |
| 装饰器性能开销 | 低 | 低 | 性能测试验证、按需使用 |
| In-flight request 内存泄漏 | 高 | 低 | finally 清理、超时自动清理 |

### 回滚计划

1. **Phase 1 回滚**：保留现有 CacheService，新增 TwoLayerCacheService 可通过配置切换
2. **配置开关**：`CACHE_TWO_LAYER_ENABLED=false` 回退到单层缓存
3. **监控告警**：缓存降级事件触发告警，及时发现问题

---

## 依赖关系

### 内部依赖

- `lru-cache`: L1 本地缓存实现
- `ioredis`: Redis 客户端
- `@nestjs/common`: 装饰器支持
- `@oksai/logger`: 日志记录
- `@oksai/config`: 配置管理

### 外部依赖

- Redis 服务：L2 分布式缓存
- 监控系统：缓存统计和告警

## 实现计划

### Phase 1: 核心基础设施（3-4 天）

- [ ] 实现 TTL 抖动服务（`TTLJitterService`）
- [ ] 实现增强版 LRUCacheService（支持 in-flight request）
- [ ] 实现增强版 RedisCacheService（SCAN 命令、Lua 脚本）
- [ ] 实现双层缓存服务（`TwoLayerCacheService`）
- [ ] 编写单元测试

### Phase 2: 装饰器和 API（2-3 天）

- [ ] 实现 `@CachedResponse` 装饰器
- [ ] 实现 `@CacheInvalidate` 装饰器
- [ ] 更新缓存监控 API（支持 L1/L2 统计）
- [ ] 重构现有缓存使用为装饰器模式
- [ ] 编写集成测试

### Phase 3: 迁移和优化（2-3 天）

- [ ] 迁移现有服务到 TwoLayerCacheService
- [ ] 添加缓存预热功能
- [ ] 性能测试和优化
- [ ] 文档编写

### Phase 4: 高级功能（未来）

- [ ] Redis Cluster 支持
- [ ] Feature Flag 集成
- [ ] 分布式锁
- [ ] 二级缓存同步机制

## 成功指标

### 性能指标

- ✅ L1 缓存命中率 > 80%
- ✅ L2 缓存命中率 > 90%
- ✅ 总体缓存命中率 > 95%
- ✅ L1 响应时间 < 1ms
- ✅ L2 响应时间 < 10ms
- ✅ In-flight request 合并率 > 99%

### 可靠性指标

- ✅ Redis 故障时自动降级成功率 100%
- ✅ 缓存系统可用性 > 99.9%
- ✅ 零缓存雪崩事件
- ✅ 零缓存穿透事件

### 开发体验指标

- ✅ 装饰器使用代码量减少 60%
- ✅ 测试覆盖率 > 85%
- ✅ 所有公共 API 都有 TSDoc 注释

## 参考资料

- [Novu 缓存架构源码](/home/arligle/forks/novu/libs/application-generic/src/services/cache/)
- [lru-cache 文档](https://github.com/isaacs/node-lru-cache)
- [ioredis 文档](https://github.com/luin/ioredis)
- [Redis SCAN 命令](https://redis.io/commands/scan/)
- [开发工作流程](./workflow.md)
- [测试计划](./testing.md)
