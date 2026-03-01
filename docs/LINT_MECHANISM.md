# OKSAI.cc Lint 机制全面指南

本文档全面阐述了 OKSAI.cc 项目的 lint 机制，包括工具链、配置文件、集成方式和最佳实践。

## 概述

OKSAI.cc 使用 Biome 作为主要的 lint 和格式化工具，结合 lint-staged 和 Husky 构建了一套完整的代码质量保证体系。这套机制确保了代码风格的一致性、类型安全以及团队协作的效率。

## 核心工具链

### 1. Biome - 主要 Lint 和格式化工具

OKSAI.cc 已从 ESLint/Prettier 迁移到 Biome，它是一个性能优异的全套工具链，提供格式化、lint 代码和导入排序功能。

**主要优势：**

- 高性能：比 ESLint + Prettier 组合快 10-20 倍
- 一体化：同时提供格式化和 lint 功能
- 配置简单：单一配置文件管理所有规则

### 2. Lint-staged - 暂存文件检查

对 Git 暂存区中的文件运行 lint，确保只有符合规范的代码被提交。

### 3. Husky - Git 钩子管理

在 Git 操作（如 commit）的特定时间点触发 lint 检查。

## 配置文件详解

### 1. biome.json - 主配置文件

这是 Biome 的主配置文件，定义了整个项目的 lint 和格式化规则。

**关键配置部分：**

```json
{
  "formatter": {
    "lineWidth": 110,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": true,
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

**重要规则：**

- `noDefaultExport`: 页面文件允许默认导出
- `useExplicitType`: 强制使用显式类型注解
- `noRestrictedImports`: 防止循环依赖的导入限制
- `useSortedClasses`: 强制 CSS 类名排序

### 2. biome-staged.json - 暂存文件配置

扩展主配置，对暂存文件应用更严格的规则：

```json
{
  "extends": ["./biome.json"],
  "linter": {
    "rules": {
      "nursery": {
        "useExplicitType": "error"
      }
    }
  }
}
```

### 3. lint-staged.config.mjs - Lint-staged 配置

定义对暂存文件运行的命令：

```javascript
export default {
  '(apps|libs|packages)/**/*.{js,ts,jsx,tsx}': (files) =>
    `biome lint --reporter summary --config-path=biome-staged.json ${files.join(' ')}`,
};
```

## Git 钩子集成

### Pre-commit 钩子

在 `.husky/pre-commit` 中定义：

```bash
if [ -f .git/MERGE_HEAD ]; then
  echo "检测到合并操作。跳过 lint-staged。"
  exit 0
fi

pnpm lint-staged --verbose
```

## VS Code 集成

### 设置配置 (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### 推荐扩展 (`.vscode/extensions.json`)

```json
{
  "recommendations": ["biomejs.biome", "nrwl.angular-console"]
}
```

## 常用命令

### Lint 相关命令

```bash
# 运行 lint 检查
pnpm lint

# 运行 lint 并自动修复
pnpm lint:fix

# 对暂存文件运行 lint
pnpm lint:staged

# 格式化代码
pnpm format

# 检查代码格式
pnpm format:check

# 运行完整的 Biome 检查（格式 + lint）
pnpm check

# 运行完整的 Biome 检查并自动修复
pnpm check:fix
```

## 特殊规则和最佳实践

### 1. 防止循环依赖

Biome 配置中包含了严格的导入限制，防止包之间形成循环依赖：

```json
"noRestrictedImports": {
  "level": "error",
  "options": {
    "patterns": [
      {
        "group": ["../auth/**"],
        "message": "shared 包不应从 auth 包导入，以避免循环依赖。"
      }
    ]
  }
}
```

**包依赖规则：**

- `shared` 包：不能从 `auth` 或 `database` 包导入
- `auth` 包：不能从 `database` 包导入
- `database` 包：不能从 `auth` 包或 `apps` 导入
- `gateway` 应用：不能从 `web-admin` 导入
- `web-admin` 应用：不能从 `gateway` 导入

### 2. 强制显式类型注解

对暂存文件强制要求显式类型注解，提高代码可读性和可维护性。

### 3. CSS 类名排序

使用 `useSortedClasses` 规则强制 CSS 类名排序，提高代码一致性：

```json
"useSortedClasses": {
  "level": "warn",
  "options": {
    "attributes": ["className", "classList"],
    "functions": ["clsx", "cva", "cn", "tw"]
  }
}
```

## 错误处理和故障排除

### 常见问题及解决方案

1. **格式化不一致**

   ```bash
   # 重新格式化整个代码库
   pnpm format
   ```

2. **Lint 错误**

   ```bash
   # 自动修复可修复的 lint 错误
   pnpm lint:fix

   # 或者使用 check:fix 一次性修复格式和 lint
   pnpm check:fix
   ```

3. **导入排序问题**
   ```bash
   # Biome 会自动组织导入
   pnpm check:fix
   ```

## 性能优化

### 1. 增量检查

通过 lint-staged 实现增量检查，只处理修改的文件。

### 2. 单一工具

使用 Biome 替代 ESLint + Prettier 组合，减少工具链复杂度和执行时间。

## 团队协作

### 提交前检查

1. 确保代码通过 lint 检查：`pnpm lint`
2. 确保代码格式符合规范：`pnpm format:check`
3. 确保相关测试通过

### PR 检查清单

- [ ] Lint 检查通过
- [ ] 代码格式符合规范
- [ ] 没有引入循环依赖
- [ ] 类型注解完整

## 从 ESLint + Prettier 迁移

本项目已完成从 ESLint + Prettier 到 Biome 的迁移，实现了：

- 10-20 倍的性能提升
- 配置简化
- 工具链统一

**已移除的依赖：**

- `@eslint/js`
- `@nx/eslint`
- `@nx/eslint-plugin`
- `eslint`
- `jsonc-eslint-parser`
- `typescript-eslint`
- `prettier`

## 总结

OKSAI.cc 的 lint 机制是一套完整的代码质量保证体系，通过 Biome、lint-staged 和 Husky 的协同工作，确保了代码的一致性、可读性和可维护性。这套机制不仅提高了开发效率，还为团队协作提供了统一的代码标准。

遵循这些 lint 规则和最佳实践，可以帮助开发人员编写更高质量、更易维护的代码，同时减少代码审查中的格式和风格讨论，让团队能够专注于业务逻辑和功能实现。
