---
description: oksai.cc 项目宪章
globs:
alwaysApply: true
---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# 一、General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## 二、核心原则

### 2.1 Spec 优先开发

`monorepo`下的`specs`目录包含正在开发功能的设计文档。AI 助手应当读取这些文档来理解要构建的内容并跟踪进度。

**工作方式**：

1. **在实现功能前**，先创建包含设计文档的 spec 文件夹
2. **AI 助手先读设计**，再编写代码
3. **进度记录**在 `implementation.md`，用于会话连续性
4. **决策记录**在 `decisions.md`，用于后续参考
5. 功能完成后会**生成带截图的文档**

**具体阅读`specs/README.md`**

### 2.2 中文优先原则

- 所有代码注释、技术文档、错误消息、日志输出及用户界面文案**必须使用中文**
- Git 提交信息**必须使用英文描述**
- 代码变量命名**保持英文**，但必须配有中文注释说明业务语义

### 2.3 代码即文档原则

**必须编写 TSDoc 的场景：** 公共 API、NestJS Controller/Service、类型定义/接口

**TSDoc 必须覆盖：** 功能描述、业务规则、使用场景、前置条件、后置条件、异常抛出及注意事项

## 三、Build/Lint/Test Commands

### Build Commands

```bash
# Build all projects
pnpm build
pnpm nx run-many -t build

# Build specific project
pnpm nx build @oksai/gateway
pnpm nx build @oksai/web-admin

# Build with dependencies
pnpm nx build @oksai/gateway --with-deps
```

### Lint Commands (Biome)

```bash
# Lint all files
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Format code
pnpm format

# Check formatting without changes
pnpm format:check

# Full check (lint + format)
pnpm check

# Full check with auto-fix
pnpm check:fix

# Check specific file
pnpm biome check apps/gateway/src/main.ts
pnpm biome lint --write apps/gateway/src/main.ts
```

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests for specific project
pnpm nx test @oksai/nestjs-better-auth

# Run single test file (Vitest)
pnpm vitest run libs/auth/nestjs-better-auth/src/decorators.spec.ts
pnpm vitest run path/to/file.spec.ts

# Run single test with pattern
pnpm vitest run -t "test name pattern"

# Run tests in watch mode
pnpm vitest watch

# Run tests with UI
pnpm vitest --ui

# Run tests with coverage
pnpm vitest run --coverage

# Run specific describe block
pnpm vitest run -t "Decorators"
```

### Database Commands

```bash
pnpm db:generate  # Generate Drizzle schema migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes directly
pnpm db:studio    # Open Drizzle Studio
```

### Development Commands

```bash
pnpm dev          # Start gateway (NestJS)
pnpm dev:web      # Start web-admin (TanStack Start)
```

## 四、Code Style Guidelines

### Import Organization

Biome automatically organizes imports in this order:

1. Node.js builtins with `node:` protocol (`import { join } from "node:path"`)
2. External packages (`@nestjs/common`, `react`, etc.)
3. Internal workspace packages (`@oksai/**`)
4. Path aliases (`~/**`)
5. Relative imports (`./`, `../`)

**Rules:**

- Always use `node:` protocol for Node.js builtins
- Use `import type` for type-only imports
- Group imports logically with blank lines between groups

### Formatting (Biome)

- **Line width**: 110 characters
- **Indent**: 2 spaces
- **Quotes**: Double quotes (`"`) for JavaScript/TypeScript
- **Semicolons**: Always
- **Trailing commas**: ES5 compatible
- **Arrow parentheses**: Always `(x) => x`
- **Bracket spacing**: `true` (`{ key: value }`)

### TypeScript

- **Strict mode**: Enabled
- **Explicit types**: Preferred for function returns, public APIs, and complex logic
- **Type imports**: Use `import type { X }` for type-only imports
- **Avoid `any`**: Use `unknown` or specific types instead
- **Non-null assertions**: Avoid `!` operator; use nullish coalescing `??` or optional chaining `?.`

### Naming Conventions

```typescript
// 文件命名
user.service.ts        // 服务文件：小写.功能.ts
auth.guard.ts          // 守卫文件：小写.功能.ts
user.interface.ts      // 接口文件：小写.interface.ts

// 类命名
export class UserService { }  // 类：PascalCase
export class AuthGuard { }    // 守卫：PascalCase + Guard 后缀

// 接口命名
export interface IUser { }    // 接口：I + PascalCase
export type UserRole = ...    // 类型别名：PascalCase

// 变量和函数
const userService = ...       // 变量：camelCase
function validateUser() { }   // 函数：camelCase

// 常量
export const MAX_RETRY = 3;   // 常量：UPPER_SNAKE_CASE
export const userRoles = ...  // 配置对象：camelCase

// 私有成员
private readonly configService  // 私有属性：无下划线
```

### Error Handling

```typescript
// 使用 NestJS 内置异常
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// 抛出标准异常
if (!user) {
  throw new NotFoundException('用户不存在');
}

// 验证失败
if (!email) {
  throw new BadRequestException('邮箱地址不能为空');
}

// 权限错误
if (!hasPermission) {
  throw new UnauthorizedException('您没有权限执行此操作');
}

// 使用 try-catch 处理异步错误
try {
  await this.userService.create(data);
} catch (error) {
  console.error('创建用户失败：', error);
  throw new InternalServerErrorException('创建用户失败，请稍后重试');
}
```

### NestJS Best Practices

- **装饰器顺序**: Class decorators → Property decorators → Method decorators → Parameter decorators
- **Dependency injection**: Use constructor injection with `readonly`
- **Modules**: Keep modules focused and cohesive
- **Guards**: Prefer globally enabled guards with decorators to opt-out

### React/TanStack Start

- Use functional components with hooks
- Prefer `import type` for component props
- Use path alias `~/` for imports from `src/`

## 五、Spec 优先开发

详细流程参见 `specs/README.md`。每个功能包含：`design.md`、`implementation.md`、`decisions.md`、`prompts.md`、`future-work.md`、`docs/`。
