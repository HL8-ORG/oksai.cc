# Better Auth MikroORM 适配器优化实现

## 状态：🔴 Phase 1 未开始

---

## BDD 场景进度

| 场景 | Feature 文件 | 状态 | 测试 |
|:---|:---|:---:|:---:|
| 真实事务支持 | `transaction.feature` | ⏳ | ❌ |
| 事务提交 | 同上 | ⏳ | ❌ |
| 事务回滚 | 同上 | ⏳ | ❌ |
| 真实数据库 CRUD | `integration.feature` | ⏳ | ❌ |
| 并发操作 | 同上 | ⏳ | ❌ |
| 完整认证流程 | `e2e.feature` | ⏳ | ❌ |

---

## TDD 循环进度

| 层级 | 组件 | Red | Green | Refactor | 覆盖率 |
|:---|:---|:---:|:---:|:---:|:---:|
| 领域层 | TransactionManager | ⏳ | ⏳ | ⏳ | -% |
| 应用层 | mikroOrmAdapter | ⏳ | ⏳ | ⏳ | -% |
| 集成 | Integration Tests | ⏳ | ⏳ | ⏳ | -% |
| E2E | Auth Flow Tests | ⏳ | ⏳ | ⏳ | -% |

---

## 测试覆盖率

| 层级 | 目标 | 实际 | 状态 |
|:---|:---:|:---:|:---:|
| 单元测试 | >80% | 100% (32/32) ✅ | ✅ |
| 集成测试 | >80% | 0% | ⏳ |
| E2E 测试 | >80% | 0% | ⏳ |
| **总体** | >80% | ~40% | ⏳ |

---

## 已完成

### 基础实现（已完成 ✅）

**测试覆盖：**
- ✅ 单元测试：32/32 通过（Vitest）
  - ✅ adapter.spec.ts - 适配器核心测试
  - ✅ adapter-utils.spec.ts - 工具函数测试
  - ✅ create-adapter-error.spec.ts - 错误处理测试

**功能实现：**
- ✅ 基础 CRUD 操作（create/findOne/findMany/update/updateMany/delete/deleteMany/count）
- ✅ Where 操作符支持（in/contains/starts_with/ends_with/gt/gte/lt/lte/ne）
- ✅ 实体名/表名映射
- ✅ 输入输出规范化
- ✅ EntityManager.fork() 上下文隔离

**关键契约支持（评估完成 ✅）：**
- ✅ create - 直接实现
- ✅ findOne - 直接实现
- ✅ findMany - 直接实现
- ✅ update - 直接实现
- ✅ updateMany - 直接实现
- ✅ delete - 直接实现
- ✅ deleteMany - 直接实现
- ✅ count - 直接实现
- ⚠️ transaction - 工厂兜底（需增强）
- ✅ id - 工厂补全
- ✅ options - 工厂补全
- ❌ createSchema - 未实现（MikroORM 已支持）

**完成时间：** 2026-03-05  
**状态：** ✅ 基础功能可用，需增强事务和测试

---

## 进行中

无

---

## 阻塞项

无

---

## Phase 1: 核心问题修复（1 周）

**目标**：实现真实事务支持 + 基础集成测试

### 任务 1: 创建 TransactionManager

**状态**: ⏳ 未开始

**待办事项**:
- [ ] 创建 `src/utils/transactionManager.ts`
- [ ] 实现 `execute<T>(cb, options)` 方法
  - [ ] 包装 MikroORM 的 `em.transactional()`
  - [ ] 添加超时处理（默认 30 秒）
  - [ ] 添加错误处理和日志
- [ ] 编写单元测试
  - [ ] 测试正常提交
  - [ ] 测试异常回滚
  - [ ] 测试超时处理
- [ ] 添加 TSDoc 文档

**验收标准**:
- ✅ 支持 Promise 风格的事务
- ✅ 支持超时配置
- ✅ 单元测试覆盖率 > 90%

