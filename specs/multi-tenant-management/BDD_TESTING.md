# BDD 测试执行指南

## 📋 概述

本文档说明如何运行多租户管理的 BDD（行为驱动开发）测试。

## 🎯 测试范围

- **Feature 文件**：`specs/multi-tenant-management/features/multi-tenant.feature`
- **E2E 测试**：`apps/gateway/test/multi-tenant.e2e-spec.ts`
- **测试场景**：11 个完整的 BDD 场景

### 测试场景列表

| 场景 | 类型     | 描述               |
| ---- | -------- | ------------------ |
| 1    | 正常流程 | 租户识别与数据隔离 |
| 2    | 正常流程 | 创建租户并设置配额 |
| 3    | 正常流程 | 租户激活           |
| 4    | 正常流程 | 检查租户配额       |
| 5    | 异常流程 | 无效租户访问       |
| 6    | 异常流程 | 租户已停用         |
| 7    | 异常流程 | 跨租户访问资源     |
| 8    | 异常流程 | 超过配额限制       |
| 9    | 边界条件 | 租户 ID 不一致     |
| 10   | 边界条件 | 租户配额为零       |
| 11   | 边界条件 | 租户切换组织       |

## 🚀 快速开始

### 1. 环境准备

确保已安装以下依赖：

```bash
# Node.js >= 18
node --version

# pnpm >= 8
pnpm --version
```

### 2. 数据库准备

**重要**：测试需要 PostgreSQL 数据库和正确的表结构。

```bash
# 方式 1: 运行数据库迁移（推荐）
pnpm mikro-orm migration:up

# 方式 2: 使用测试数据库
# 1. 创建测试数据库
createdb oksai_test

# 2. 配置环境变量
export DATABASE_URL="postgresql://user:password@localhost:5432/oksai_test"

# 3. 运行迁移
pnpm mikro-orm migration:up
```

### 3. 运行测试

```bash
# 运行所有 gateway 测试（包括 E2E）
pnpm nx test gateway

# 仅运行多租户 E2E 测试
cd apps/gateway
pnpm vitest run test/multi-tenant.e2e-spec.ts

# 运行测试并查看详细输出
pnpm vitest run test/multi-tenant.e2e-spec.ts --reporter=verbose

# 运行测试并生成覆盖率报告
pnpm vitest run test/multi-tenant.e2e-spec.ts --coverage
```

## 📊 测试输出

### 成功示例

```
 ✓ test/multi-tenant.e2e-spec.ts (11 tests) 200ms
   ✓ 场景 1: 租户识别与数据隔离 > 应该自动过滤并只返回当前租户的用户 20ms
   ✓ 场景 2: 创建租户并设置配额 > 管理员应该能够创建租户并设置配额 15ms
   ✓ 场景 3: 租户激活 > 管理员应该能够激活待审核的租户 10ms
   ✓ 场景 4: 检查租户配额 > 应该在配额范围内允许邀请成员 25ms
   ✓ 场景 5: 无效租户访问 > 应该在缺少租户标识时返回 400 5ms
   ✓ 场景 6: 租户已停用 > 应该在租户停用时拒绝访问 8ms
   ✓ 场景 7: 跨租户访问资源 > 应该阻止跨租户访问资源 12ms
   ✓ 场景 8: 超过配额限制 > 应该在超过配额时拒绝邀请成员 30ms
   ✓ 场景 9: 租户 ID 不一致 > 应该在租户ID不一致时使用 JWT Token 中的 tenantId 18ms
   ✓ 场景 10: 租户配额为零 > 应该在配额为零时拒绝邀请成员 10ms
   ✓ 场景 11: 租户切换组织 > 应该在切换组织时保持租户上下文不变 15ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  2.50s
```

### 失败示例

如果测试失败，会显示详细的错误信息：

```
 FAIL  test/multi-tenant.e2e-spec.ts > 场景 1: 租户识别与数据隔离 > 应该自动过滤并只返回当前租户的用户

AssertionError: expected 403 to be 200

Expected: 200
Received: 403

 ❯ test/multi-tenant.e2e-spec.ts:45:19
     43|       // Then: 只返回租户1的用户
     44|       expect(response.status).toBe(200);
       |                             ^
     45|       expect(response.body.users).toHaveLength(5);
```

## 🔧 常见问题

### 1. 数据库连接失败

**错误**：`relation "tenant" does not exist`

**解决方案**：

```bash
# 运行数据库迁移
pnpm mikro-orm migration:up

# 或者手动创建表
pnpm mikro-orm schema:update --run
```

### 2. 测试超时

**错误**：`Timeout - Async callback was not invoked within the 30000 ms timeout`

**解决方案**：

```typescript
// 在测试文件中增加超时时间
it('应该在配额范围内允许邀请成员', async () => {
  // ...
}, 60000); // 60 秒超时
```

### 3. 依赖注入失败

**错误**：`Nest can't resolve dependencies of the TenantService`

**解决方案**：

```bash
# 确保所有依赖已构建
pnpm build

# 清理并重新构建
pnpm nx reset
pnpm build
```

### 4. 租户上下文未设置

**错误**：`Cannot read properties of undefined (reading 'tenantId')`

**解决方案**：

```bash
# 确保 TenantMiddleware 已正确注册
# 检查 apps/gateway/src/app.module.ts
```

## 📝 测试编写指南

### 添加新测试

1. **在 Feature 文件中添加场景**：

```gherkin
Scenario: 新的测试场景
  Given 前置条件
  When 执行操作
  Then 验证结果
```

2. **在 E2E 测试中实现**：

```typescript
describe('场景 12: 新的测试场景', () => {
  it('应该完成某项操作', async () => {
    // Given: 准备测试数据
    const tenant = new Tenant('测试租户', 'PRO', 'test', 'owner');
    tenant.status = 'ACTIVE';
    em.persist(tenant);
    await em.flush();

    // When: 执行操作
    const response = await request(app.getHttpServer())
      .get('/api/tenants')
      .set('Authorization', `Bearer test-token`);

    // Then: 验证结果
    expect(response.status).toBe(200);
  });
});
```

### 测试命名规范

- Feature 场景：使用中文描述
- 测试函数：使用 `should` 句式
- Describe 块：使用 `场景 X: 描述` 格式

### 测试数据清理

每个测试前会自动清理数据库：

```typescript
beforeEach(async () => {
  const connection = em.getConnection();
  await connection.execute('TRUNCATE tenant, "user" CASCADE');
});
```

## 🎯 测试覆盖率

### 当前覆盖率

- **Feature 场景覆盖率**：100% (11/11)
- **E2E 测试覆盖率**：100% (11/11)
- **单元测试覆盖率**：100% (已有)

### 覆盖率报告

```bash
# 生成覆盖率报告
pnpm vitest run --coverage

# 查看 HTML 报告
open apps/gateway/coverage/index.html
```

## 📚 相关文档

- [多租户管理设计](./design.md)
- [实现进度](./implementation.md)
- [API 文档](./docs/API.md)
- [使用指南](./docs/USAGE.md)
- [性能优化](./docs/PERFORMANCE.md)

## 🤝 贡献指南

1. 添加新功能时，必须同时添加 BDD 场景和 E2E 测试
2. 所有测试必须通过才能合并代码
3. 保持测试覆盖率在 85% 以上
4. 遵循 Given-When-Then 结构编写测试

## 📞 支持

如有问题，请联系：

- 技术负责人：oksai.cc 团队
- 文档维护：specs/multi-tenant-management/

---

**最后更新**：2026-03-08 23:10  
**维护者**：oksai.cc 团队
