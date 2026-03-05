# API Key 插件迁移计划

> **状态**: Phase 5 任务1 - 进行中 🚀  
> **开始时间**: 2026-03-04  
> **预计完成**: 2026-03-31 (4周)  
> **优先级**: P0（最高优先级）

---

## 📋 目标

将自定义 API Key 实现（128行）迁移到 Better Auth API Key 插件，获得企业级特性。

---

## ✨ Better Auth API Key 插件特性

### 已有功能（与自定义实现对比）

| 功能 | 自定义实现 | Better Auth 插件 | 提升 |
|------|-----------|-----------------|------|
| 创建/删除 API Key | ✅ | ✅ | - |
| SHA256 Hash 存储 | ✅ | ✅ | - |
| 过期时间支持 | ✅ | ✅ | - |
| 前缀支持 | ✅ | ✅ | - |
| **速率限制** | ❌ | ✅ | 🎯 新增 |
| **权限系统** | ❌ | ✅ | 🎯 新增 |
| **元数据支持** | ❌ | ✅ | 🎯 新增 |
| **Refill 机制** | ❌ | ✅ | 🎯 新增 |
| **组织级 Keys** | ❌ | ✅ | 🎯 新增 |
| **多配置支持** | ❌ | ✅ | 🎯 新增 |
| **官方维护** | ❌ | ✅ | 🎯 新增 |
| **自动清理过期 Keys** | ❌ | ✅ | 🎯 新增 |

### 插件 API

```typescript
// 创建 API Key
auth.api.createApiKey({
  body: {
    name: "My API Key",
    expiresIn: 60 * 60 * 24 * 365, // 1 年
    prefix: "oks_user",
    permissions: {
      user: ["read", "write"],
    },
    metadata: { project: "demo" },
    remaining: 1000, // 剩余次数
    refillAmount: 100, // 每次 refill 100 次
    refillInterval: 60 * 60 * 1000, // 每小时 refill
  },
});

// 验证 API Key
auth.api.verifyApiKey({
  body: {
    key: "oks_xxx",
    permissions: {
      user: ["read"],
    },
  },
});

// 列出 API Keys
auth.api.listApiKeys({
  query: {
    limit: 100,
    sortBy: "createdAt",
    sortDirection: "desc",
  },
});

// 删除 API Key
auth.api.deleteApiKey({
  body: {
    keyId: "xxx",
  },
});

// 更新 API Key
auth.api.updateApiKey({
  body: {
    keyId: "xxx",
    name: "New Name",
    enabled: true,
  },
});
```

---

## 🗓️ 迁移时间表（4周）

### Week 1: 准备工作（2026-03-04 - 2026-03-10）

**目标**: 安装配置插件，编写迁移脚本

- [x] Day 1-2: 安装 `@better-auth/api-key` 插件 ✅
- [ ] Day 3-4: 配置 Better Auth API Key 插件
  - [ ] 在 `auth.config.ts` 中添加插件配置
  - [ ] 配置多配置支持（user / organization）
  - [ ] 配置权限系统
- [ ] Day 5: 生成数据库 Schema
  - [ ] 运行 `pnpm db:generate` 生成迁移
  - [ ] 审查生成的 Schema
  - [ ] 在测试环境运行迁移

### Week 2: 开发与测试（2026-03-11 - 2026-03-17）

**目标**: 更新 Controller 和 Guard

- [ ] Day 1-2: 更新 API Key Controller
  - [ ] 使用 Better Auth API 替代 `api-key.service.ts`
  - [ ] 更新 POST /api-keys 端点
  - [ ] 更新 GET /api-keys 端点
  - [ ] 更新 DELETE /api-keys/:id 端点
  - [ ] 添加新端点（GET /api-keys/:id, PUT /api-keys/:id）
- [ ] Day 3-4: 更新 API Key Guard
  - [ ] 使用 Better Auth API 验证
  - [ ] 支持权限检查
  - [ ] 支持速率限制
- [ ] Day 5: 编写测试
  - [ ] Controller 单元测试
  - [ ] Guard 单元测试
  - [ ] 集成测试

### Week 3: 数据迁移（2026-03-18 - 2026-03-24）

**目标**: 迁移现有 API Keys

- [ ] Day 1-2: 准备数据迁移脚本
  - [ ] 查询所有现有 API Keys
  - [ ] 为每个用户生成新的 API Key
  - [ ] 保存映射关系（旧 ID → 新 Key）
- [ ] Day 3-4: 执行数据迁移
  - [ ] 备份数据库
  - [ ] 在测试环境测试迁移脚本
  - [ ] 在生产环境执行迁移（灰度发布）
- [ ] Day 5: 用户通知
  - [ ] 发送邮件通知用户
  - [ ] 提供迁移指南文档
  - [ ] 设置过渡期（2周）

### Week 4: 上线与验证（2026-03-25 - 2026-03-31）

**目标**: 灰度发布并监控

- [ ] Day 1-2: 灰度发布（10% 流量）
  - [ ] 监控错误率
  - [ ] 收集用户反馈
  - [ ] 检查性能指标
- [ ] Day 3-4: 逐步扩大（50% → 100%）
  - [ ] 继续监控
  - [ ] 修复发现的问题
- [ ] Day 5: 最终验证和文档
  - [ ] 确认所有用户已迁移
  - [ ] 更新 API 文档
  - [ ] 清理旧代码（保留回滚方案）
  - [ ] 发布迁移总结报告

---

## 📊 当前代码分析

### 待迁移文件

1. **`apps/gateway/src/auth/api-key.service.ts`** (128 行)
   - ❌ 完全替换，使用 Better Auth API

