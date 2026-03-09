# 多租户系统 Prompts

本文档包含常见开发任务的可复用提示词，可以直接复制使用。

---

## 创建新功能

### 创建新的 Command

```
创建 {CommandName} Command：
- 功能：{功能描述}
- 参数：{参数列表}
- 验证规则：{验证规则}
- 返回：{返回类型}

参考：
- 设计文档：specs/tenancy/design.md
- 现有实现：libs/tenancy/application/commands/create-tenant.command.ts
- 测试要求：遵循 TDD（先写测试）
```

### 创建新的 Query

```
创建 {QueryName} Query：
- 功能：{功能描述}
- 参数：{参数列表}
- 返回：{返回类型}
- 缓存策略：{realtime/cached}

参考：
- 设计文档：specs/tenancy/design.md
- 现有实现：libs/tenancy/application/queries/get-tenant-by-id.query.ts
- 测试要求：遵循 TDD（先写测试）
```

### 创建新的领域事件

```
创建 {EventName} 领域事件：
- 触发时机：{触发时机}
- 事件数据：{事件数据}
- 事件名称：{事件名称常量}

参考：
- 现有实现：libs/tenancy/domain/events/tenant-created.event.ts
- 基类：@oksai/domain-core 的 DomainEvent
```

---

## 测试相关

### 编写单元测试

```
为 {ComponentName} 编写单元测试：
- 测试类型：单元测试
- 测试框架：Vitest
- 测试场景：
  1. 正常流程（Happy Path）
  2. 异常流程（Error Cases）
  3. 边界条件（Edge Cases）
- 覆盖率目标：>90%

参考：
- 测试指南：specs/tenancy/testing.md
- 现有测试：libs/tenancy/domain/tenant/tenant.aggregate.spec.ts
- Fixture：libs/tenancy/testing/fixtures/tenant.fixture.ts
```

### 编写集成测试

```
为 {ComponentName} 编写集成测试：
- 测试类型：集成测试
- 测试框架：Vitest + MikroORM
- 测试场景：
  1. 数据库 CRUD 操作
  2. 与 NestJS 集成
  3. 多租户隔离验证
- 覆盖率目标：>85%

参考：
- 测试指南：specs/tenancy/testing.md
- 现有测试：libs/tenancy/infrastructure/repository/tenant.repository.integration.spec.ts
```

### 编写 E2E 测试

```
为 {FeatureName} 编写 E2E 测试：
- 测试类型：E2E 测试
- 测试框架：Vitest + Supertest
- 测试场景：完整业务流程
  1. {步骤1}
  2. {步骤2}
  3. {步骤3}
- 覆盖率目标：>80%

参考：
- 测试指南：specs/tenancy/testing.md
- 现有测试：apps/gateway/test/tenant-lifecycle.e2e.spec.ts
```

---

## 代码迁移

### 迁移领域层代码

```
迁移 {FileName} 到 libs/tenancy/domain：
1. 复制文件到新位置
2. 更新 import 路径（添加 .js 后缀）
3. 运行测试确保功能正常
4. 在旧位置添加重导出（向后兼容）

源文件：libs/iam/domain/src/tenant/{filename}.ts
目标位置：libs/tenancy/domain/src/{filename}.ts

参考：
- 迁移计划：specs/tenancy/design.md#实现计划
- AGENTS.md：specs/tenancy/AGENTS.md#迁移注意事项
```

### 更新 import 路径

```
批量更新 import 路径：
- 旧路径：@oksai/iam-domain
- 新路径：@oksai/tenancy

步骤：
1. 查找所有引用：grep -r "@oksai/iam-domain" --include="*.ts"
2. 批量更新：sed -i "s/@oksai\/iam-domain/@oksai\/tenancy/g" **/*.ts
3. 运行测试确保无错误
4. 检查 LSP 错误

参考：
- AGENTS.md：specs/tenancy/AGENTS.md#迁移注意事项
```

---

## 调试和问题排查

### 排查依赖注入问题

```
排查 NestJS 依赖注入问题：
- 错误信息：{错误信息}
- 相关模块：{模块名称}

检查清单：
1. 确保 Service 在 Module 的 providers 中注册
2. 确保 Module 被正确导入
3. 检查循环依赖
4. 验证 inject 装饰器的 token 是否正确
5. 确保 reflect-metadata 在文件顶部导入

参考：
- NestJS 文档：https://docs.nestjs.com/fundamentals/custom-providers
- 项目示例：apps/gateway/src/app.module.ts
```

### 排查测试失败

