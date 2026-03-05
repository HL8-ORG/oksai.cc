# Better Auth MikroORM 适配器优化方案

> **状态**: 🟡 规划中  
> **优先级**: P0（高优先级）  
> **预计时间**: 2-3 周  
> **负责人**: oksai.cc 团队

---

## 📋 执行摘要

本优化方案旨在完善 `libs/shared/better-auth-mikro-orm` 适配器，解决以下关键问题：

1. **事务语义弱保证** → 实现真实数据库事务支持
2. **测试覆盖不足** → 添加集成测试和 E2E 测试
3. **关系模型限制** → 提供规避方案和最佳实践
4. **文档不完整** → 编写完整文档和使用示例

**预期收益**：
- ✅ 消除数据不一致风险
- ✅ 提升生产环境稳定性
- ✅ 降低开发和维护成本
- ✅ 提供清晰的迁移路径

---

## 🎯 核心目标

### Phase 1: 核心问题修复（1 周）✅ P0

**目标**：实现真实事务支持 + 基础集成测试

**关键成果**：
- ✅ TransactionManager 实现（包装 MikroORM transactional）
- ✅ mikroOrmAdapter 配置增强（可选事务配置）
- ✅ 集成测试环境搭建（Docker + PostgreSQL）
- ✅ 基础集成测试（CRUD + 事务）
- ✅ 测试覆盖率 > 60%

### Phase 2: 测试和文档完善（1 周）✅ P0

**目标**：完整测试覆盖 + 清晰文档

**关键成果**：
- ✅ 扩展集成测试（并发 + 边界条件）
- ✅ E2E 测试（完整认证流程）
- ✅ 完整文档（README + LIMITATIONS + MIGRATION）
- ✅ 使用示例（3+ 个）
- ✅ 测试覆盖率 > 80%

### Phase 3: 功能扩展（可选，1-2 周）🟡 P2

**目标**：增强功能 + 性能优化

**关键成果**：
- 🔄 关系模型评估和增强
- 🔄 性能优化（缓存、连接池）
- 🔄 监控和可观测性

---

## 📊 当前状态

### 已完成 ✅

**基础实现**（已完成）：
- ✅ 核心 CRUD 操作（create/findOne/findMany/update/updateMany/delete/deleteMany/count）
- ✅ Where 操作符支持（8 种操作符）
- ✅ 实体名/表名映射
- ✅ 输入输出规范化
- ✅ EntityManager.fork() 上下文隔离

**单元测试**（已完成）：
- ✅ 32/32 测试通过（Vitest）
- ✅ 适配器核心测试
- ✅ 工具函数测试
- ✅ 错误处理测试

**关键契约支持**（评估完成）：
- ✅ 所有核心 DBAdapter 契约已支持
- ⚠️ transaction 使用工厂兜底（需增强）
- ❌ createSchema 未实现（MikroORM 已支持）

### 待完成 ⏳

**Phase 1 任务**：
- [ ] 创建 TransactionManager
- [ ] 更新 mikroOrmAdapter 配置
- [ ] 创建集成测试环境
- [ ] 编写基础集成测试

**Phase 2 任务**：
- [ ] 扩展集成测试
- [ ] 创建 E2E 测试
- [ ] 编写文档
- [ ] 创建使用示例

---

## 🔍 关键发现

### 1. 事务语义弱保证 ⚠️

**问题**：
```typescript
// 当前实现
transaction(cb) {
  // ❌ 工厂兜底逻辑，顺序执行 cb
  // ❌ 没有真实数据库事务边界
}
```

**影响**：
- 用户创建成功，组织创建失败 → 数据不一致
- 无法保证多写操作的原子性

**解决方案**：
```typescript
// Phase 1 实现
class TransactionManager {
  async execute<T>(cb: (em: EntityManager) => Promise<T>) {
    return this.orm.em.fork().transactional(cb);  // ✅ 真实事务
  }
}
```

### 2. 关系模型限制 ⚠️

**限制**：
- ❌ 不支持 m:m（多对多）关系
- ❌ 不支持 1:m（一对多）关系