2. **`apps/gateway/src/auth/api-key.controller.ts`** (93 行)
   - ⚠️ 部分更新，调用 Better Auth API

3. **`apps/gateway/src/auth/api-key.guard.ts`** (137 行)
   - ⚠️ 部分更新，使用 Better Auth API 验证

### 数据库 Schema 变更

**当前 Schema**:
```sql
-- api_keys 表
id UUID PRIMARY KEY,
user_id TEXT NOT NULL,
team_id TEXT,
name TEXT,
hashed_key TEXT NOT NULL UNIQUE,
prefix TEXT NOT NULL,
expires_at TIMESTAMP,
last_used_at TIMESTAMP,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
revoked_at TIMESTAMP
```

**Better Auth Schema**:
```sql
-- api_key 表（Better Auth 自动生成）
id TEXT PRIMARY KEY,
name TEXT,
start TEXT, -- 前缀
prefix TEXT,
key TEXT, -- Hash 后的 key
userId TEXT,
organizationId TEXT,
createdAt TIMESTAMP,
expiresAt TIMESTAMP,
remaining INTEGER,
refillAmount INTEGER,
refillInterval INTEGER,
lastRefillAt TIMESTAMP,
rateLimitEnabled BOOLEAN,
rateLimitTimeWindow INTEGER,
rateLimitMax INTEGER,
enabled BOOLEAN,
metadata TEXT, -- JSON
permissions TEXT -- JSON
```

**迁移策略**:
- ⚠️ **无法直接迁移 Hash**: Better Auth 使用不同的 Hash 算法
- ✅ **必须重新生成**: 为每个用户生成新的 API Key
- ✅ **用户通知**: 邮件通知用户新的 API Key

---

## ⚠️ 迁移风险与应对

### 风险 1: API Key 无法迁移（高概率）

**影响**: 高  
**概率**: 高（100%）

**应对措施**:
1. ✅ **提前通知**: 2周前发布公告和邮件
2. ✅ **过渡期**: 保留旧 API Key 2周（并行运行）
3. ✅ **一键重新生成**: 提供简单的重新生成流程
4. ✅ **自动发送**: 生成新 Key 后自动发送到邮箱

**迁移流程**:
```typescript
// scripts/migrate-api-keys.ts
for (const user of users) {
  // 1. 查询用户的所有旧 API Keys
  const oldKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id));

  // 2. 为每个旧 Key 生成新的 Better Auth API Key
  for (const oldKey of oldKeys) {
    const newKey = await auth.api.createApiKey({
      body: {
        userId: user.id,
        name: oldKey.name || "Migrated Key",
        expiresIn: oldKey.expiresAt
          ? Math.floor((oldKey.expiresAt.getTime() - Date.now()) / 1000)
          : undefined,
      },
    });

    // 3. 发送邮件通知用户新 Key
    await sendEmail({
      to: user.email,
      subject: "您的 API Key 已迁移",
      body: `
        您的 API Key "${oldKey.name}" 已迁移到新系统。
        
        新的 API Key: ${newKey.key}
        
        请妥善保存，此 Key 仅显示一次。
        
        旧的 API Key 将在 2 周后失效（2026-04-07）。
      `,
    });
  }

  // 4. 标记旧 Key 为已迁移
  await db.update(apiKeys).set({ migrated: true }).where(eq(apiKeys.userId, user.id));
}
```

### 风险 2: 权限系统不兼容（中概率）

**影响**: 中  
**概率**: 中

**应对措施**:
1. ✅ **权限映射**: 定义旧权限 → Better Auth 权限的映射
2. ✅ **默认权限**: 为所有迁移的 Key 设置默认权限
3. ✅ **手动调整**: 用户可在设置页面手动调整权限

### 风险 3: 性能下降（低概率）

**影响**: 中  
**概率**: 低

**应对措施**:
1. ✅ **性能测试**: 迁移前进行性能测试
2. ✅ **缓存优化**: Better Auth 支持缓存，性能应该更好
3. ✅ **监控指标**: 监控 API Key 验证的响应时间

---

## ✅ 验收标准

### 功能验收

- [ ] 可以创建 API Key（支持过期时间、名称、权限）
- [ ] 可以列出 API Keys（支持分页、排序）
- [ ] 可以获取单个 API Key 详情
- [ ] 可以更新 API Key（名称、权限）
- [ ] 可以删除 API Key
- [ ] API Key 验证正常（Guard）
- [ ] 速率限制生效
- [ ] 权限检查生效

### 性能验收

- [ ] API Key 验证 < 10ms（P95）
- [ ] 创建 API Key < 50ms（P95）
- [ ] 并发 1000 req/s 无错误

### 迁移验收

- [ ] 所有用户已收到通知
- [ ] 80%+ 用户已重新生成 API Key
- [ ] 旧 API Key 已失效（过渡期后）
- [ ] 无数据丢失

### 文档验收

- [ ] API 文档已更新
- [ ] 迁移指南已发布
- [ ] 用户手册已更新

---

## 📚 参考资料

- [Better Auth API Key 插件文档](https://better-auth.com/docs/plugins/api-key)
- [Better Auth API Key 高级特性](https://better-auth.com/docs/plugins/api-key/advanced)
- [Better Auth API Key 参考](https://better-auth.com/docs/plugins/api-key/reference)
- [docs/auth-optimization-plan.md](./auth-optimization-plan.md)

---

## 📝 更新历史

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2026-03-04 | v1.0 | 创建迁移计划 | AI Assistant |

---

**下一步**: Week 1 Day 3-4 - 配置 Better Auth API Key 插件
