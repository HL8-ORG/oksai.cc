# Better Auth MikroORM 适配器 - 集成测试指南

## 概述

本项目的集成测试使用真实的 PostgreSQL 数据库，验证适配器与数据库的完整集成。

## 前置要求

- Docker 和 Docker Compose
- pnpm

## 运行集成测试

### 1. 启动测试数据库

```bash
cd libs/shared/better-auth-mikro-orm
docker-compose -f docker-compose.test.yml up -d
```

### 2. 等待数据库就绪

```bash
docker-compose -f docker-compose.test.yml logs -f postgres
```

看到以下日志表示数据库已就绪：

```
PostgreSQL init process complete; ready for start up.
```

### 3. 运行集成测试

```bash
pnpm test
```

或者只运行集成测试：

```bash
pnpm vitest run src/spec/integration/
```

### 4. 停止测试数据库

```bash
docker-compose -f docker-compose.test.yml down
```

## 测试数据库配置

测试数据库使用以下配置（可通过环境变量覆盖）：

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `TEST_DB_HOST` | `localhost` | 数据库主机 |
| `TEST_DB_PORT` | `5433` | 数据库端口 |
| `TEST_DB_USER` | `test` | 数据库用户 |
| `TEST_DB_PASSWORD` | `test` | 数据库密码 |
| `TEST_DB_NAME` | `better_auth_test` | 数据库名称 |
| `TEST_DEBUG` | `false` | 启用 MikroORM 调试日志 |

## 测试结构

```
src/spec/integration/
├── test-entities/           # 测试用 Entity
│   ├── user.entity.ts
│   ├── session.entity.ts
│   ├── account.entity.ts
│   ├── organization.entity.ts
│   └── index.ts
├── test-utils.ts           # 测试工具函数
├── adapter.integration.spec.ts    # CRUD 操作测试
└── transaction.integration.spec.ts # 事务测试
```

## 测试覆盖内容

### adapter.integration.spec.ts

- ✅ 创建记录（create）
- ✅ 查询单个记录（findOne）
- ✅ 查询多个记录（findMany）
- ✅ 更新记录（update）
- ✅ 删除记录（delete）
- ✅ 统计记录（count）

### transaction.integration.spec.ts

- ✅ 事务提交
- ✅ 事务回滚
- ✅ 嵌套操作

## 故障排除

### 问题：无法连接到数据库

**症状**：

```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**解决方案**：

1. 确认 Docker 容器正在运行：
   ```bash
   docker ps | grep better-auth
   ```

2. 检查端口是否被占用：
   ```bash
   lsof -i :5433
   ```

3. 重启容器：
   ```bash
   docker-compose -f docker-compose.test.yml restart
   ```

### 问题：Entity metadata 错误

**症状**：

```
Error: Please provide either 'type' or 'entity' attribute in TestUser.email
```

**解决方案**：

确保 `tsconfig.json` 中启用了 `emitDecoratorMetadata`：

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

### 问题：Schema 创建失败

**症状**：

```
TypeError: Cannot read properties of undefined (reading 'schema')
```

**解决方案**：

确保 MikroORM 配置正确，检查 `createTestOrm()` 函数中的配置。

## 持续集成

在 CI 环境中，可以使用以下命令：

```bash
# 启动数据库
docker-compose -f docker-compose.test.yml up -d

# 等待数据库就绪
sleep 5

# 运行测试
pnpm test

# 清理
docker-compose -f docker-compose.test.yml down -v
```

## 性能基准

集成测试的性能基准（仅供参考）：

- 测试文件数：2
- 测试用例数：18
- 平均执行时间：5-10 秒

## 下一步

- [ ] 添加并发测试
- [ ] 添加边界条件测试
- [ ] 添加性能基准测试
- [ ] 集成到 CI/CD 流程

---

**维护者**: oksai.cc 团队
**最后更新**: 2026-03-05
