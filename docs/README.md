# Oksai.cc 项目文档

> **文档中心** | 最后更新：2026-03-06

---

## 📚 文档导航

### 🚀 快速开始

- [项目概览](../README.md) - 项目介绍和快速开始
- [开发指南](../AGENTS.md) - AI 助手规则和开发规范

### 🏗️ 架构文档

#### 系统架构
- [系统架构](./02-architecture/ARCHITECTURE.md) - 整体系统架构设计
- [认证系统架构](./02-architecture/AUTHENTICATION_ARCHITECTURE.md) - 认证系统详细架构 ⭐ 推荐

#### Better Auth
- [Better Auth 集成](./05-features/BETTER_AUTH_INTEGRATION.md) - Better Auth 认证集成方案
- [Better Auth 最佳实践](./05-features/BETTER_AUTH_BEST_PRACTICES.md) - Better Auth 使用建议
- [Better Auth 优化](./05-features/BETTER_AUTH_OPTIMIZATION.md) - 性能优化指南

#### OAuth 集成
- [GitHub OAuth 设置](./05-features/GITHUB_OAUTH_SETUP.md) - GitHub OAuth 配置
- [Google OAuth 设置](./05-features/GOOGLE_OAUTH_SETUP.md) - Google OAuth 配置

---

### 📘 开发指南

#### 配置和设置
- [TypeScript 配置指南](./03-guides/typescript-configuration.md) - TypeScript 项目配置详解
  - 三层配置策略
  - 构建工具选择（tsc vs tsup）
  - 常见问题排查

#### MikroORM
- [Entity 设计指南](./03-guides/entity-design-guide.md) - MikroORM Entity 设计规范
- [MikroORM 使用指南](./03-guides/mikro-orm-usage-guide.md) - MikroORM 完整使用手册

#### 核心库使用
- [Logger 使用指南](./03-guides/logger-usage-guide.md) - 日志系统使用说明
- [Config 使用指南](./03-guides/config-usage-guide.md) - 配置管理使用说明
- [Context 使用指南](./03-guides/context-usage-guide.md) - 上下文管理使用说明
- [Contracts 管理指南](./03-guides/contracts-management-guide.md) - 类型契约管理说明

---

### 🔄 迁移文档

#### 已完成迁移
- [Vitest 迁移指南](./04-migration/vitest-migration.md) - Jest → Vitest 迁移完整记录
- [Drizzle → MikroORM 迁移](./04-migration/drizzle-to-mikro-orm.md) - Better Auth 迁移完整指南
- [MikroORM 迁移进度](./04-migration/mikro-orm-migration-progress.md) - MikroORM 迁移总体进度（已完成）

#### 迁移记录
- [MikroORM 迁移计划](./04-migration/mikro-orm-migration-plan.md)
- [MikroORM 迁移 Phase2](./04-migration/mikro-orm-migration-phase2-progress.md)
- [MikroORM Gateway 迁移完成](./04-migration/mikro-orm-gateway-migration-complete.md)
- [MikroORM 迁移最终总结](./04-migration/mikro-orm-migration-final-summary.md)
- [Drizzle 清理计划](./04-migration/drizzle-removal-plan.md)
- [Drizzle 清理进度](./04-migration/drizzle-removal-progress.md)
- [Drizzle 清理 Phase4 完成](./04-migration/drizzle-removal-phase4-complete.md)
- [Drizzle 清理项目完成](./04-migration/drizzle-removal-project-complete.md)

---

### 🎯 功能实现

#### 前端开发
- [前端对齐](./05-features/FRONTEND_ALIGNMENT.md) - 前端开发规范
- [前端设置](./05-features/FRONTEND_SETUP.md) - 前端项目配置
- [前端启动](./05-features/FRONTEND_STARTUP.md) - 前端启动流程

#### 开发工具
- [Lint 机制](./05-features/LINT_MECHANISM.md) - 代码检查规范

