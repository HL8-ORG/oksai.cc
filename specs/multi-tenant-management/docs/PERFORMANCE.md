# 多租户管理性能优化指南

## 概述

本文档提供多租户系统的性能优化建议，包括数据库索引、查询优化、缓存策略等。

---

## 1. 数据库索引优化

### 1.1 必需索引

所有包含 `tenantId` 的表都应该创建索引：

```sql
-- 用户表
CREATE INDEX idx_user_tenant_id ON "user"(tenant_id);

-- 组织表
CREATE INDEX idx_organization_tenant_id ON organization(tenant_id);

-- Webhook 表
CREATE INDEX idx_webhook_tenant_id ON webhook(tenant_id);

-- 会话表
CREATE INDEX idx_session_tenant_id ON session(tenant_id);

-- 其他租户相关表
CREATE INDEX idx_account_tenant_id ON account(tenant_id);
CREATE INDEX idx_api_key_tenant_id ON api_key(tenant_id);
CREATE INDEX idx_oauth_access_token_tenant_id ON oauth_access_token(tenant_id);
CREATE INDEX idx_oauth_refresh_token_tenant_id ON oauth_refresh_token(tenant_id);
CREATE INDEX idx_oauth_authorization_code_tenant_id ON oauth_authorization_code(tenant_id);
CREATE INDEX idx_webhook_delivery_tenant_id ON webhook_delivery(tenant_id);
```

### 1.2 复合索引

为常用查询创建复合索引：

```sql
-- 租户 + 状态（用于列表查询）
CREATE INDEX idx_user_tenant_status ON "user"(tenant_id, email_verified);

-- 租户 + 创建时间（用于时间范围查询）
CREATE INDEX idx_organization_tenant_created ON organization(tenant_id, created_at DESC);

-- 租户 + 过期时间（用于会话清理）
CREATE INDEX idx_session_tenant_expires ON session(tenant_id, expires_at);

-- 租户 + 活跃状态（用于 Webhook 查询）
CREATE INDEX idx_webhook_tenant_active ON webhook(tenant_id, active);
```

### 1.3 唯一索引

确保租户级别的唯一性：

```sql
-- 租户内 slug 唯一
CREATE UNIQUE INDEX idx_tenant_slug_unique ON tenant(slug);

-- 租户内邮箱唯一（如果需要）
CREATE UNIQUE INDEX idx_user_tenant_email ON "user"(tenant_id, email);
```

---

## 2. 查询优化

### 2.1 使用 MikroORM Filter

确保所有查询都使用 `TenantFilter`：

```typescript
// ✅ 正确：自动应用租户过滤
const users = await em.find(User, { emailVerified: true });

// 生成的 SQL：
// SELECT * FROM "user" WHERE tenant_id = $1 AND email_verified = $2
```

### 2.2 避免禁用过滤器

除非必要，不要禁用 `TenantFilter`：

```typescript
// ❌ 避免：禁用过滤器（仅超级管理员使用）
const allUsers = await em.find(
  User,
  {},
  {
    filters: { tenant: false },
  },
);

// ✅ 正确：使用带租户过滤的查询
const tenantUsers = await em.find(User, {});
```

### 2.3 批量操作

使用批量操作减少数据库往返：

```typescript
// ❌ 避免：循环插入
for (const user of users) {
  await em.persist(user);
}
await em.flush();

// ✅ 正确：批量插入
em.persist(users);
await em.flush();
```

### 2.4 分页优化

使用游标分页替代偏移分页（大数据集）：

```typescript
// ✅ 游标分页（性能更好）
const users = await em.find(
  User,
  {
    tenantId,
    createdAt: { $lt: cursor },
  },
  {
    limit: 20,
    orderBy: { createdAt: 'DESC' },
  },
);

// 偏移分页（简单但性能较差）
const [users, total] = await em.findAndCount(
  User,
  { tenantId },
  {
    limit: 20,
    offset: (page - 1) * 20,
  },
);
```

### 2.5 选择字段

只查询需要的字段：

```typescript
// ❌ 避免：查询所有字段
const users = await em.find(User, { tenantId });

// ✅ 正确：只查询需要的字段
const users = await em.find(
  User,
  { tenantId },
  {
    fields: ['id', 'email', 'name'],
  },
);
```

---

## 3. 缓存策略