```
排查测试失败问题：
- 测试文件：{测试文件路径}
- 错误信息：{错误信息}

调试步骤：
1. 使用 vitest run {file} -t "{test name}" 运行单个测试
2. 添加 console.log 或 debugger
3. 检查 mock 是否正确设置
4. 验证异步操作是否正确 await
5. 检查测试数据是否符合预期

参考：
- 测试指南：specs/tenancy/testing.md
- Vitest 文档：https://vitest.dev/guide/
```

### 排查租户隔离问题

```
排查租户数据隔离问题：
- 问题描述：{问题描述}
- 影响范围：{哪些接口/操作}

检查清单：
1. 验证 TenantInterceptor 是否正确执行
2. 检查 AsyncLocalStorage 上下文是否正确设置
3. 验证 MikroORM filter 是否生效
4. 检查数据库查询是否包含 tenantId 过滤条件
5. 使用日志追踪请求处理流程

参考：
- 决策文档：specs/tenancy/decisions.md#ADR-003
- 实现示例：libs/tenancy/infrastructure/interceptors/tenant.interceptor.ts
```

---

## 代码审查

### 审查 Pull Request

```
审查 {PR Title}：
- PR 描述：{PR 链接}
- 变更范围：{变更的文件/模块}

审查清单：
1. 是否符合设计文档（specs/tenancy/design.md）
2. 测试覆盖率是否达标（>90%）
3. 代码风格是否符合规范（Biome）
4. 是否有 TSDoc 注释（公共 API）
5. 是否有 LSP 错误
6. 是否遵循 DDD 分层架构
7. 领域层是否保持纯净（无框架依赖）

参考：
- AGENTS.md：specs/tenancy/AGENTS.md
- 代码规范：AGENTS.md#代码规范
```

---

## 文档编写

### 编写 API 文档

```
为 {API Endpoint} 编写 Swagger 文档：
- 接口路径：{路径}
- 请求方法：{GET/POST/PATCH/DELETE}
- 请求参数：{参数列表}
- 响应格式：{响应结构}
- 错误码：{错误码列表}

参考：
- NestJS Swagger：https://docs.nestjs.com/openapi/introduction
- 现有示例：apps/gateway/src/tenant/tenant.controller.ts
```

### 编写使用指南

```
编写 {FeatureName} 使用指南：
- 功能描述：{功能描述}
- 使用场景：{使用场景}
- 配置方法：{配置步骤}
- 示例代码：{代码示例}
- 常见问题：{FAQ}

目标受众：开发者
文档位置：libs/tenancy/docs/usage-guide.md

参考：
- 现有文档：libs/shared/context/README.md
```

---

## 性能优化

### 优化查询性能

```
优化 {QueryName} 查询性能：
- 当前性能：{响应时间/资源占用}
- 目标性能：{目标响应时间}
- 瓶颈分析：{瓶颈点}

优化方案：
1. 添加数据库索引
2. 使用缓存（Redis/内存缓存）
3. 优化查询语句（避免 N+1）
4. 分页查询
5. 异步处理

参考：
- MikroORM 优化：https://mikro-orm.io/docs/query-builder
- 缓存策略：specs/tenancy/decisions.md#ADR-004
```

### 优化配额检查

```
优化租户配额检查性能：
- 当前策略：{当前实现}
- 性能问题：{问题描述}

优化方案：
1. 使用缓存（Redis）
2. 异步更新使用量
3. 批量检查
4. 预加载配额信息

参考：
- 决策文档：specs/tenancy/decisions.md#ADR-004
- 实现示例：libs/tenancy/application/services/quota-check.service.ts
```

---

## 常见任务

### 添加新的租户套餐

```
添加新的租户套餐：{套餐名称}
- 套餐级别：{FREE/STARTER/PRO/ENTERPRISE}
- 配额限制：
  - 最大组织数：{数量}
  - 最大成员数：{数量}
  - 最大存储空间：{GB}
- 特性列表：{特性列表}

步骤：
1. 更新 TenantPlan 值对象（添加新套餐）
2. 更新 TenantQuota.createForPlan()（添加配额映射）
3. 更新数据库迁移脚本（如果有枚举约束）
4. 编写单元测试
5. 更新文档

参考：
- 设计文档：specs/tenancy/design.md#技术设计
- 现有实现：libs/tenancy/domain/tenant/tenant-plan.vo.ts
```

### 添加新的配额资源类型

```
添加新的配额资源类型：{资源名称}
- 资源类型：{资源名称}
- 计费方式：{计费方式}
- 限制单位：{单位}

步骤：
1. 更新 TenantQuota 值对象（添加新属性）
2. 更新 checkQuota 方法（支持新资源类型）
3. 更新 QuotaCheckService（添加检查逻辑）
4. 编写单元测试
5. 更新 API 文档

参考：
- 设计文档：specs/tenancy/design.md#技术设计
- 现有实现：libs/tenancy/domain/tenant/tenant-quota.vo.ts
```
