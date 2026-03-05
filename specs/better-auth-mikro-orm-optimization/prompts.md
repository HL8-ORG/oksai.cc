# Better Auth MikroORM 适配器优化常用提示词

本文档收集开发过程中的常用提示词，帮助 AI 助手快速理解上下文。

---

## 🚀 快速开始

### 开始 Phase 1 开发

```
/spec continue better-auth-mikro-orm-optimization

开始 Phase 1 任务 1：创建 TransactionManager 类。
请先阅读 design.md 了解设计要求，然后：
1. 创建 src/utils/transactionManager.ts
2. 实现 execute() 方法
3. 编写单元测试
4. 添加 TSDoc 文档
```

### 查看当前进度

```
/spec status better-auth-mikro-orm-optimization
```

### 同步实现到 spec

```
/spec sync better-auth-mikro-orm-optimization
```

---

## 🧪 测试相关

### 运行单元测试

```bash
# 运行所有单元测试
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/

# 运行特定测试文件
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/transactionManager.spec.ts

# 运行并生成覆盖率
pnpm vitest run --coverage libs/shared/better-auth-mikro-orm/src/spec/
```

### 运行集成测试

```bash
# 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 运行集成测试
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/integration/

# 停止测试数据库
docker-compose -f docker-compose.test.yml down
```

### 运行 E2E 测试

```bash
# 运行 E2E 测试
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/e2e/
```

---

## 📝 代码实现

### 创建 TransactionManager

```
请创建 TransactionManager 类，要求：
1. 包装 MikroORM 的 em.transactional()
2. 支持事务超时（默认 30 秒）
3. 添加完整的错误处理
4. 编写单元测试（覆盖率 > 90%）
5. 添加 TSDoc 文档

参考：
- design.md 中的接口设计
- MikroORM 事务文档：https://mikro-orm.io/docs/transactions
```

### 更新 mikroOrmAdapter

```
请更新 mikroOrmAdapter 配置，要求：
1. 扩展 MikroOrmAdapterConfig 接口
2. 接入 config.transaction
3. 创建 TransactionManager 实例
4. 保持向后兼容（配置可选）
5. 编写配置测试
6. 更新 README 和示例

参考：
- design.md 中的配置接口
- decisions.md 中的 ADR-005（向后兼容）
```

### 创建集成测试

```
请创建集成测试，要求：
1. 使用真实 PostgreSQL 数据库
2. 测试 CRUD 操作
3. 测试事务提交和回滚
4. 测试并发场景
5. 测试边界条件

参考：
- design.md 中的测试策略
- 测试 Entity：User, Session, Account, Organization
```

---

## 📚 文档编写

### 编写 README.md

```
请编写 README.md，包含：
1. 功能概览（2-3 段）
2. 功能支持矩阵（✅ 支持 / ⚠️ 有限制 / ❌ 不支持）
3. 快速开始（5 分钟上手）
4. 配置选项说明
5. 常见问题（FAQ）
6. 参考链接

参考：
- docs/better-auth-core-deep-analysis.md
- docs/better-auth-mikro-orm-dbadapter-contract-evaluation.md
- docs/better-auth-mikro-orm-library-assessment.md
```

### 编写 LIMITATIONS.md

```
请编写 LIMITATIONS.md，包含：
1. 事务限制说明
2. 关系模型限制（m:m, 1:m）
3. 性能限制
4. 规避方案
5. 最佳实践建议

参考：
- decisions.md 中的 ADR-003（关系模型限制处理）
- design.md 中的边界情况
```

### 编写 MIGRATION.md

```
请编写 MIGRATION.md，包含：
1. 从 Drizzle 迁移步骤
2. Entity 设计最佳实践
3. 配置迁移
4. 常见问题和解决方案
5. 迁移检查清单

参考：
- docs/better-auth-mikro-orm-library-assessment.md（迁移收益）
- MikroORM 官方文档
```

---

## 🔍 代码审查

### 审查事务实现

```
请审查 TransactionManager 实现，检查：
1. 是否正确包装 MikroORM transactional()
2. 是否正确处理超时
3. 错误处理是否完整
4. 单元测试覆盖率是否 > 90%
5. TSDoc 文档是否完整

参考：
- design.md 中的接口设计
- decisions.md 中的 ADR-001
```

### 审查集成测试

```
请审查集成测试，检查：
1. 是否使用真实数据库
2. 是否覆盖关键场景（CRUD、事务、并发）
3. 测试数据是否正确清理
4. 测试是否稳定（无随机失败）
5. 测试命名是否清晰

参考：
- design.md 中的测试策略
- decisions.md 中的 ADR-002
```

---

## 🐛 调试问题

### 调试事务问题

```
事务执行失败，错误信息：[错误信息]

请帮助：
1. 分析错误原因
2. 检查事务配置
3. 检查 EntityManager 使用
4. 提供修复建议

相关代码：
[粘贴代码]
```

### 调试测试失败

```
测试失败，测试名称：[测试名称]

请帮助：
1. 分析失败原因
2. 检查测试设置
3. 检查断言逻辑
4. 提供修复建议

测试代码：
[粘贴测试代码]

错误信息：
[粘贴错误信息]
```

---

## 🔧 配置帮助

### 配置测试数据库

```
请帮助配置测试数据库：
1. 创建 docker-compose.test.yml
2. 配置 PostgreSQL 16
3. 配置测试数据库连接
4. 创建测试 Entity
5. 配置 Vitest 集成测试

参考：
- design.md 中的测试环境配置
```

### 配置 Vitest

```
请帮助配置 Vitest：
1. 创建 vitest.integration.config.ts
2. 配置测试数据库连接
3. 配置 beforeAll/afterAll 钩子
4. 配置覆盖率报告

参考：
- AGENTS.md 中的 Vitest 迁移说明
```

---

## 📊 性能优化

### 性能基准测试

```
请创建性能基准测试：
1. 测试 CRUD 操作性能
2. 测试事务性能
3. 测试并发性能
4. 测试大批量操作
5. 生成性能报告

参考：
- future-work.md 中的性能优化建议
```

### 性能优化建议

```
当前性能问题：[描述问题]

请提供：
1. 性能分析
2. 优化建议
3. 实现方案
4. 预期收益

当前代码：
[粘贴代码]
```

---

## 🎯 特定场景

### 实现 m:m 关系规避方案

```
需要实现组织和用户的多对多关系，但适配器不支持 m:m。

请提供：
1. 中间实体设计方案
2. Entity 定义示例
3. 使用示例
4. 注意事项

参考：
- design.md 中的关系模型限制
- decisions.md 中的 ADR-003
```

### 处理并发冲突

```
遇到并发冲突问题：[描述问题]

请提供：
1. 冲突原因分析
2. 解决方案（乐观锁/悲观锁/重试）
3. 实现示例
4. 测试用例

参考：
- design.md 中的边界情况
```

---

## 📖 学习资源

### 了解 Better Auth

```
请提供 Better Auth 学习路径：
1. 核心概念（AuthContext、Plugin、DBAdapter）
2. 数据库适配器规范
3. 插件系统
4. 最佳实践

参考：
- docs/better-auth-core-deep-analysis.md
- Better Auth 官方文档：https://better-auth.com/docs
```

### 了解 MikroORM

```
请提供 MikroORM 学习路径：
1. 核心概念（Entity、EntityManager、UnitOfWork）
2. 事务管理
3. 关联关系
4. 性能优化

参考：
- MikroORM 官方文档：https://mikro-orm.io/docs
```

---

**文档版本**: 1.0  
**最后更新**: 2026-03-05  
**维护者**: oksai.cc 团队