**影响**：
- Better Auth Organization 插件可能受影响

**规避方案**：
```typescript
// ✅ 使用中间实体
@Entity()
class OrganizationMember {
  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToOne(() => User)
  member: User;

  @Property()
  role: string;
}
```

---

## 📈 实施计划

### 时间线

```
Week 1 (Phase 1): 核心问题修复
  Day 1-2: 创建 TransactionManager + 单元测试
  Day 3: 更新 mikroOrmAdapter 配置
  Day 4: 创建集成测试环境（Docker）
  Day 5-7: 编写基础集成测试

Week 2 (Phase 2): 测试和文档完善
  Day 1-2: 扩展集成测试（并发 + 边界）
  Day 3-4: 创建 E2E 测试
  Day 5-6: 编写文档（README + LIMITATIONS + MIGRATION）
  Day 7: 创建使用示例

Week 3-4 (Phase 3, 可选): 功能扩展
  评估关系模型增强可行性
  性能优化
  监控和可观测性
```

### 资源需求

**人力资源**：
- 1 名全职开发者（Phase 1-2）
- Code Review（每周 2-3 次）

**技术资源**：
- PostgreSQL 测试环境（Docker）
- CI/CD 集成测试环境

---

## 📚 相关文档

### 设计文档

- [设计文档](./design.md) - 完整的技术设计、用户故事、BDD 场景
- [实现进度](./implementation.md) - 当前进度和任务列表
- [架构决策](./decisions.md) - 5 个关键 ADR
- [后续工作](./future-work.md) - Phase 3 和未来规划

### 参考文档

- [Better Auth Core 深度分析](../../docs/better-auth-core-deep-analysis.md)
- [Better Auth MikroORM DBAdapter 契约评估](../../docs/better-auth-mikro-orm-dbadapter-contract-evaluation.md)
- [Better Auth MikroORM 库评估](../../docs/better-auth-mikro-orm-library-assessment.md)

### AI 助手

- [AGENTS.md](./AGENTS.md) - AI 助手开发指南
- [prompts.md](./prompts.md) - 常用提示词集合

---

## 🚀 快速开始

### 查看当前进度

```bash
# 查看实现进度
cat specs/better-auth-mikro-orm-optimization/implementation.md

# 查看设计文档
cat specs/better-auth-mikro-orm-optimization/design.md
```

### 开始开发

```bash
# 使用 spec 命令
/spec continue better-auth-mikro-orm-optimization

# 或者直接开始
阅读 specs/better-auth-mikro-orm-optimization/design.md
阅读 specs/better-auth-mikro-orm-optimization/implementation.md
开始 Phase 1 任务 1
```

### 运行测试

```bash
# 单元测试
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/

# 集成测试（需要 Docker）
docker-compose -f docker-compose.test.yml up -d
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/integration/
```

---

## 🎖️ 成功标准

### Phase 1 完成标准

- [ ] TransactionManager 实现（覆盖率 > 90%）
- [ ] mikroOrmAdapter 事务配置（向后兼容）
- [ ] 集成测试环境搭建（Docker + PostgreSQL）
- [ ] 10+ 集成测试通过
- [ ] 测试覆盖率 > 60%

### Phase 2 完成标准

- [ ] 20+ 集成测试通过（并发 + 边界）
- [ ] 5+ E2E 测试通过
- [ ] 完整文档（README + LIMITATIONS + MIGRATION）
- [ ] 3+ 使用示例
- [ ] 测试覆盖率 > 80%

### 整体成功标准

- ✅ 真实事务支持（数据一致性）
- ✅ 完整测试覆盖（80%+）
- ✅ 清晰文档和示例
- ✅ 生产环境可用

---

## 📞 联系方式

**项目负责人**: oksai.cc 团队  
**技术支持**: 参考 `AGENTS.md` 和 `prompts.md`  
**问题反馈**: 创建 GitHub Issue 或联系团队

---

**文档版本**: 1.0  
**创建日期**: 2026-03-05  
**最后更新**: 2026-03-05  
**维护者**: oksai.cc 团队
