# MikroORM 迁移剩余工作计划

**创建日期**: 2026-03-05  
**负责人**: Development Team  
**状态**: 📋 规划中  
**优先级**: 🔴 高  
**风险等级**: 🔴 高风险

---

## 📊 执行摘要

### 当前状态

```
✅ 已完成:
  - MikroORM Entity 定义 (12 个)
  - Event Store 实现
  - Repository 基类
  - libs/oauth 库迁移

❌ 未完成:
  - apps/gateway 所有 Service 层 (8 个文件, ~2500 行)
  - 数据库模块配置
  - 测试迁移
```

### 工作量估算

| 任务 | 文件数 | 代码行数 | 预计时间 | 优先级 |
|------|-------|---------|---------|--------|
| **Phase 1: 核心迁移** | 3 | ~1,200 | 3-4 天 | P0 |
| **Phase 2: 辅助迁移** | 3 | ~800 | 2-3 天 | P1 |
| **Phase 3: 配置迁移** | 2 | ~100 | 1 天 | P1 |
| **Phase 4: 测试验证** | 8 | ~500 | 2-3 天 | P0 |
| **Phase 5: 清理文档** | - | - | 1 天 | P2 |
| **总计** | **16** | **~2,600** | **9-12 天** | - |

### 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| **功能回归** | 🔴 高 | 🟡 中 | 完整的测试覆盖 |
| **性能下降** | 🟡 中 | 🟢 低 | 性能基准测试 |
| **延期交付** | 🟡 中 | 🟡 中 | 预留 buffer 时间 |
| **数据不一致** | 🔴 高 | 🟢 低 | 事务保护 + 验证 |
| **团队不熟悉** | 🟡 中 | 🟡 中 | 代码审查 + 文档 |

---

## 📋 详细工作计划

### Phase 1: 核心功能迁移 (3-4 天)

#### 1.1 OAuthService 迁移 ⭐⭐⭐⭐⭐

**文件**: `apps/gateway/src/auth/oauth.service.ts`  
**代码行数**: 852 行  
**方法数**: 14 个  

**当前状态**:
```typescript
// 使用 Drizzle ORM
import { db, oauthClients, oauthAccessTokens, ... } from "@oksai/database";
import { eq } from "drizzle-orm";

// 典型查询
const result = await db
  .insert(oauthClients)
  .values({ ... })
  .returning();
```

**迁移目标**:
```typescript
// 使用 MikroORM
import { EntityManager } from "@mikro-orm/core";
import { OAuthClient, OAuthAccessToken, ... } from "@oksai/database";

// 典型查询
const client = this.em.create(OAuthClient, { ... });
await this.em.flush();
```

**迁移方法**:

| 方法 | 复杂度 | Drizzle 操作 | MikroORM 操作 |
|------|--------|-------------|--------------|
| `registerClient` | 🟡 中 | `db.insert()` | `em.create() + flush()` |
| `generateAuthorizationCode` | 🟡 中 | `db.insert()` | `em.create() + flush()` |
| `exchangeAccessToken` | 🔴 高 | `db.select() + db.insert()` | `em.findOne() + em.create()` |
| `refreshAccessToken` | 🔴 高 | `db.select() + db.update()` | `em.findOne() + em.assign()` |
| `validateAccessToken` | 🟢 低 | `db.select()` | `em.findOne()` |
| `revokeToken` | 🟡 中 | `db.update()` | `em.assign() + flush()` |
| `getClient` | 🟢 低 | `db.select()` | `em.findOne()` |
| `getClientByClientId` | 🟢 低 | `db.select()` | `em.findOne()` |
| `createClient` | 🟡 中 | `db.insert()` | `em.create() + flush()` |
| `listClients` | 🟢 低 | `db.select()` | `em.find()` |
| `getClientById` | 🟢 低 | `db.select()` | `em.findOne()` |
| `updateClient` | 🟡 中 | `db.update()` | `em.assign() + flush()` |
| `deleteClient` | 🟡 中 | `db.delete()` | `em.remove() + flush()` |
| `rotateClientSecret` | 🟡 中 | `db.update()` | `em.assign() + flush()` |

