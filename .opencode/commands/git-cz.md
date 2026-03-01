---
description: Git 提交助手。根据暂存区的代码变更自动生成规范的 commit message（使用英文）。支持 Conventional Commits 规范、智能分析变更类型、自动生成多行提交信息。
argument-hint: '[type] [--scope <scope>] [--breaking] [--no-verify]'
---

# Git CZ 命令

智能 Git 提交助手，根据暂存区的代码变更自动生成符合规范的 commit message。

## 上下文

- **当前分支:** !`git branch --show-current`
- **暂存文件:** !`git diff --cached --name-only | head -20 || echo "暂无暂存文件"`
- **变更统计:** !`git diff --cached --shortstat || echo "暂无变更"`

## 用户指令

$ARGUMENTS

**重要：** 如果用户提供了具体指令，优先遵循用户指令而非默认行为。

## 功能特性

### 1. 智能变更分析

自动分析暂存区的代码变更：

- **文件类型识别**: 识别代码、配置、文档、测试等文件类型
- **变更范围分析**: 分析修改的范围（单文件、多文件、跨模块）
- **影响评估**: 评估变更的影响范围和重要性
- **提交类型推断**: 根据文件路径和变更内容推断提交类型

### 2. Conventional Commits 规范

生成的 commit message 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 提交类型 (type)

| 类型       | 说明                 | Emoji | 示例                              |
| ---------- | -------------------- | ----- | --------------------------------- |
| `feat`     | 新功能               | ✨    | `feat: add user authentication`   |
| `fix`      | 修复 bug             | 🐛    | `fix: resolve login timeout`      |
| `docs`     | 文档变更             | 📝    | `docs: update API documentation`  |
| `style`    | 代码格式             | 💄    | `style: format code with biome`   |
| `refactor` | 重构                 | ♻️    | `refactor: simplify auth logic`   |
| `perf`     | 性能优化             | ⚡    | `perf: optimize database queries` |
| `test`     | 测试                 | ✅    | `test: add unit tests for auth`   |
| `build`    | 构建系统             | 📦    | `build: update webpack config`    |
| `ci`       | CI 配置              | 👷    | `ci: add GitHub Actions workflow` |
| `chore`    | 其他（不修改源代码） | 🔧    | `chore: update dependencies`      |
| `revert`   | 回退                 | ⏪    | `revert: revert "feat: add auth"` |

### 3. 自动生成规则

#### 基于文件路径推断

| 文件路径模式                     | 推断类型 | 示例      |
| -------------------------------- | -------- | --------- |
| `**/*.test.ts`, `**/*.spec.ts`   | `test`   | 测试文件  |
| `**/README.md`, `docs/**`        | `docs`   | 文档文件  |
| `**/*.css`, `**/*.scss`          | `style`  | 样式文件  |
| `.github/workflows/**`           | `ci`     | CI 配置   |
| `package.json`, `pnpm-lock.yaml` | `chore`  | 依赖变更  |
| `**/*.config.js`, `*.config.ts`  | `build`  | 配置文件  |
| `biome.json`, `.eslintrc*`       | `style`  | Lint 配置 |

#### 基于变更内容推断

| 变更内容关键词                      | 推断类型   | 说明       |
| ----------------------------------- | ---------- | ---------- |
| `add`, `create`, `new`, `implement` | `feat`     | 添加新功能 |
| `fix`, `bug`, `issue`, `resolve`    | `fix`      | 修复问题   |
| `update`, `refactor`, `improve`     | `refactor` | 代码重构   |
| `optimize`, `perf`, `speed`         | `perf`     | 性能优化   |
| `remove`, `delete`, `deprecate`     | `refactor` | 移除代码   |

### 4. Scope 自动检测

自动从文件路径提取 scope：

| 文件路径                      | Scope       | 说明           |
| ----------------------------- | ----------- | -------------- |
| `apps/gateway/src/auth/*.ts`  | `gateway`   | Gateway 应用   |
| `apps/web-admin/src/**/*.tsx` | `web-admin` | Web Admin 应用 |
| `libs/auth/**/*.ts`           | `auth`      | Auth 库        |
| `libs/database/**/*.ts`       | `database`  | Database 库    |
| `libs/shared/**/*.ts`         | `shared`    | Shared 库      |

## 命令选项

| 选项          | 说明                           | 示例                       |
| ------------- | ------------------------------ | -------------------------- |
| `[type]`      | 手动指定提交类型               | `/git-cz feat`         |
| `--scope`     | 手动指定 scope                 | `/git-cz --scope auth` |
| `--breaking`  | 标记为 BREAKING CHANGE         | `/git-cz --breaking`   |
| `--no-verify` | 跳过 pre-commit 钩子（不推荐） | `/git-cz --no-verify`  |