### 任务 2: 更新 mikroOrmAdapter 配置

**状态**: ⏳ 未开始

**待办事项**:
- [ ] 扩展 `MikroOrmAdapterConfig` 接口
  - [ ] 添加 `transaction` 配置选项
  - [ ] 添加 `connectionPool` 配置选项
- [ ] 更新 `adapter.ts`
  - [ ] 接入 `config.transaction` 到工厂
  - [ ] 创建 TransactionManager 实例
  - [ ] 保持向后兼容（可选配置）
- [ ] 编写配置测试
  - [ ] 测试默认配置
  - [ ] 测试自定义配置
  - [ ] 测试向后兼容性
- [ ] 更新 README 和示例

**验收标准**:
- ✅ 适配器支持真实事务
- ✅ 配置可选，保持向后兼容
- ✅ 测试覆盖率 > 80%

### 任务 3: 创建集成测试环境

**状态**: ⏳ 未开始

**待办事项**:
- [ ] 创建 `docker-compose.test.yml`
  - [ ] 配置 PostgreSQL 16
  - [ ] 配置测试数据库
  - [ ] 配置健康检查
- [ ] 创建测试 Entity
  - [ ] User Entity
  - [ ] Session Entity
  - [ ] Account Entity
  - [ ] Organization Entity
- [ ] 配置 Vitest 集成测试
  - [ ] 创建 `vitest.integration.config.ts`
  - [ ] 配置测试数据库连接
  - [ ] 配置 beforeAll/afterAll 钩子
- [ ] 创建测试工具函数
  - [ ] `createTestOrm()` - 创建测试 ORM 实例
  - [ ] `cleanDatabase()` - 清理测试数据
  - [ ] `seedTestData()` - 填充测试数据

**验收标准**:
- ✅ Docker 环境可一键启动
- ✅ 测试数据库自动清理
- ✅ 测试运行稳定

### 任务 4: 编写基础集成测试

**状态**: ⏳ 未开始

**待办事项**:
- [ ] 创建 `src/spec/integration/adapter.integration.spec.ts`
  - [ ] 测试 create 操作
  - [ ] 测试 findOne 操作
  - [ ] 测试 findMany 操作（分页、排序）
  - [ ] 测试 update 操作
  - [ ] 测试 delete 操作
  - [ ] 测试关联关系（1:1, 1:m）
- [ ] 创建 `src/spec/integration/transaction.spec.ts`
  - [ ] 测试事务提交
  - [ ] 测试事务回滚
  - [ ] 测试嵌套事务（savepoint）
  - [ ] 测试事务超时
- [ ] 验证测试通过
  - [ ] 所有测试在真实数据库上通过
  - [ ] 覆盖率 > 70%

**验收标准**:
- ✅ 10+ 集成测试通过
- ✅ 事务功能在真实数据库上验证
- ✅ 测试覆盖率 > 60%

**Phase 1 预计完成时间**: 1 周

---

## Phase 2: 测试和文档完善（1 周）

**目标**：完整测试覆盖 + 清晰文档

### 任务 5: 扩展集成测试

**状态**: ⏳ 未开始（依赖 Phase 1 完成）

**待办事项**:
- [ ] 创建 `src/spec/integration/concurrency.spec.ts`
  - [ ] 测试多个 `em.fork()` 并发操作
  - [ ] 测试乐观锁冲突
  - [ ] 测试死锁场景
- [ ] 创建 `src/spec/integration/edge-cases.spec.ts`
  - [ ] 测试空值处理（null/undefined）
  - [ ] 测试大批量操作（1000+ 条记录）
  - [ ] 测试连接池耗尽场景
  - [ ] 测试异常字符处理

**验收标准**:
- ✅ 20+ 集成测试通过
- ✅ 并发场景覆盖
- ✅ 边界条件覆盖

### 任务 6: 创建 E2E 测试

**状态**: ⏳ 未开始（依赖 Phase 1 完成）