**迁移步骤**:

```typescript
// Step 1: 修改导入
- import { db, ... } from "@oksai/database";
- import { eq } from "drizzle-orm";
+ import { EntityManager } from "@mikro-orm/core";
+ import { OAuthClient, ... } from "@oksai/database";

// Step 2: 修改构造函数
constructor(
  private readonly cacheService: CacheService,
+ private readonly em: EntityManager  // 注入 EntityManager
) { ... }

// Step 3: 逐个方法迁移 (按复杂度从低到高)
1. getClient          (简单查询)
2. getClientByClientId
3. getClientById
4. validateAccessToken
5. listClients
6. registerClient     (插入)
7. createClient
8. deleteClient       (删除)
9. revokeToken        (更新)
10. updateClient
11. rotateClientSecret
12. generateAuthorizationCode
13. exchangeAccessToken (复杂事务)
14. refreshAccessToken
```

**预计时间**: 2 天

---

#### 1.2 SessionService 迁移 ⭐⭐⭐⭐

**文件**: `apps/gateway/src/auth/session.service.ts`  
**代码行数**: ~400 行（估算）  
**方法数**: ~10 个（估算）

**核心方法**:
- `listSessions` - 查询用户会话列表
- `revokeSession` - 撤销会话
- `revokeOtherSessions` - 撤销其他会话
- `getSessionConfig` - 获取会话配置
- `updateSessionConfig` - 更新会话配置

**迁移示例**:

```typescript
// Drizzle (Before)
async listSessions(userId: string) {
  const sessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId));
  return sessions;
}

// MikroORM (After)
async listSessions(userId: string) {
  const sessions = await this.em.find(Session, { userId });
  return sessions;
}
```

**预计时间**: 1 天

---

#### 1.3 TokenBlacklistService 迁移 ⭐⭐⭐

**文件**: `apps/gateway/src/auth/token-blacklist.service.ts`  
**代码行数**: ~300 行（估算）

**核心功能**:
- Token 黑名单管理
- 缓存 + 数据库双写

**迁移注意事项**:
- 保持缓存逻辑不变
- 只迁移数据库操作部分

**预计时间**: 0.5 天

---

### Phase 2: 辅助功能迁移 (2-3 天)

#### 2.1 WebhookService 迁移 ⭐⭐⭐

**文件**: `apps/gateway/src/auth/webhook.service.ts`  
**代码行数**: ~400 行（估算）

**核心方法**:
- `createWebhook` - 创建 Webhook
- `listWebhooks` - 列出 Webhooks
- `updateWebhook` - 更新 Webhook
- `deleteWebhook` - 删除 Webhook
- `triggerWebhook` - 触发 Webhook（复杂）

**预计时间**: 1 天

---

#### 2.2 ApiKeyService 迁移 ⭐⭐⭐

**文件**: `apps/gateway/src/auth/api-key.service.ts`  
**代码行数**: ~300 行（估算）

**核心方法**:
- `createApiKey` - 创建 API Key
- `listApiKeys` - 列出 API Keys
- `revokeApiKey` - 撤销 API Key
- `validateApiKey` - 验证 API Key

**预计时间**: 0.5 天

---

#### 2.3 ImpersonationService 迁移 ⭐⭐

**文件**: `apps/gateway/src/auth/impersonation.service.ts`  
**代码行数**: ~200 行（估算）

**核心功能**:
- 用户模拟（impersonation）管理

**预计时间**: 0.5 天

---

### Phase 3: 配置和模块迁移 (1 天)

#### 3.1 AuthModule 更新

**文件**: `apps/gateway/src/auth/auth.module.ts`

**需要修改**:

```typescript
// Before
@Module({
  imports: [CacheModule.forRoot()],
  controllers: [...],
  providers: [...],
})
export class AuthModule {}

// After
@Module({
  imports: [
    MikroOrmModule.forFeature([
      OAuthClient,
      OAuthAccessToken,
      OAuthRefreshToken,
      OAuthAuthorizationCode,
      Session,
      Webhook,
      WebhookDelivery,
      APIKey,
    ]),
    CacheModule.forRoot(),
  ],
  controllers: [...],
  providers: [...],
})
export class AuthModule {}
```

**预计时间**: 0.5 天

---

#### 3.2 DatabaseModule 更新

**文件**: `libs/database/src/mikro-orm.module.ts`

**需要添加**:
- 导出所有 MikroORM Entity
- 配置自动加载 Entity

**预计时间**: 0.5 天

---

### Phase 4: 测试迁移和验证 (2-3 天)

#### 4.1 单元测试迁移

**需要迁移的测试文件**:
```
apps/gateway/src/auth/
├── oauth.service.spec.ts           - ~500 行
├── session.service.spec.ts         - ~300 行
├── webhook.service.spec.ts         - ~300 行
├── api-key.service.spec.ts         - ~200 行
└── token-blacklist.service.spec.ts - ~200 行
```

**迁移重点**:
- 替换 `db` mock 为 `EntityManager` mock
- 更新测试数据准备方式
- 调整断言逻辑

**预计时间**: 2 天

---

#### 4.2 集成测试验证

**测试场景**:
1. OAuth 2.0 完整流程
   - 客户端注册
   - 授权码生成
   - Token 交换
   - Token 刷新
   - Token 撤销

2. Session 管理
   - 会话创建
   - 会话查询
   - 会话撤销

3. Webhook 管理
   - Webhook 创建
   - Webhook 触发
   - 交付记录

**预计时间**: 1 天

---

### Phase 5: 清理和文档 (1 天)

#### 5.1 代码清理

**需要删除**:
```bash
# 移除 Drizzle 导入
- import { db } from "@oksai/database";
- import { eq, and, or } from "drizzle-orm";

# 移除 Drizzle Schema 导入
- import { oauthClients, ... } from "@oksai/database";
```

**保留作为参考**:
```
libs/database/src/schema/  # 保留 Drizzle Schema 作为参考
```

**预计时间**: 0.5 天

---

#### 5.2 文档更新

**需要更新**:
1. `AGENTS.md`
   - 更新数据库命令说明
   - 移除 Drizzle 命令
   
2. `mikro-orm-migration-final-summary.md`
   - 更新真实迁移状态
   
3. 创建 `mikro-orm-gateway-migration.md`
   - 记录 gateway 迁移细节

**预计时间**: 0.5 天

---

## 🚀 执行计划

### Week 1: 核心迁移 (5 天)

```
Day 1-2: OAuthService 迁移
  ├── 修改导入和构造函数 (0.5 天)
  ├── 迁移简单查询方法 (0.5 天)
  ├── 迁移插入和更新方法 (0.5 天)
  └── 迁移复杂事务方法 (0.5 天)

Day 3: SessionService + TokenBlacklistService 迁移
  ├── SessionService (0.7 天)
  └── TokenBlacklistService (0.3 天)

Day 4-5: 模块配置 + 单元测试
  ├── AuthModule 配置 (0.5 天)
  ├── DatabaseModule 配置 (0.5 天)
  └── 核心单元测试迁移 (1 天)
```

### Week 2: 辅助迁移和验证 (4-5 天)

```
Day 1-2: 辅助服务迁移
  ├── WebhookService (1 天)
  ├── ApiKeyService (0.5 天)
  └── ImpersonationService (0.5 天)

Day 3-4: 测试和验证
  ├── 单元测试迁移 (1 天)
  └── 集成测试验证 (1 天)

Day 5: 清理和文档
  ├── 代码清理 (0.5 天)
  └── 文档更新 (0.5 天)
```

---

