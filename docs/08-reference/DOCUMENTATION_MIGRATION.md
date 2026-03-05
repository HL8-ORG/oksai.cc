# 文档重组说明

> **迁移日期**: 2026-03-05  
> **迁移原因**: 统一管理项目文档，提高可维护性

---

## 📁 新目录结构

```
docs/
├── README.md                    # 📚 文档索引（新增）
├── guides/                      # 📖 开发指南（新增）
│   └── typescript-configuration.md
├── migration/                   # 🔄 迁移文档（新增）
│   ├── vitest-migration.md
│   └── mikro-orm-migration-progress.md
├── setup/                       # ⚙️ 配置和设置（新增）
│   └── (待整理)
├── ARCHITECTURE.md              # 🏗️ 架构文档
├── BETTER_AUTH_*.md             # 🔐 Better Auth 相关
├── FRONTEND_*.md                # 🎨 前端相关
├── *_OAUTH_*.md                 # 🔑 OAuth 配置
└── [其他文档]
```

---

## 📋 迁移的文档

### 从根目录迁移

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `docs/migration/vitest-migration.md` | `docs/migration/vitest-migration.md` | Vitest 迁移指南 |

### 从 docs/ 重命名和移动

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `docs/guides/typescript-configuration.md` | `docs/guides/typescript-configuration.md` | TypeScript 配置指南 |
| `docs/migration/mikro-orm-migration-progress.md` | `docs/migration/mikro-orm-migration-progress.md` | MikroORM 迁移进度 |

---

## 🔄 AGENTS.md 更新

已更新 `AGENTS.md` 中的所有文档引用：

### 更新前

```markdown
- 📚 详见 `docs/migration/vitest-migration.md`
- 详见：`docs/migration/mikro-orm-migration-progress.md`
> **重要**: 完整配置文档请参考 `docs/guides/typescript-configuration.md`
```

### 更新后

```markdown
- 📚 详见 `docs/migration/vitest-migration.md`
- 详见：`docs/migration/mikro-orm-migration-progress.md`
> **重要**: 完整配置文档请参考 `docs/guides/typescript-configuration.md`
```

---

## 📚 新增文档

### docs/README.md

创建了完整的文档索引，包含：

- ✅ 文档导航（按类型分类）
- ✅ 按场景查找指南
- ✅ 快速搜索表
- ✅ 贡献指南
- ✅ 文档模板

---

## 🎯 文档分类原则

### guides/

存放配置和开发指南类文档：

- TypeScript 配置
- 开发环境设置
- 最佳实践指南
- 代码规范

### migration/

存放迁移相关的文档：

- 框架迁移（Jest → Vitest）
- 数据库迁移（Drizzle → MikroORM）
- 架构迁移记录

### setup/

存放安装和配置类文档：

- 环境搭建
- 依赖安装
- 初始配置

### 根目录 (docs/)

存放：

- 系统架构文档
- 功能实现文档
- 项目评估文档
- 阶段总结文档

---

## ✅ 验证清单

- [x] 创建 `docs/guides/` 目录
- [x] 创建 `docs/migration/` 目录
- [x] 创建 `docs/setup/` 目录
- [x] 移动 `docs/migration/vitest-migration.md`
- [x] 移动 `typescript-configuration.md`
- [x] 移动 `mikro-orm-migration-overall-progress.md`
- [x] 创建 `docs/README.md` 索引
- [x] 更新 `AGENTS.md` 中的引用
- [x] 验证所有链接正确

---

## 🔗 向后兼容

为保持向后兼容，建议：

1. **短期**：在旧位置创建符号链接（可选）
2. **中期**：更新所有文档中的内部引用
3. **长期**：移除符号链接，只保留新路径

---

## 📝 后续工作

### 需要整理的文档

`docs/` 目录下还有很多散落的文档，建议后续整理：

```bash
# 建议移动到 docs/setup/
- GITHUB_OAUTH_SETUP.md
- GOOGLE_OAUTH_SETUP.md
- FRONTEND_SETUP.md

# 建议移动到 docs/guides/
- LINT_MECHANISM.md
- entity-design-guide.md
- mikro-orm-usage-guide.md

# 建议移动到 docs/migration/
- auth-optimization-plan.md
- oauth-provider-migration-evaluation.md
- api-key-migration-*.md
- admin-plugin-migration-*.md
```

### 文档命名规范化

建议统一命名格式：

- ✅ 使用小写和连字符：`my-feature.md`
- ✅ 分类前缀：`setup-oauth-github.md` 或 `guide-typescript.md`
- ❌ 避免全大写：`BETTER_AUTH_INTEGRATION.md` → `better-auth-integration.md`

---

## 🎉 完成

文档重组已完成，新的结构更清晰、更易维护！

**下一步**：使用 `docs/README.md` 作为文档导航中心。