**待办事项**:
- [ ] 创建 `src/spec/e2e/auth-flow.spec.ts`
  - [ ] 测试用户注册（创建用户 + 默认组织）
  - [ ] 测试用户登录
  - [ ] 测试会话验证
  - [ ] 测试权限检查
- [ ] 集成 Better Auth
  - [ ] 创建 Better Auth 实例
  - [ ] 使用 mikroOrmAdapter
  - [ ] 验证完整流程

**验收标准**:
- ✅ 5+ E2E 测试通过
- ✅ 完整认证流程验证

### 任务 7: 编写文档

**状态**: ⏳ 未开始（依赖 Phase 1-2 完成）

**待办事项**:
- [ ] 创建 `docs/README.md`
  - [ ] 功能概览
  - [ ] 功能支持矩阵（支持/限制/不支持）
  - [ ] 快速开始
  - [ ] 配置选项
- [ ] 创建 `docs/LIMITATIONS.md`
  - [ ] 事务限制说明
  - [ ] 关系模型限制（m:m, 1:m）
  - [ ] 性能限制
  - [ ] 规避方案
- [ ] 创建 `docs/MIGRATION.md`
  - [ ] 从 Drizzle 迁移指南
  - [ ] Entity 设计最佳实践
  - [ ] 常见问题和解决方案
- [ ] 更新 API 文档（TSDoc）
  - [ ] TransactionManager
  - [ ] mikroOrmAdapter 配置
  - [ ] 所有公共方法

**验收标准**:
- ✅ 完整文档覆盖
- ✅ 示例代码可运行
- ✅ 新开发者可快速上手

### 任务 8: 创建使用示例

**状态**: ⏳ 未开始（依赖 Phase 1-2 完成）

**待办事项**:
- [ ] 创建 `examples/basic-usage.ts`
  - [ ] 基础 CRUD 操作示例
  - [ ] 查询和过滤示例
  - [ ] 分页和排序示例
- [ ] 创建 `examples/transaction-usage.ts`
  - [ ] 事务基础使用
  - [ ] 事务超时配置
  - [ ] 事务错误处理
- [ ] 创建 `examples/entity-design.ts`
  - [ ] Entity 定义最佳实践
  - [ ] 关系设计示例
  - [ ] 限制规避方案（中间实体）

**验收标准**:
- ✅ 3+ 使用示例
- ✅ 示例代码可运行
- ✅ 覆盖常见用例

**Phase 2 预计完成时间**: 1 周

---

## Phase 3: 功能扩展（可选，1-2 周）

**目标**：增强功能 + 性能优化

### 任务 9: 关系模型增强

**状态**: ⏳ 未开始（可选）

**待办事项**:
- [ ] 评估 m:m 关系支持可行性
- [ ] 研究 Better Auth join 参数
- [ ] 实现中间实体方案示例
- [ ] 添加文档说明

### 任务 10: 性能优化

**状态**: ⏳ 未开始（可选）

**待办事项**:
- [ ] 添加查询缓存（可选）
- [ ] 优化连接池配置
- [ ] 批量操作性能测试
- [ ] 性能基准测试

### 任务 11: 监控和可观测性

**状态**: ⏳ 未开始（可选）

**待办事项**:
- [ ] 集成 OpenTelemetry
- [ ] 添加性能指标
- [ ] 创建监控面板

**Phase 3 预计完成时间**: 1-2 周（可选）

---

## 下一步

**立即开始 Phase 1 任务 1**：
1. 创建 `TransactionManager` 类
2. 编写单元测试
3. 验证事务功能

---

## 会话备注

- **2026-03-05**: 创建优化方案 spec
  - 基于 3 份 Better Auth 文档分析
  - 识别关键问题：事务语义、测试覆盖、关系模型、文档
  - 制定 3 阶段实施计划（2-3 周）
  - Phase 1 聚焦核心问题修复（1 周）