### 3.1 租户配置缓存

租户配置不经常变化，适合缓存：

```typescript
@Injectable()
export class TenantSettingsCacheService {
  private cache = new Map<
    string,
    { settings: TenantSettings; expireAt: number }
  >();
  private readonly TTL = 5 * 60 * 1000; // 5 分钟

  async getSettings(tenantId: string): Promise<TenantSettings> {
    // 1. 检查缓存
    const cached = this.cache.get(tenantId);
    if (cached && cached.expireAt > Date.now()) {
      return cached.settings;
    }

    // 2. 从数据库加载
    const settings = await this.settingsService.getSettings(tenantId);

    // 3. 写入缓存
    this.cache.set(tenantId, {
      settings,
      expireAt: Date.now() + this.TTL,
    });

    return settings;
  }

  // 更新时清除缓存
  async invalidate(tenantId: string): Promise<void> {
    this.cache.delete(tenantId);
  }
}
```

### 3.2 统计数据缓存

统计数据计算成本高，适合缓存：

```typescript
@Injectable()
export class TenantStatsCacheService {
  private cache = new Map<
    string,
    { stats: TenantStatsOverview; expireAt: number }
  >();
  private readonly TTL = 10 * 60 * 1000; // 10 分钟

  async getOverview(tenantId: string): Promise<TenantStatsOverview> {
    const cached = this.cache.get(tenantId);
    if (cached && cached.expireAt > Date.now()) {
      return cached.stats;
    }

    const stats = await this.statsService.getOverview(tenantId);

    this.cache.set(tenantId, {
      stats,
      expireAt: Date.now() + this.TTL,
    });

    return stats;
  }
}
```

### 3.3 使用 Redis（生产环境）

生产环境建议使用 Redis 替代内存缓存：

```typescript
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class TenantCacheService {
  constructor(private readonly redis: Redis) {}

  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    const key = `tenant:${tenantId}:settings`;
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const settings = await this.settingsService.getSettings(tenantId);
    await this.redis.setex(key, 300, JSON.stringify(settings)); // 5 分钟 TTL

    return settings;
  }

  async invalidate(tenantId: string): Promise<void> {
    const key = `tenant:${tenantId}:settings`;
    await this.redis.del(key);
  }
}
```

---

## 4. 租户中间件优化

### 4.1 租户信息缓存

避免每次请求都查询数据库：

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private cache = new Map<string, { tenant: Tenant; expireAt: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 分钟

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = await this.extractTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('缺少租户标识');
    }

    // 1. 检查缓存
    let tenantInfo = this.cache.get(tenantId);

    if (!tenantInfo || tenantInfo.expireAt < Date.now()) {
      // 2. 从数据库加载
      const tenant = await this.tenantService.getById(tenantId);

      tenantInfo = {
        tenant,
        expireAt: Date.now() + this.TTL,
      };

      this.cache.set(tenantId, tenantInfo);
    }

    // 3. 验证租户状态
    if (!tenantInfo.tenant.isActive()) {
      throw new ForbiddenException('租户已停用');
    }

    // 4. 注入上下文
    const context = TenantContext.create({
      tenantId,
      userId: req.user?.id,
      correlationId: this.generateCorrelationId(),
    });

    this.tenantContext.run(context, () => next());
  }
}
```

---

## 5. 监控和分析

### 5.1 慢查询监控

启用 MikroORM 查询日志：

```typescript
// mikro-orm.config.ts
export default {
  debug: process.env.NODE_ENV === 'development',
  logger: (query: string) => {
    if (query.includes('tenant_id')) {
      console.log('[Query]', query);
    }
  },
};
```

### 5.2 性能指标

监控关键指标：

```typescript
@Injectable()
export class TenantPerformanceMonitor {
  private metrics = new Map<string, number[]>();

  recordQueryTime(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    this.metrics.get(operation)!.push(duration);
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return 0;

    return times.reduce((sum, t) => sum + t, 0) / times.length;
  }

