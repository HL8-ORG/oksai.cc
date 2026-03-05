# 文档更新索引

本目录包含项目的重大更新和变更记录。

## 更新记录

### 2026-03-06

#### 1. Spec 决策模板更新

**标题：** Spec Decisions 通用决策完整更新总结  
**文件：** [decisions-template-complete-summary.md](./decisions-template-complete-summary.md)  
**类型：** 模板更新  
**影响范围：** 所有 spec

**内容：**
- ✅ UDR-001：优先使用共享模块
- ✅ UDR-002：文档管理规范
- ✅ 更新模板和所有现有 spec

---

**标题：** 共享模块使用规范  
**文件：** [decisions-template-shared-modules.md](./decisions-template-shared-modules.md)  
**类型：** 通用决策  
**决策编号：** UDR-001

**内容：**
- 共享模块清单（5 个模块）
- 使用示例
- 最佳实践

---

**标题：** 文档管理规范  
**文件：** [decisions-template-documentation-management.md](./decisions-template-documentation-management.md)  
**类型：** 通用决策  
**决策编号：** UDR-002

**内容：**
- 文档组织规范
- 命名规范
- 目录结构示例

---

#### 2. Spec 命令文档同步

**标题：** Spec 命令文档与模板同步  
**文件：** [spec-command-templates-sync.md](./spec-command-templates-sync.md)  
**类型：** 命令文档更新  
**影响范围：** `/spec` 命令

**内容：**
- 新增 `testing.md` 模板说明
- 新增 `workflow.md` 模板说明
- 更新最佳实践
- 更新文件结构说明

---

**标题：** Spec Decisions 模板更新  
**文件：** [spec-decisions-template-update.md](./spec-decisions-template-update.md)  
**类型：** 模板更新  
**状态：** 已被 `decisions-template-complete-summary.md` 替代

**说明：** 此文档为 UDR-001 的初步更新记录，已被完整总结替代。

---

## 文档分类

### 按类型分类

| 类型 | 文档 | 说明 |
|------|------|------|
| 模板更新 | [decisions-template-complete-summary.md](./decisions-template-complete-summary.md) | 通用决策完整总结 |
| 通用决策 | [decisions-template-shared-modules.md](./decisions-template-shared-modules.md) | UDR-001：共享模块 |
| 通用决策 | [decisions-template-documentation-management.md](./decisions-template-documentation-management.md) | UDR-002：文档管理 |
| 命令更新 | [spec-command-templates-sync.md](./spec-command-templates-sync.md) | `/spec` 命令同步 |

### 按优先级分类

| 优先级 | 文档 | 必读 |
|--------|------|------|
| P0 | [decisions-template-complete-summary.md](./decisions-template-complete-summary.md) | ✅ 是 |
| P0 | [decisions-template-shared-modules.md](./decisions-template-shared-modules.md) | ✅ 是 |
| P0 | [decisions-template-documentation-management.md](./decisions-template-documentation-management.md) | ✅ 是 |
| P1 | [spec-command-templates-sync.md](./spec-command-templates-sync.md) | ⭕ 推荐 |

## 快速导航

### 我是开发者

必读文档：
1. [共享模块使用规范](./decisions-template-shared-modules.md) - 了解如何使用共享模块
2. [文档管理规范](./decisions-template-documentation-management.md) - 了解如何组织文档

### 我是新成员

推荐阅读顺序：
1. [完整总结](./decisions-template-complete-summary.md) - 了解通用决策
2. [共享模块使用规范](./decisions-template-shared-modules.md) - 学习共享模块
3. [文档管理规范](./decisions-template-documentation-management.md) - 学习文档组织

### 我是维护者

参考文档：
1. [完整总结](./decisions-template-complete-summary.md) - 包含后续维护计划
2. [文档管理规范](./decisions-template-documentation-management.md) - 包含审查清单

## 更新日志

### v1.0 (2026-03-06)

**新增：**
- ✅ UDR-001：优先使用共享模块
- ✅ UDR-002：文档管理规范
- ✅ Spec 命令文档同步（testing.md、workflow.md）

**更新：**
- ✅ 所有现有 spec 的 decisions.md

**文档：**
- ✅ 创建 5 个更新文档
- ✅ 创建本索引文档

## 相关资源

### 项目文档

- [项目 README](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [Spec 模板](../../specs/_templates/)

### 工具命令

- `/spec new <feature>` - 创建新 spec
- `/spec list` - 列出所有 spec
- `/spec status <feature>` - 查看 spec 状态

---

**维护者：** oksai.cc 团队  
**创建日期：** 2026-03-06  
**最后更新：** 2026-03-06
