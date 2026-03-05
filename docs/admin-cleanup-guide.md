# Admin 插件 - 旧代码清理指南

> **版本**: v1.0  
> **日期**: 2026-04-01  
> **状态**: 准备执行  
> **执行时间**: Admin 插件稳定运行 2 周后

---

## 📋 目录

1. [清理前检查](#1-清理前检查)
2. [需要清理的文件](#2-需要清理的文件)
3. [清理步骤](#3-清理步骤)
4. [清理后验证](#4-清理后验证)
5. [回滚方案](#5-回滚方案)

---

## 1. 清理前检查

### 1.1 稳定性检查

**执行时间**: Admin 插件稳定运行 2 周后（建议 2026-04-15 之后）

**检查清单**:
- [ ] Admin 插件已稳定运行 14 天
- [ ] 无 Critical 或 High 级别的 Bug
- [ ] 错误率 < 0.1%
- [ ] 用户无重大投诉
- [ ] 性能指标符合预期
- [ ] 所有测试通过

### 1.2 依赖检查

**检查旧代码是否仍被引用**:

```bash
# 检查 impersonation.service.ts 的引用
grep -r "ImpersonationService" apps/gateway/src --exclude-dir=node_modules

# 预期结果：无引用（或仅在测试文件中）
```

### 1.3 备份旧代码

**创建备份分支**:

```bash
# 1. 创建备份分支
git checkout -b backup/old-impersonation-service

# 2. 提交当前状态
git add .
git commit -m "backup: 旧 impersonation.service.ts 移除前备份"

# 3. 推送备份分支
git push origin backup/old-impersonation-service

# 4. 切回主分支
git checkout main
```

---

## 2. 需要清理的文件

### 2.1 核心文件

| 文件 | 行数 | 说明 | 状态 |
|------|------|------|------|
| `apps/gateway/src/auth/impersonation.service.ts` | 153 | 旧的用户模拟服务 | 🗑️ 待删除 |
| `apps/gateway/src/auth/impersonation.dto.ts` | 50 | 旧的 DTO | 🗑️ 待删除 |
| `apps/gateway/src/auth/impersonation.service.spec.ts` | 100 | 旧的单元测试 | 🗑️ 待删除 |
| `apps/gateway/src/auth/impersonation.integration.spec.ts` | 80 | 旧的集成测试 | 🗑️ 待删除 |

**总计**: 4 个文件，~383 行代码

### 2.2 可能的测试文件

| 文件 | 行数 | 说明 | 状态 |
|------|------|------|------|
| `apps/gateway/src/auth/impersonation*.spec.ts` | 180 | 所有相关测试 | 🗑️ 待删除 |

### 2.3 文档文件（可选保留）

| 文件 | 说明 | 状态 |
|------|------|------|
| `docs/impersonation-legacy.md` | 归档文档（可选保留） | 📁 可保留 |

---

## 3. 清理步骤

### 3.1 Step 1: 更新模块依赖

**移除对旧服务的引用**:

```typescript
// apps/gateway/src/auth/auth.module.ts

// ❌ 删除这些行
import { ImpersonationService } from "./impersonation.service";

// ❌ 从 providers 中删除
providers: [
  // ImpersonationService,  ← 删除
  // ...
],

// ❌ 从 exports 中删除
exports: [
  // ImpersonationService,  ← 删除
  // ...
],
```

### 3.2 Step 2: 删除旧文件

**执行删除**:

```bash
# 1. 删除核心文件
rm apps/gateway/src/auth/impersonation.service.ts
rm apps/gateway/src/auth/impersonation.dto.ts

# 2. 删除测试文件
rm apps/gateway/src/auth/impersonation.service.spec.ts
rm apps/gateway/src/auth/impersonation.integration.spec.ts

# 3. 检查是否有遗漏
find apps/gateway/src/auth -name "*impersonation*" -type f

# 预期：无输出（所有 impersonation 相关文件已删除）
```

### 3.3 Step 3: 更新导入引用

**检查并修复导入**:

```bash
# 1. 搜索所有引用
grep -r "from.*impersonation" apps/gateway/src --exclude-dir=node_modules

# 2. 修复发现的引用
# 将旧的导入替换为新的 Admin Controller
# 例如：
# ❌ import { ImpersonationService } from './impersonation.service';
# ✅ import { AdminController } from './admin.controller';
```

### 3.4 Step 4: 更新测试

**确保测试仍然通过**:

```bash
# 1. 运行所有测试
pnpm test

# 2. 运行 Gateway 测试
pnpm vitest run apps/gateway/src/auth/**/*.spec.ts

# 3. 验证测试覆盖率
pnpm vitest run --coverage

# 预期：所有测试通过，覆盖率 >= 80%
```

### 3.5 Step 5: 构建验证

**确保代码能正常构建**:

```bash
# 1. 清理构建缓存
pnpm nx reset

# 2. 重新构建
pnpm nx build @oksai/gateway

# 3. 检查构建输出
# 预期：构建成功，无错误
```

### 3.6 Step 6: Git 提交

**提交清理变更**:

```bash
# 1. 查看变更
git status

# 2. 添加变更
git add .

# 3. 提交
git commit -m "refactor: 移除旧的 impersonation.service.ts，使用 Better Auth Admin 插件

- 删除 impersonation.service.ts (153 行)
- 删除 impersonation.dto.ts (50 行)
- 删除相关测试文件 (180 行)
- 更新 auth.module.ts 移除旧依赖
- 总计减少 383 行代码

参考: docs/admin-plugin-migration-plan.md"

# 4. 推送
git push origin main
```

---

## 4. 清理后验证

### 4.1 功能验证

**验证清单**:

- [ ] 用户可以正常登录
- [ ] 管理员可以列出用户
- [ ] 管理员可以创建用户
- [ ] 管理员可以设置角色
- [ ] 超级管理员可以删除用户
- [ ] 管理员可以封禁用户
- [ ] 管理员可以模拟用户
- [ ] 管理员可以查看会话

### 4.2 性能验证

**性能指标**:

| 操作 | 基准 | 实际 | 状态 |
|------|------|------|------|
| 列出用户 | < 100ms | ___ ms | [ ] |
| 创建用户 | < 50ms | ___ ms | [ ] |
| 设置角色 | < 30ms | ___ ms | [ ] |
| 模拟用户 | < 50ms | ___ ms | [ ] |

### 4.3 测试验证

**测试覆盖率**:

```bash
# 运行测试并生成覆盖率报告
pnpm vitest run --coverage

# 预期结果：
# - 所有测试通过
# - 覆盖率 >= 80%
# - 无新增的跳过测试
```

### 4.4 构建验证

```bash
# 生产环境构建
pnpm nx build @oksai/gateway --prod

# 预期：
# ✅ 构建成功
# ✅ 无警告或错误
# ✅ 输出文件大小合理
```

---

## 5. 回滚方案

### 5.1 快速回滚

**如果清理后发现问题，立即回滚**:

```bash
# 1. 回滚到上一个提交
git revert HEAD

# 2. 或者恢复备份分支
git checkout backup/old-impersonation-service

# 3. 创建修复分支
git checkout -b fix/restore-impersonation-service

# 4. 恢复删除的文件
git checkout HEAD~1 -- apps/gateway/src/auth/impersonation.service.ts
git checkout HEAD~1 -- apps/gateway/src/auth/impersonation.dto.ts
git checkout HEAD~1 -- apps/gateway/src/auth/impersonation*.spec.ts

# 5. 更新模块依赖
# 手动编辑 auth.module.ts 恢复旧依赖

# 6. 运行测试
pnpm test

# 7. 提交修复
git add .
git commit -m "fix: 恢复 impersonation.service.ts"
```

### 5.2 部分回滚

**如果只有部分功能有问题**:

```bash
# 1. 从备份分支提取特定文件
git checkout backup/old-impersonation-service -- apps/gateway/src/auth/impersonation.service.ts

# 2. 创建临时混合方案
# - 保留 Admin Controller（新功能）
# - 临时恢复旧服务（兼容性）

# 3. 逐步修复问题

# 4. 完全移除旧代码（修复后）
```

---

## 6. 清理时间表

| 时间 | 任务 | 负责人 |
|------|------|--------|
| **Day 1** | 稳定性检查 + 备份 | 后端 |
| **Day 2** | 删除旧文件 + 更新依赖 | 后端 |
| **Day 3** | 测试验证 + 构建验证 | 后端 + QA |
| **Day 4** | 功能验证 + 性能验证 | 后端 + QA |
| **Day 5** | 文档更新 + 最终验收 | 后端 |

---

## 7. 清理后维护

### 7.1 监控（清理后 7 天）

**监控指标**:
- [ ] 错误率 < 0.1%
- [ ] 性能稳定
- [ ] 无用户投诉

### 7.2 文档更新

**需要更新的文档**:
- [ ] API 文档
- [ ] 架构文档
- [ ] 开发指南
- [ ] 运维手册

### 7.3 团队通知

**通知内容**:
```
主题：Admin 插件旧代码清理完成

各位同事，

Admin 插件的旧代码已成功清理：

✅ 删除文件：
  - impersonation.service.ts (153 行)
  - impersonation.dto.ts (50 行)
  - 相关测试文件 (180 行)
  
✅ 总计减少：383 行代码

✅ 新功能：
  - 使用 Better Auth Admin 插件
  - 更好的权限控制
  - 自动审计日志

如有问题，请联系：[技术负责人]

谢谢！
```

---

## 8. 清理检查清单

### 8.1 清理前

- [ ] Admin 插件稳定运行 14 天
- [ ] 无 Critical/High Bug
- [ ] 错误率 < 0.1%
- [ ] 创建备份分支
- [ ] 团队通知

### 8.2 清理中

- [ ] 更新模块依赖
- [ ] 删除旧文件
- [ ] 修复导入引用
- [ ] 更新测试
- [ ] 构建验证
- [ ] Git 提交

### 8.3 清理后

- [ ] 功能验证通过
- [ ] 性能验证通过
- [ ] 测试全部通过
- [ ] 构建成功
- [ ] 文档更新
- [ ] 团队通知

---

## 9. 附录

### 9.1 删除文件清单

```
# 核心文件
apps/gateway/src/auth/impersonation.service.ts
apps/gateway/src/auth/impersonation.dto.ts

# 测试文件
apps/gateway/src/auth/impersonation.service.spec.ts
apps/gateway/src/auth/impersonation.integration.spec.ts

# 总计：4 个文件，383 行代码
```

### 9.2 保留文件

```
# 新实现
apps/gateway/src/auth/admin.controller.ts
apps/gateway/src/auth/admin.dto.ts
apps/gateway/src/auth/user-role.enum.ts
apps/gateway/src/auth/admin.controller.spec.ts
apps/gateway/src/auth/admin.integration.spec.ts

# 文档（可选保留）
docs/impersonation-legacy.md
```

---

**文档状态**: 📋 准备执行  
**执行时间**: 2026-04-15（建议）  
**负责人**: 后端团队