#### 实现总结
- [实现总结](./05-features/IMPLEMENTATION_SUMMARY.md) - 功能实现总结
- [实现完成](./05-features/IMPLEMENTATION_COMPLETE.md) - 功能完成报告
- [验证清单](./05-features/VERIFICATION_CHECKLIST.md) - 功能验证清单

---

### 🔧 运维部署

#### 认证系统
- [认证运维](./06-operations/AUTHENTICATION.md) - 认证系统运维指南

#### 缓存系统
- [Redis 缓存](./06-operations/REDIS_CACHE.md) - Redis 缓存使用说明

---

### 📊 项目评估

#### 阶段性总结
- [项目评估](./07-assessment/PROJECT-EVALUATION.md) - 项目整体评估
- [Phase5 Task1 总结](./07-assessment/PHASE5-TASK1-SUMMARY.md) - 阶段任务总结
- [Gateway 验证](./07-assessment/GATEWAY_STARTUP_VERIFICATION.md) - Gateway 启动验证
- [Gateway 验证总结](./07-assessment/GATEWAY_VERIFICATION_SUMMARY.md) - 验证结果总结

#### 专项评估
- [认证系统评估](./07-assessment/authentication-system-evaluation.md)
- [架构可行性评估](./07-assessment/architecture-feasibility-assessment.md)
- [Drizzle ORM 事件溯源评估](./07-assessment/drizzle-orm-event-sourcing-assessment.md)

---

### 📖 参考文档

#### Better Auth 深度分析
- [Better Auth 适配器工厂分析](./08-reference/better-auth-adapter-factory-deep-analysis.md)
- [Better Auth Core 分析](./08-reference/better-auth-core-deep-analysis.md)
- [Better Auth MikroORM 契约评估](./08-reference/better-auth-mikro-orm-dbadapter-contract-evaluation.md)
- [Better Auth MikroORM createSchema 评估](./08-reference/better-auth-mikro-orm-createschema-evaluation.md)
- [Better Auth MikroORM 库评估](./08-reference/better-auth-mikro-orm-library-assessment.md)

#### Admin Plugin
- [Admin Plugin 完成报告](./08-reference/admin-plugin-completion-report.md)
- [Admin Plugin 部署指南](./08-reference/admin-plugin-deployment-guide.md)
- [Admin Plugin 部署记录](./08-reference/admin-plugin-deployment-record.md)
- [Admin Plugin 迁移计划](./08-reference/admin-plugin-migration-plan.md)
- [Admin Plugin 迁移 Week1](./08-reference/admin-plugin-migration-week1-report.md)

#### API Key 迁移
- [API Key 迁移总结](./08-reference/api-key-migration-summary.md)
- [API Key 迁移 Week1](./08-reference/api-key-migration-week1-report.md)
- [API Key 迁移 Week3](./08-reference/api-key-migration-week3-report.md)

#### OAuth Provider
- [OAuth Provider 迁移评估](./08-reference/oauth-provider-migration-evaluation.md)

#### 文档迁移
- [文档迁移指南](./08-reference/DOCUMENTATION_MIGRATION.md)

---

### 🗄️ 历史归档

- [archive/](./archive/) - 历史文档归档
  - `auth/` - 旧认证文档
  - `setup/` - 旧设置文档
  - `hardcode-migration-examples.md` - 硬编码迁移示例

---

## 🎯 按场景查找

### 我是新开发者

1. 阅读 [项目概览](../README.md)
2. 配置开发环境：[TypeScript 配置](./03-guides/typescript-configuration.md)
3. 了解开发规范：[AGENTS.md](../AGENTS.md)

### 遇到构建问题

1. 查看 [TypeScript 配置](./03-guides/typescript-configuration.md) 的故障排除章节
2. 参考迁移文档了解历史问题
3. 执行标准清理流程

### 需要添加新功能

1. 阅读 [Spec 优先开发](../specs/README.md)
2. 参考现有功能实现文档
3. 遵循 [AGENTS.md](../AGENTS.md) 中的规范