  getSlowQueries(threshold = 1000): string[] {
    const slowQueries: string[] = [];

    for (const [operation, times] of this.metrics.entries()) {
      const avgTime = this.getAverageTime(operation);
      if (avgTime > threshold) {
        slowQueries.push(`${operation}: ${avgTime}ms`);
      }
    }

    return slowQueries;
  }
}
```

---

## 6. 数据库连接池优化

### 6.1 连接池配置

```typescript
// mikro-orm.config.ts
export default {
  pool: {
    min: 5,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
};
```

### 6.2 租户隔离

确保每个租户使用独立的连接（如果需要）：

```typescript
// 对于高安全性场景，可以为每个租户创建独立的连接池
const tenantPools = new Map<string, EntityManager>();

async function getTenantEntityManager(
  tenantId: string,
): Promise<EntityManager> {
  if (!tenantPools.has(tenantId)) {
    const orm = await MikroORM.init({
      // 租户特定配置
    });
    tenantPools.set(tenantId, orm.em);
  }

  return tenantPools.get(tenantId)!;
}
```

---

## 7. 性能测试

### 7.1 基准测试

```typescript
describe('Tenant Performance', () => {
  it('should filter queries efficiently', async () => {
    const start = Date.now();

    // 执行查询
    const users = await em.find(User, { tenantId: 'tenant-123' });

    const duration = Date.now() - start;

    // 验证性能
    expect(duration).toBeLessThan(100); // 100ms 以内
  });

  it('should handle concurrent requests', async () => {
    const requests = Array(100)
      .fill(null)
      .map(() => em.find(User, { tenantId: 'tenant-123' }));

    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // 1 秒以内
  });
});
```

### 7.2 负载测试

使用工具（如 k6、Artillery）进行负载测试：

```javascript
// k6 script
import http from 'k6/http';

export default function () {
  const res = http.get('https://api.oksai.cc/api/organizations', {
    headers: {
      Authorization: `Bearer ${__ENV.TOKEN}`,
      'X-Tenant-ID': 'tenant-123',
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

---

## 8. 优化检查清单

### 8.1 数据库层面

- [ ] 所有 `tenantId` 列都有索引
- [ ] 常用查询有复合索引
- [ ] 唯一约束正确设置
- [ ] 定期执行 `ANALYZE` 更新统计信息

### 8.2 查询层面

- [ ] 所有查询都使用 `TenantFilter`
- [ ] 避免禁用过滤器
- [ ] 使用批量操作
- [ ] 只查询需要的字段
- [ ] 分页查询优化

### 8.3 缓存层面

- [ ] 租户配置已缓存
- [ ] 统计数据已缓存
- [ ] 缓存失效策略正确
- [ ] 生产环境使用 Redis

### 8.4 应用层面

- [ ] 租户中间件有缓存
- [ ] 连接池配置正确
- [ ] 监控指标已收集
- [ ] 性能测试通过

---

## 9. 常见性能问题

### 9.1 查询慢

**问题**：租户查询慢

**原因**：

1. 缺少索引
2. 查询所有字段
3. 未使用过滤器

**解决方案**：

```sql
-- 添加索引
CREATE INDEX idx_user_tenant_email ON "user"(tenant_id, email);

-- 只查询需要的字段
SELECT id, email, name FROM "user" WHERE tenant_id = $1;
```

### 9.2 连接池耗尽

**问题**：数据库连接池耗尽

**原因**：

1. 连接池配置过小
2. 查询执行时间过长
3. 连接泄漏

**解决方案**：

```typescript
// 增加连接池大小
pool: {
  min: 10,
  max: 50
}

// 检查连接泄漏
em.getConnection().checkLeaks();
```

### 9.3 缓存失效

**问题**：缓存命中率低

**原因**：

1. TTL 设置过短
2. 缓存键设计不合理
3. 频繁更新

**解决方案**：

```typescript
// 增加 TTL
private readonly TTL = 10 * 60 * 1000; // 10 分钟

// 优化缓存键
const key = `tenant:${tenantId}:settings:v2`;
```

---

## 10. 最佳实践总结

1. **索引优先**：所有 `tenantId` 列必须有索引
2. **使用过滤器**：让 MikroORM 自动处理租户过滤
3. **合理缓存**：缓存不经常变化的数据
4. **批量操作**：减少数据库往返
5. **监控性能**：定期检查慢查询
6. **负载测试**：在生产前进行性能测试
7. **连接池**：根据负载调整连接池大小
8. **定期维护**：定期执行数据库维护任务

---

**文档版本**: v1.0  
**最后更新**: 2026-03-08  
**维护者**: oksai.cc 团队