## 生成流程

### Step 1: 分析暂存区

```bash
# 获取暂存文件列表
git diff --cached --name-only

# 获取变更统计
git diff --cached --shortstat

# 获取具体变更（用于分析）
git diff --cached
```

### Step 2: 智能分析

1. **分析文件类型**
   - 统计各类型文件数量（代码、测试、配置、文档等）
   - 确定主要变更类型

2. **推断提交类型**
   - 基于文件路径模式
   - 基于变更内容关键词
   - 基于历史提交（可选）

3. **提取 Scope**
   - 从文件路径提取模块/应用名称
   - 多个模块时选择最主要的

4. **生成描述**
   - 分析变更的核心内容
   - 使用简洁的英文描述
   - 使用祈使语气（imperative mood）

### Step 3: 生成 Commit Message

#### 单行提交（简单变更）

```bash
<type>[optional scope]: <description>

# 示例
feat(auth): add OAuth2 authentication
fix(gateway): resolve CORS issue
docs: update README with setup instructions
```

#### 多行提交（复杂变更）

```bash
<type>[optional scope]: <description>

<body>

<footer>

# 示例
feat(auth): add multi-factor authentication support

- Add TOTP-based MFA
- Add backup codes generation
- Add MFA setup wizard
- Add MFA verification middleware

Closes #123
```

### Step 4: 执行提交

生成 commit message 后，执行：

```bash
git commit -m "$(cat <<'EOF'
<generated message>
EOF
)"
```

## 特殊情况处理

### 1. Breaking Changes

当用户指定 `--breaking` 或检测到 breaking change 时：

```bash
feat(api)!: change authentication endpoint structure

BREAKING CHANGE: The `/api/auth/login` endpoint now requires
`email` instead of `username`. Update your API clients accordingly.

Migration guide: docs/migration/auth-v2.md
```

### 2. 多个 Scope

当变更涉及多个模块时：

```bash
feat(auth,database): add user roles and permissions

- Add role-based access control
- Update database schema
- Add permission checks
```

### 3. 关联 Issue

从分支名或提交信息中提取 issue 编号：

```bash
feat(auth): add password reset functionality

Closes #456
```

### 4. 合并提交

检测合并操作：

```bash
Merge branch 'feature/add-auth' into main
```

## 使用示例

### 示例 1: 简单功能

```bash
用户: /git-cz

[git-cz] 分析暂存区...
[git-cz] 文件: apps/gateway/src/auth/auth.service.ts
[git-cz] 类型: feat
[git-cz] Scope: gateway
[git-cz]
[git-cz] 生成的 commit message:
[git-cz] feat(gateway): implement JWT token validation
[git-cz]
[git-cz] 是否提交？(y/n)
用户: y

[git-cz] ✓ 提交成功
```

### 示例 2: 多文件变更

```bash
用户: /git-cz

[git-cz] 分析暂存区...
[git-cz] 文件 (5):
[git-cz]   - apps/gateway/src/auth/auth.service.ts
[git-cz]   - apps/gateway/src/auth/auth.controller.ts
[git-cz]   - libs/auth/src/auth-module.ts
[git-cz]   - libs/database/src/schema/users.ts
[git-cz]   - libs/shared/types/src/auth.ts
[git-cz]
[git-cz] 类型: feat
[git-cz] Scope: auth
[git-cz]
[git-cz] 生成的 commit message:
[git-cz] feat(auth): add user session management
[git-cz]
[git-cz] - Implement session store interface
[git-cz] - Add session cleanup cron job
[git-cz] - Update user schema with session fields
[git-cz] - Add session-related types
[git-cz]
[git-cz] 是否提交？(y/n)
用户: y

[git-cz] ✓ 提交成功
```

### 示例 3: 指定类型和 Scope

```bash
用户: /git-cz fix --scope api

[git-cz] 分析暂存区...
[git-cz] 文件: apps/gateway/src/api/users.controller.ts
[git-cz] 指定类型: fix
[git-cz] 指定 Scope: api
[git-cz]
[git-cz] 生成的 commit message:
[git-cz] fix(api): resolve user update endpoint validation
[git-cz]
[git-cz] 是否提交？(y/n)
用户: y

[git-cz] ✓ 提交成功
```

### 示例 4: Breaking Change