### 配置认证和授权

1. [认证系统架构](./02-architecture/AUTHENTICATION_ARCHITECTURE.md) - 认证系统整体架构 ⭐ 推荐阅读
2. [Better Auth 集成](./05-features/BETTER_AUTH_INTEGRATION.md)
3. [Better Auth 最佳实践](./05-features/BETTER_AUTH_BEST_PRACTICES.md)
4. [GitHub OAuth 设置](./05-features/GITHUB_OAUTH_SETUP.md)
5. [Google OAuth 设置](./05-features/GOOGLE_OAUTH_SETUP.md)

### 使用 MikroORM

1. [Entity 设计指南](./03-guides/entity-design-guide.md)
2. [MikroORM 使用指南](./03-guides/mikro-orm-usage-guide.md)
3. [Drizzle → MikroORM 迁移](./04-migration/drizzle-to-mikro-orm.md)

---

## 📁 文档结构

```
docs/
├── README.md                              # 本文件 - 文档索引
├── REORGANIZATION_PLAN.md                 # 文档重组计划
│
├── 01-quick-start/                        # 快速开始
│
├── 02-architecture/                       # 架构文档
│   ├── ARCHITECTURE.md                    # 系统架构
│   └── AUTHENTICATION_ARCHITECTURE.md     # 认证系统架构
│
├── 03-guides/                             # 开发指南
│   ├── typescript-configuration.md        # TypeScript 配置
│   ├── entity-design-guide.md             # Entity 设计指南
│   ├── mikro-orm-usage-guide.md           # MikroORM 使用指南
│   ├── logger-usage-guide.md              # Logger 使用指南
│   ├── config-usage-guide.md              # Config 使用指南
│   ├── context-usage-guide.md             # Context 使用指南
│   └── contracts-management-guide.md      # Contracts 管理指南
│
├── 04-migration/                          # 迁移文档
│   ├── vitest-migration.md               # Vitest 迁移指南
│   ├── drizzle-to-mikro-orm.md           # Drizzle → MikroORM 迁移指南
│   ├── mikro-orm-migration-progress.md   # MikroORM 迁移进度
│   └── [其他迁移记录]
│
├── 05-features/                           # 功能实现
│   ├── BETTER_AUTH_*.md                   # Better Auth 相关文档
│   ├── *_OAUTH_*.md                       # OAuth 配置文档
│   ├── FRONTEND_*.md                      # 前端相关文档
│   └── [其他功能文档]
│
├── 06-operations/                         # 运维部署
│   ├── AUTHENTICATION.md                  # 认证运维
│   └── REDIS_CACHE.md                     # Redis 缓存
│
├── 07-assessment/                         # 项目评估
│   ├── PROJECT-EVALUATION.md              # 项目评估
│   ├── phase*-*.md                        # 阶段性总结
│   └── [其他评估文档]
│
├── 08-reference/                          # 参考文档
│   ├── better-auth-*.md                   # Better Auth 深度分析
│   ├── admin-plugin-*.md                  # Admin Plugin 参考
│   ├── api-key-*.md                       # API Key 迁移参考
│   └── [其他参考文档]
│
└── archive/                               # 历史归档
    ├── auth/                              # 旧认证文档
    ├── setup/                             # 旧设置文档
    └── [其他历史文档]
```

---

## 🔍 快速搜索

### 按关键词

