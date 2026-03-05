# Oksai.cc 项目文档

> **文档中心** | 最后更新：2026-03-05

---

## 📚 文档导航

### 🚀 快速开始

- [项目概览](../README.md) - 项目介绍和快速开始
- [开发指南](../AGENTS.md) - AI 助手规则和开发规范

### ⚙️ 配置和设置

- [TypeScript 配置指南](./guides/typescript-configuration.md) - TypeScript 项目配置详解
  - 三层配置策略
  - 构建工具选择（tsc vs tsup）
  - 常见问题排查
  
### 🔄 迁移文档

- [Vitest 迁移指南](./migration/vitest-migration.md) - Jest → Vitest 迁移完整记录
- [Drizzle → MikroORM 迁移](./migration/drizzle-to-mikro-orm.md) - Better Auth 迁移完整指南
- [MikroORM 迁移进度](./migration/mikro-orm-migration-progress.md) - MikroORM 迁移总体进度（已完成）

### 🏗️ 架构文档

- [系统架构](./ARCHITECTURE.md) - 整体系统架构设计
- [认证系统架构](./AUTHENTICATION_ARCHITECTURE.md) - 认证系统详细架构 ⭐ 新增
- [Better Auth 集成](./BETTER_AUTH_INTEGRATION.md) - Better Auth 认证集成方案
- [Better Auth 最佳实践](./BETTER_AUTH_BEST_PRACTICES.md) - Better Auth 使用建议
- [Better Auth 优化](./BETTER_AUTH_OPTIMIZATION.md) - 性能优化指南

### 📋 开发规范

- [前端对齐](./FRONTEND_ALIGNMENT.md) - 前端开发规范
- [前端设置](./FRONTEND_SETUP.md) - 前端项目配置
- [前端启动](./FRONTEND_STARTUP.md) - 前端启动流程
- [Lint 机制](./LINT_MECHANISM.md) - 代码检查规范

### 🔧 功能实现

- [GitHub OAuth 设置](./GITHUB_OAUTH_SETUP.md) - GitHub OAuth 配置
- [Google OAuth 设置](./GOOGLE_OAUTH_SETUP.md) - Google OAuth 配置
- [实现总结](./IMPLEMENTATION_SUMMARY.md) - 功能实现总结
- [实现完成](./IMPLEMENTATION_COMPLETE.md) - 功能完成报告
- [验证清单](./VERIFICATION_CHECKLIST.md) - 功能验证清单

### 📊 项目评估

- [项目评估](./PROJECT-EVALUATION.md) - 项目整体评估
- [Phase5 Task1 总结](./PHASE5-TASK1-SUMMARY.md) - 阶段任务总结
- [Gateway 验证](./GATEWAY_STARTUP_VERIFICATION.md) - Gateway 启动验证
- [Gateway 验证总结](./GATEWAY_VERIFICATION_SUMMARY.md) - 验证结果总结

---

## 🎯 按场景查找

### 我是新开发者

1. 阅读 [项目概览](../README.md)
2. 配置开发环境：[TypeScript 配置](./guides/typescript-configuration.md)
3. 了解开发规范：[AGENTS.md](../AGENTS.md)

### 遇到构建问题

1. 查看 [TypeScript 配置](./guides/typescript-configuration.md) 的故障排除章节
2. 参考迁移文档了解历史问题
3. 执行标准清理流程

### 需要添加新功能

1. 阅读 [Spec 优先开发](../specs/README.md)
2. 参考现有功能实现文档
3. 遵循 [AGENTS.md](../AGENTS.md) 中的规范

### 配置认证和授权

1. [认证系统架构](./AUTHENTICATION_ARCHITECTURE.md) - 认证系统整体架构 ⭐ 推荐阅读
2. [Better Auth 集成](./BETTER_AUTH_INTEGRATION.md)
3. [Better Auth 最佳实践](./BETTER_AUTH_BEST_PRACTICES.md)
4. [GitHub OAuth 设置](./GITHUB_OAUTH_SETUP.md)
5. [Google OAuth 设置](./GOOGLE_OAUTH_SETUP.md)

---

## 📁 文档结构

```
docs/
├── README.md                              # 本文件 - 文档索引
├── guides/                                # 配置和开发指南
│   └── typescript-configuration.md        # TypeScript 配置详解
├── migration/                             # 迁移文档
│   ├── vitest-migration.md               # Vitest 迁移指南
│   ├── drizzle-to-mikro-orm.md           # Drizzle → MikroORM 迁移指南
│   └── mikro-orm-migration-progress.md   # MikroORM 迁移进度
├── ARCHITECTURE.md                        # 系统架构
├── BETTER_AUTH_*.md                       # Better Auth 相关文档
├── FRONTEND_*.md                          # 前端相关文档
├── *_OAUTH_*.md                           # OAuth 配置文档
└── [其他文档]
```

---

## 🔍 快速搜索

### 按关键词

| 关键词 | 相关文档 |
|--------|---------|
| TypeScript 配置 | [typescript-configuration.md](./guides/typescript-configuration.md) |
| 构建问题 | [typescript-configuration.md](./guides/typescript-configuration.md#故障排除指南) |
| 测试框架 | [vitest-migration.md](./migration/vitest-migration.md) |
| Drizzle 迁移 | [drizzle-to-mikro-orm.md](./migration/drizzle-to-mikro-orm.md) |
| MikroORM | [mikro-orm-migration-progress.md](./migration/mikro-orm-migration-progress.md) |
| 认证架构 | [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md) |
| 认证授权 | [BETTER_AUTH_INTEGRATION.md](./BETTER_AUTH_INTEGRATION.md) |
| OAuth 2.0 | [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md#oauth-20-授权流程) |
| 双因素认证 | [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md#4-双因素认证-2fa-流程) |
| 前端开发 | [FRONTEND_ALIGNMENT.md](./FRONTEND_ALIGNMENT.md) |
| 代码规范 | [AGENTS.md](../AGENTS.md) |

---

## 🤝 贡献指南

### 添加新文档

1. **选择合适的目录**：
   - 配置指南 → `docs/guides/`
   - 迁移记录 → `docs/migration/`
   - 架构设计 → `docs/`（根目录）

2. **遵循命名规范**：
   - 使用小写和连字符：`my-feature.md`
   - 描述性名称：`typescript-configuration.md`
   - 避免缩写：`vitest-migration.md` 而非 `vitest-mig.md`

3. **更新索引**：
   - 在本文件中添加链接
   - 在相关章节添加说明

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
