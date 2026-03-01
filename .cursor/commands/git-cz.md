# commit message

**根据暂存区的代码变更，智能生成符合 Conventional Commits 规范的 commit message（使用英文）**

## 分析暂存区

```bash
# 获取暂存文件列表
git diff --cached --name-only

# 获取变更统计
git diff --cached --shortstat
```

## 智能生成规则

### 1. 提交类型推断

根据文件路径和变更内容自动推断提交类型：

| 文件路径 / 变更内容               | 提交类型   | 说明      |
| --------------------------------- | ---------- | --------- |
| `**/*.test.ts`, `**/*.spec.ts`    | `test`     | 测试文件  |
| `**/README.md`, `docs/**`         | `docs`     | 文档文件  |
| `.github/workflows/**`            | `ci`       | CI 配置   |
| `biome.json`, `.eslintrc*`        | `style`    | Lint 配置 |
| `package.json`, `pnpm-lock.yaml`  | `chore`    | 依赖变更  |
| 新增功能 (`add`, `create`, `new`) | `feat`     | 新功能    |
| 修复问题 (`fix`, `bug`, `issue`)  | `fix`      | Bug 修复  |
| 重构代码 (`refactor`, `update`)   | `refactor` | 代码重构  |

### 2. Scope 自动检测

从文件路径提取 scope：

| 文件路径                  | Scope       |
| ------------------------- | ----------- |
| `apps/gateway/**/*.ts`    | `gateway`   |
| `apps/web-admin/**/*.tsx` | `web-admin` |
| `libs/auth/**/*.ts`       | `auth`      |
| `libs/database/**/*.ts`   | `database`  |
| `libs/shared/**/*.ts`     | `shared`    |

### 3. Commit Message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

#### 类型列表

| 类型       | Emoji | 说明     | 示例                              |
| ---------- | ----- | -------- | --------------------------------- |
| `feat`     | ✨    | 新功能   | `feat(auth): add OAuth2 login`    |
| `fix`      | 🐛    | Bug 修复 | `fix(api): resolve timeout issue` |
| `docs`     | 📝    | 文档变更 | `docs: update installation guide` |
| `style`    | 💄    | 代码格式 | `style: format with biome`        |
| `refactor` | ♻️    | 重构     | `refactor(auth): simplify logic`  |
| `perf`     | ⚡    | 性能优化 | `perf(db): optimize queries`      |
| `test`     | ✅    | 测试     | `test(auth): add unit tests`      |
| `build`    | 📦    | 构建系统 | `build: update webpack config`    |
| `ci`       | 👷    | CI 配置  | `ci: add GitHub Actions`          |
| `chore`    | 🔧    | 其他     | `chore: update dependencies`      |
| `revert`   | ⏪    | 回退     | `revert: revert "feat: auth"`     |

## 生成步骤

### Step 1: 分析变更

1. 读取暂存文件列表
2. 分析文件类型和数量
3. 识别主要变更模块

### Step 2: 推断类型和 Scope

1. 基于文件路径推断提交类型
2. 提取主要 scope
3. 分析变更内容关键词

### Step 3: 生成描述

1. 提取变更的核心内容
2. 使用简洁的英文描述
3. 使用祈使语气（imperative mood）

### Step 4: 执行提交

```bash
# 单行提交（简单变更）
git commit -m "type(scope): description"

# 多行提交（复杂变更）
git commit -m "type(scope): brief description" -m "Detailed description" -m "- Item 1" -m "- Item 2"
```

## 示例

### 示例 1: 简单功能

**暂存文件:**

```
apps/gateway/src/auth/auth.service.ts
```

**生成的 commit message:**

```bash
git commit -m "feat(gateway): implement JWT token validation"
```

### 示例 2: 多文件变更

**暂存文件:**

```
apps/gateway/src/auth/auth.service.ts
apps/gateway/src/auth/auth.controller.ts
libs/auth/src/auth-module.ts
libs/database/src/schema/users.ts
```

**生成的 commit message:**

```bash
git commit -m "feat(auth): add user session management" -m "- Implement session store interface" -m "- Add session cleanup cron job" -m "- Update user schema with session fields"
```

### 示例 3: Lint 配置变更

**暂存文件:**

```
biome.json
.vscode/settings.json
.husky/pre-commit
```

**生成的 commit message:**

```bash
git commit -m "style: migrate from ESLint to Biome lint system" -m "- Replace ESLint + Prettier with Biome" -m "- Update VSCode settings for Biome integration" -m "- Add Husky pre-commit hook" -m "Performance improvement: 15-30x faster"
```

### 示例 4: Breaking Change

**暂存文件:**

```
apps/gateway/src/auth/auth.controller.ts
apps/web-admin/src/lib/auth-client.ts
```

**生成的 commit message:**

```bash
git commit -m "feat(auth)!: migrate from JWT to session-based auth" -m "BREAKING CHANGE: Authentication mechanism changed from stateless JWT to stateful sessions." -m "- Remove JWT token generation" -m "- Add session store" -m "- Update client auth library" -m "Migration guide: docs/migration/session-auth.md"
```

## 最佳实践

1. **提交粒度**: 每个提交专注一个变更
2. **描述清晰**: 使用详细的描述，避免模糊
3. **祈使语气**: `add feature` 而非 `added feature`
4. **说明原因**: 复杂变更在 body 中说明原因
5. **关联 Issue**: 使用 `Closes #123` 或 `Fixes #456`

## 快速命令

### 自动生成并提交

```bash
# 简单统计
git commit -m "Changed $(git diff --cached --shortstat) | Files: $(git diff --cached --name-only | tr '\n' ',' | sed 's/,$//')"

# 带类型推断（推荐）
# 由 AI 助手分析暂存区并生成规范的 commit message
```

### 查看暂存区

```bash
# 文件列表
git diff --cached --name-only

# 详细变更
git diff --cached

# 统计信息
git diff --cached --stat
```

### 修改最后一次提交

```bash
# 修改 message
git commit --amend -m "new message"

# 添加遗漏的文件
git add forgotten-file.ts
git commit --amend --no-edit
```

## 与工具集成

### Husky Pre-commit

如果配置了 Husky，提交前会自动运行：

```bash
git commit → pre-commit hook → Biome lint check → 提交成功/失败
```

### Biome Lint

确保代码质量：

```bash
修改代码 → Biome 自动格式化 → git add → commit → lint 检查
```

## 注意事项

- **暂存区为空**: 提示先 `git add` 文件
- **Pre-commit 失败**: 修复 lint 错误后重试
- **Message 过长**: 简化描述或使用多行格式
- **多模块变更**: 选择最主要的模块作为 scope

---

**提示**: 此命令由 AI 助手智能分析暂存区并生成符合 Conventional Commits 规范的 commit message，确保提交历史清晰、规范、易于理解。