```bash
用户: /git-cz --breaking

[git-cz] 分析暂存区...
[git-cz] 文件:
[git-cz]   - apps/gateway/src/auth/auth.controller.ts
[git-cz]   - apps/web-admin/src/lib/auth-client.ts
[git-cz] 类型: feat
[git-cz] Scope: auth
[git-cz] Breaking: true
[git-cz]
[git-cz] 生成的 commit message:
[git-cz] feat(auth)!: migrate from JWT to session-based auth
[git-cz]
[git-cz] BREAKING CHANGE: Authentication mechanism changed from
[git-cz] stateless JWT to stateful sessions. All clients must update
[git-cz] their authentication logic.
[git-cz]
[git-cz] - Remove JWT token generation
[git-cz] - Add session store
[git-cz] - Update client auth library
[git-cz]
[git-cz] Migration guide: docs/migration/session-auth.md
[git-cz]
[git-cz] 是否提交？(y/n)
用户: y

[git-cz] ✓ 提交成功
```

### 示例 5: Biome Lint 修复

```bash
用户: /git-cz

[git-cz] 分析暂存区...
[git-cz] 文件 (84):
[git-cz]   - apps/gateway/src/*.ts
[git-cz]   - apps/web-admin/src/**/*.tsx
[git-cz]   - libs/**/*.ts
[git-cz]   - biome.json
[git-cz]   - .vscode/settings.json
[git-cz] 类型: style
[git-cz] Scope: (root)
[git-cz]
[git-cz] 生成的 commit message:
[git-cz] style: migrate from ESLint to Biome lint system
[git-cz]
[git-cz] - Replace ESLint + Prettier with Biome
[git-cz] - Update all code formatting to Biome standards
[git-cz] - Configure Biome with project-specific rules
[git-cz] - Update VSCode settings for Biome integration
[git-cz] - Add Husky pre-commit hook for Biome lint
[git-cz]
[git-cz] Performance improvement: 15-30x faster than ESLint + Prettier
[git-cz]
[git-cz] 是否提交？(y/n)
用户: y

[git-cz] ✓ 提交成功
```

## 最佳实践

### 1. 提交粒度

- ✅ **好**: 每个提交专注于一个变更
- ❌ **坏**: 一个提交包含多个不相关的变更

### 2. 描述清晰

- ✅ **好**: `feat(auth): add OAuth2 authentication with GitHub provider`
- ❌ **坏**: `feat: update auth`

### 3. 使用祈使语气

- ✅ **好**: `add feature`, `fix bug`, `update docs`
- ❌ **坏**: `added feature`, `fixing bug`, `updated docs`

### 4. 说明原因

对于复杂变更，在 body 中说明：

```bash
refactor(database): migrate from TypeORM to Drizzle ORM

TypeORM's active record pattern doesn't fit well with our
domain-driven design. Drizzle's query builder provides better
type safety and performance.

- Replace all TypeORM entities with Drizzle schemas
- Update repository implementations
- Add Drizzle migration scripts
```

### 5. 关联 Issue

```bash
feat(payment): add Stripe integration

Closes #789
```

## 错误处理

| 错误                | 处理方式                     |
| ------------------- | ---------------------------- |
| 暂存区为空          | 提示用户先 `git add` 文件    |
| 无法推断类型        | 询问用户指定类型             |
| Pre-commit 失败     | 显示错误信息，建议修复后重试 |
| Commit message 过长 | 提示简化描述或使用多行格式   |

## 与其他工具集成

### Husky Pre-commit

如果配置了 Husky，提交前会自动运行 pre-commit 钩子：

```bash
[git-cz] 运行 pre-commit 钩子...
[git-cz] ✅ Lint check passed
[git-cz] ✓ 提交成功
```

### Biome Lint

与 Biome 配合使用，确保代码质量：

```bash
用户修改代码 → Biome 自动格式化 → git add → /git-cz → Husky 钩子检查 → 提交
```

## 配置选项

可在 `.opencode/config.json` 中配置默认行为：

```json
{
  "git-cz": {
    "defaultType": "feat",
    "maxLength": 72,
    "emoji": true,
    "askBeforeCommit": true
  }
}
```

## 总结

`/git-cz` 命令提供：

- ✅ 智能 commit message 生成
- ✅ Conventional Commits 规范
- ✅ 自动类型推断
- ✅ Scope 自动检测
- ✅ 多行提交支持
- ✅ Breaking Change 标记
- ✅ Issue 关联
- ✅ 最佳实践引导

让 Git 提交变得简单、规范、高效！
