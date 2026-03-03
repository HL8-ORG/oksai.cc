# CacheService 使用指南

## 概述

`CacheService` 是基于 LRU (Least Recently Used) 算法的内存缓存服务，用于提升应用性能。

## 配置

CacheModule 默认配置：
- **max**: 10,000 个缓存条目
- **ttl**: 60 秒
- **enableStats**: true

### 自定义配置

```typescript
import { CacheModule } from './common/cache.module';

@Module({
  imports: [
    CacheModule.forRoot({
      max: 5000,      // 最大 5000 个缓存条目
      ttl: 120000,    // 默认 TTL: 2 分钟
      enableStats: true,
    }),
  ],
})
export class AppModule {}
```

## 基本使用

### 1. 注入 CacheService

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache.service';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: CacheService) {}
}
```

### 2. 设置和获取缓存

```typescript
// 设置缓存（使用默认 TTL）
this.cacheService.set('user:123', userData);

// 设置缓存（自定义 TTL：5 分钟）
this.cacheService.set('user:123', userData, 300000);

// 获取缓存
const cachedUser = this.cacheService.get<User>('user:123');
if (cachedUser) {
  return cachedUser;
}
```

### 3. 获取或设置缓存（推荐）

```typescript
// 如果缓存存在则返回，否则调用 factory 获取数据并缓存
const user = await this.cacheService.getOrSet(
  `user:${userId}`,
  async () => {
    // 缓存不存在时从数据库查询
    return await this.userRepository.findById(userId);
  },
  300000 // TTL: 5 分钟
);
```

### 4. 删除缓存

```typescript
// 删除单个缓存
this.cacheService.delete('user:123');

// 删除指定前缀的所有缓存
this.cacheService.deleteByPrefix('user:'); // 删除所有 user:* 的缓存

// 清空所有缓存
this.cacheService.clear();
```

### 5. 缓存状态查询

```typescript
// 检查缓存是否存在
const exists = this.cacheService.has('user:123');

// 获取缓存数量
const size = this.cacheService.size();

// 获取缓存统计信息
const stats = this.cacheService.getStats();
console.log(`命中率: ${stats.hitRate}%`);
console.log(`命中: ${stats.hits}, 未命中: ${stats.misses}`);
console.log(`缓存大小: ${stats.size}`);
```

## 最佳实践

### 1. 缓存键命名规范

使用清晰的前缀和分隔符：

```typescript
// ✅ 推荐
'user:123'              // 用户缓存
'session:list:user:123' // 用户的 Session 列表
'session:config:user:123' // 用户的 Session 配置

// ❌ 不推荐
'u123'                  // 不清晰
'user_123_data'         // 分隔符不一致
```

### 2. TTL 选择

根据数据变化频率选择合适的 TTL：

- **静态数据**（配置、字典）：5-10 分钟
- **用户数据**（个人资料）：1-5 分钟
- **实时数据**（在线状态）：30-60 秒
- **高频查询**（Session 列表）：1-2 分钟

### 3. 缓存失效

数据更新时及时清除缓存：

```typescript
async updateUser(userId: string, data: UpdateUserDto) {
  // 更新数据库
  await this.userRepository.update(userId, data);
  
  // 清除缓存
  this.cacheService.delete(`user:${userId}`);
  
  // 或清除所有相关缓存
  this.cacheService.deleteByPrefix(`user:${userId}:`);
}
```

### 4. 错误处理

缓存失败不应该影响业务逻辑：

```typescript
async getUser(userId: string) {
  try {
    // 尝试从缓存获取
    const cached = this.cacheService.get<User>(`user:${userId}`);
    if (cached) return cached;
  } catch (error) {
    // 缓存失败，记录日志但不影响查询
    console.error('Cache error:', error);
  }
  
  // 从数据库查询
  const user = await this.userRepository.findById(userId);
  
  // 尝试写入缓存
  try {
    this.cacheService.set(`user:${userId}`, user, 300000);
  } catch (error) {
    console.error('Cache set error:', error);
  }
  
  return user;
}
```

## 性能优化建议

1. **合理设置容量**：避免缓存占用过多内存
2. **监控命中率**：定期检查 `getStats()`，优化缓存策略
3. **批量操作**：使用 `deleteByPrefix()` 批量删除相关缓存
4. **避免大对象**：不要缓存过大的数据对象
5. **缓存预热**：应用启动时预热常用数据

## 示例：SessionService 缓存集成

```typescript
@Injectable()
export class SessionService {
  private static readonly CACHE_PREFIX_CONFIG = 'session:config:';
  private static readonly CACHE_TTL_CONFIG = 300000; // 5 分钟

  constructor(private readonly cacheService: CacheService) {}

  async getSessionConfig(userId: string): Promise<SessionConfigResponse> {
    const cacheKey = `${SessionService.CACHE_PREFIX_CONFIG}${userId}`;
    
    // 尝试从缓存获取
    const cached = this.cacheService.get<SessionConfigResponse>(cacheKey);
    if (cached) return cached;
    
    // 从数据库查询
    const result = await db.select()...;
    
    // 写入缓存
    this.cacheService.set(cacheKey, result, SessionService.CACHE_TTL_CONFIG);
    
    return result;
  }

  async updateSessionConfig(userId: string, dto: UpdateDto) {
    // 更新数据库
    await db.update(users)...;
    
    // 清除缓存
    this.cacheService.delete(`${SessionService.CACHE_PREFIX_CONFIG}${userId}`);
  }
}
```

## 监控和调试

### 查看缓存统计

```typescript
// 在 Controller 中暴露统计接口
@Get('cache/stats')
getCacheStats() {
  return this.cacheService.getStats();
}
```

### 重置统计

```typescript
this.cacheService.resetStats();
```

## 限制

- 仅支持内存缓存，不支持分布式
- 应用重启后缓存丢失
- 不支持缓存持久化

如需分布式缓存，考虑使用 Redis。