## 📊 成功标准

### 功能标准

```
✅ 100% 功能对等
  - 所有现有功能正常工作
  - 无功能回退
  
✅ 性能标准
  - 查询性能 < 10% 下降
  - 事务性能持平
  
✅ 质量标准
  - 测试覆盖率 > 80%
  - 0 个严重 Bug
  - < 5 个一般 Bug
```

### 技术标准

```
✅ 代码质量
  - 移除所有 Drizzle 引用
  - 使用 MikroORM 最佳实践
  - 类型安全 100%
  
✅ 可维护性
  - 代码简洁（预计减少 30% 代码量）
  - 清晰的架构分层
  - 完整的注释和文档
```

---

## ⚠️ 回滚计划

### 触发条件

```
🔴 立即回滚:
  - 数据丢失或损坏
  - 性能下降 > 50%
  - 关键功能不可用
  - 5 个以上严重 Bug

🟡 评估回滚:
  - 性能下降 30-50%
  - 5-10 个一般 Bug
  - 团队无法适应
```

### 回滚步骤

```bash
# 1. 停止开发 (5 分钟)
git stash

# 2. 回滚到迁移前版本 (10 分钟)
git checkout <pre-migration-commit>
git checkout -b rollback/mikro-orm

# 3. 重新安装依赖 (5 分钟)
pnpm install

# 4. 验证功能 (30 分钟)
pnpm test
pnpm dev

# 总回滚时间: < 1 小时
```

---

## 📝 检查清单

### 迁移前检查

```
☐ 1. 创建迁移分支
  git checkout -b migration/mikro-orm-gateway

☐ 2. 备份数据库
  pg_dump oksai > backup_$(date +%Y%m%d).sql

☐ 3. 团队培训完成
  - MikroORM 基础
  - Entity 和 EntityManager
  - Unit of Work

☐ 4. 环境准备
  - 安装 MikroORM CLI
  - 配置开发环境
```

### 迁移中检查（每个 Service）

```
☐ 1. 修改导入
  - 移除 Drizzle 导入
  - 添加 MikroORM 导入

☐ 2. 修改构造函数
  - 注入 EntityManager

☐ 3. 迁移方法
  - 逐个方法迁移
  - 保持方法签名不变

☐ 4. 测试验证
  - 单元测试通过
  - 集成测试通过

☐ 5. 代码审查
  - 团队审查
  - 性能检查
```

### 迁移后检查

```
☐ 1. 功能验证
  - 所有功能测试通过
  - E2E 测试通过

☐ 2. 性能测试
  - 基准测试
  - 压力测试

☐ 3. 代码清理
  - 移除无用导入
  - 代码格式化

☐ 4. 文档更新
  - API 文档
  - 架构文档
  - 迁移记录
```

---

## 📚 参考资料

### MikroORM 文档

- [官方文档](https://mikro-orm.io/)
- [NestJS 集成](https://mikro-orm.io/docs/nestjs)
- [Entity 定义](https://mikro-orm.io/docs/defining-entities)
- [Repository 模式](https://mikro-orm.io/docs/repositories)

### 内部文档

- [MikroORM 迁移计划](./mikro-orm-migration-plan.md)
- [MikroORM 使用指南](./mikro-orm-usage-guide.md)
- [Entity 设计规范](./entity-design-guide.md)

---

## 📞 支持和联系方式

**遇到问题时**:

1. **技术问题**
   - 查阅 MikroORM 官方文档
   - 搜索 GitHub Issues
   - 询问团队

2. **迁移阻塞**
   - 记录详细错误信息
   - 保存原始代码
   - 寻求团队帮助

3. **性能问题**
   - 使用 MikroORM debug 模式
   - 分析 SQL 日志
   - 优化查询

---

**文档版本**: 1.0  
**创建日期**: 2026-03-05  
**预计完成**: 2026-03-17 (12 天)  
**下次评审**: 2026-03-08 (3 天后)
