# Redis 缓存集成指南

## 概述

oksai.cc 认证系统支持两种缓存模式：

1. **内存缓存（默认）**：适用于单实例部署
2. **Redis 缓存**：适用于分布式部署，生产环境推荐

## 功能特性

### Redis 缓存服务

- ✅ 分布式缓存支持
- ✅ 自动降级到内存缓存（Redis 不可用时）
- ✅ 连接池管理
- ✅ 自动重连
- ✅ 缓存统计和监控

### 缓存类型

| 缓存类型 | 使用场景 | 特点 |
|:---|:---|:---|
| **CacheService** | 简单场景、单实例 | 同步 API、内存存储 |
| **RedisCacheService** | 分布式场景、生产环境 | 异步 API、Redis 存储、自动降级 |

## 配置

### 环境变量

```bash
# Redis 配置
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

### Docker Compose

Redis 已在 `docker/docker-compose.yml` 中配置：

```yaml
redis:
  image: redis:7-alpine
  container_name: oksai-redis
  ports:
    - '6379:6379'
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
```

启动 Redis：

```bash
pnpm docker:up
```

### 模块配置

```typescript
// app.module.ts
import { CacheModule } from "./common/cache.module";

@Module({
  imports: [
    CacheModule.forRoot({
      redisEnabled: process.env.REDIS_ENABLED === "true",
      redisUrl: process.env.REDIS_URL,
      max: 10000,         // 最大缓存数量
      ttl: 60000,         // 默认 TTL（毫秒）
      enableStats: true,  // 启用统计
    }),
  ],
})
export class AppModule {}
```

## 使用示例

### 1. 使用同步缓存（CacheService）

```typescript
import { CacheService } from "./common/cache.service";

@Injectable()
export class MyService {
  constructor(private readonly cacheService: CacheService) {}

  getData(key: string) {
    // 获取缓存
    const cached = this.cacheService.get(key);
    
    if (cached) {
      return cached;
    }

    // 设置缓存
    const data = await this.fetchData(key);
    this.cacheService.set(key, data, 60000); // 60 秒
    
    return data;
  }
}
```

### 2. 使用 Redis 缓存（RedisCacheService）

```typescript
import { RedisCacheService } from "./common/redis-cache.service";

@Injectable()
export class OAuthService {
  constructor(private readonly cacheService: RedisCacheService) {}

  async validateToken(token: string) {
    const cacheKey = `oauth:token:${token}`;
    
    // 获取或设置缓存
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 缓存未命中时的工厂函数
        return await this.fetchTokenFromDatabase(token);
      },
      300000 // 5 分钟 TTL
    );
  }
}
```

## 监控

### 缓存统计 API

```bash
# 获取缓存统计
GET /monitor/cache/stats

# 响应示例
{
  "hits": 1000,
  "misses": 100,
  "hitRate": 90.91,
  "size": 50
}
```

### 健康检查 API

```bash
# 获取缓存健康状态
GET /monitor/cache/health

# 响应示例
{
  "status": "healthy",
  "stats": { ... },
  "performance": {
    "hitRate": "90.91%",
    "recommendation": "缓存性能良好"
  }
}
```

### 健康状态评级

| 状态 | 命中率 | 说明 |
|:---|:---:|:---|
| **healthy** | ≥ 80% | 缓存性能良好 |
| **warning** | 50-80% | 建议检查缓存配置 |
| **critical** | < 50% | 需要优化缓存策略 |

## 性能优化建议

### 1. TTL 配置

根据数据特性设置合理的 TTL：

```typescript
// 访问令牌：5 分钟
await redisCache.set(key, data, 300000);

// 用户信息：1 小时
await redisCache.set(key, userData, 3600000);

// 配置数据：1 天
await redisCache.set(key, config, 86400000);
```

### 2. 缓存键命名规范

使用有层次的前缀：

```typescript
// ✅ 好的命名
oauth:token:{token}
oauth:client:{clientId}
user:profile:{userId}
cache:config:app

// ❌ 避免
token_{token}
{clientId}_client
```

### 3. 批量删除

使用前缀批量删除相关缓存：

```typescript
// 删除用户相关的所有缓存
await redisCache.deleteByPrefix(`user:${userId}:`);
```

## 故障排查

### Redis 连接失败

**症状：** 日志显示 "Redis 连接失败，使用内存缓存"

**解决方案：**

1. 检查 Redis 是否启动：
   ```bash
   docker ps | grep redis
   ```

2. 测试 Redis 连接：
   ```bash
   redis-cli ping
   ```

3. 检查环境变量：
   ```bash
   echo $REDIS_URL
   echo $REDIS_ENABLED
   ```

### 缓存命中率低

**症状：** 命中率 < 50%

**解决方案：**

1. 增加 TTL 时间
2. 增加缓存容量
3. 检查缓存键的唯一性
4. 查看缓存统计：
   ```bash
   curl http://localhost:3000/monitor/cache/stats
   ```

## 生产环境建议

### 1. 启用 Redis

```bash
# .env.production
REDIS_ENABLED=true
REDIS_URL=redis://production-redis:6379
```

### 2. Redis 高可用

使用 Redis Sentinel 或 Redis Cluster：

```bash
# Redis Sentinel
REDIS_URL=sentinel://host1:26379,host2:26379,host3:26379/mymaster

# Redis Cluster
REDIS_URL=redis://host1:6379,host2:6379,host3:6379
```

### 3. 监控指标

关键指标：
- 缓存命中率（目标：> 80%）
- 平均查询时间（目标：< 1ms）
- 内存使用量
- Redis 连接数

### 4. 备份策略

定期备份 Redis 数据：

```bash
# RDB 快照
redis-cli BGSAVE

# AOF 日志
appendonly yes
```

## 迁移指南

### 从内存缓存迁移到 Redis

1. **启用 Redis**：
   ```bash
   # .env.local
   REDIS_ENABLED=true
   REDIS_URL=redis://localhost:6379
   ```

2. **重启应用**：
   ```bash
   pnpm dev
   ```

3. **验证连接**：
   ```bash
   # 查看日志
   # 应该看到: "Redis 缓存服务已连接"

   # 测试缓存
   curl http://localhost:3000/monitor/cache/health
   ```

4. **监控性能**：
   ```bash
   # 观察缓存命中率
   curl http://localhost:3000/monitor/cache/stats
   ```

## 相关文档

- [缓存性能测试](./oauth-performance.spec.ts)
- [Redis 缓存服务](./redis-cache.service.ts)
- [缓存监控控制器](./cache-monitor.controller.ts)