| 关键词 | 相关文档 |
|--------|---------|
| TypeScript 配置 | [typescript-configuration.md](./03-guides/typescript-configuration.md) |
| 构建问题 | [typescript-configuration.md](./03-guides/typescript-configuration.md#故障排除指南) |
| 测试框架 | [vitest-migration.md](./04-migration/vitest-migration.md) |
| Drizzle 迁移 | [drizzle-to-mikro-orm.md](./04-migration/drizzle-to-mikro-orm.md) |
| MikroORM | [mikro-orm-migration-progress.md](./04-migration/mikro-orm-migration-progress.md) |
| MikroORM 指南 | [mikro-orm-usage-guide.md](./03-guides/mikro-orm-usage-guide.md) |
| Entity 设计 | [entity-design-guide.md](./03-guides/entity-design-guide.md) |
| 认证架构 | [AUTHENTICATION_ARCHITECTURE.md](./02-architecture/AUTHENTICATION_ARCHITECTURE.md) |
| 认证授权 | [BETTER_AUTH_INTEGRATION.md](./05-features/BETTER_AUTH_INTEGRATION.md) |
| OAuth 2.0 | [AUTHENTICATION_ARCHITECTURE.md](./02-architecture/AUTHENTICATION_ARCHITECTURE.md#oauth-20-授权流程) |
| 双因素认证 | [AUTHENTICATION_ARCHITECTURE.md](./02-architecture/AUTHENTICATION_ARCHITECTURE.md#4-双因素认证-2fa-流程) |
| 前端开发 | [FRONTEND_ALIGNMENT.md](./05-features/FRONTEND_ALIGNMENT.md) |
| 代码规范 | [AGENTS.md](../AGENTS.md) |
| Logger | [logger-usage-guide.md](./03-guides/logger-usage-guide.md) |
| Config | [config-usage-guide.md](./03-guides/config-usage-guide.md) |
| Context | [context-usage-guide.md](./03-guides/context-usage-guide.md) |
| Contracts | [contracts-management-guide.md](./03-guides/contracts-management-guide.md) |

---

## 📊 文档统计

| 类别 | 数量 | 说明 |
|-----|------|------|
| 架构文档 | 2 | 系统架构 + 认证架构 |
| 开发指南 | 7 | 配置、ORM、核心库使用 |
| 迁移文档 | 10+ | Vitest、MikroORM 迁移记录 |
| 功能实现 | 10+ | Better Auth、前端、OAuth |
| 运维部署 | 2 | 认证运维、Redis 缓存 |
| 项目评估 | 15+ | 阶段总结、专项评估 |
| 参考文档 | 20+ | 深度分析、技术参考 |
| **总计** | **70+** | **完整覆盖** |

---

## 🤝 贡献指南

### 添加新文档

1. **选择合适的目录**：
   - 快速开始 → `01-quick-start/`
   - 架构设计 → `02-architecture/`
   - 开发指南 → `03-guides/`
   - 迁移记录 → `04-migration/`
   - 功能实现 → `05-features/`
   - 运维部署 → `06-operations/`
   - 项目评估 → `07-assessment/`
   - 参考资料 → `08-reference/`

2. **遵循命名规范**：
   - 使用小写和连字符：`my-feature.md`
   - 描述性名称：`typescript-configuration.md`
   - 避免缩写：`vitest-migration.md` 而非 `vitest-mig.md`

3. **更新索引**：
   - 在本文件中添加链接
   - 在相关章节添加说明
   - 在关键词表中添加条目

### 更新现有文档

1. 在文档顶部标注更新日期
2. 在变更日志中记录重要修改
3. 同步更新相关文档

---

## 📝 文档模板

### 技术文档模板

```markdown
# 文档标题

> **版本**: v1.0 | **日期**: YYYY-MM-DD | **作者**: Name

## 概述

简要描述文档内容。

## 背景

为什么需要这个功能/配置？

## 实现方案

### 方案 1

描述...

### 方案 2

描述...

## 使用指南

步骤 1...
步骤 2...

## 常见问题

### Q1: 问题描述

**A**: 解决方案

## 参考资料

- [链接 1](url)
- [链接 2](url)
```

---

## 📞 获取帮助

- **GitHub Issues**: 在项目中创建 Issue
- **团队讨论**: 参考团队会议记录
- **AI 助手**: 咨询项目 AI 助手（基于 AGENTS.md）

---

**维护者**: Oksai Team  
**最后更新**: 2026-03-06
