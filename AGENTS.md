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

**Nx Cloud 状态**: 已永久禁用（`neverConnectToCloud: true`），无需处理连接警告

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

**注意：项目已统一使用 Vitest 测试框架（2026-03-03 迁移完成）**

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

**迁移说明：**
- ✅ 已从 Jest 迁移到 Vitest
- ✅ 所有测试文件使用 `vi.fn()` 替代 `jest.fn()`
- ✅ 兼容 Jest API，迁移成本低
- ⚡ 更快的测试运行速度和 watch 模式
- 📚 详见 `docs/migration/vitest-migration.md`

**测试最佳实践：**
- 使用 `vi.fn()` 创建 mock 函数
- 使用 `vi.mock()` mock 模块
- 使用 `vi.importActual()` 获取真实模块
- 优先使用 async/await 而非 done() callback
```

### Database Commands

**MikroORM (推荐使用)**:
```bash
# MikroORM 命令
pnpm mikro-orm schema:update   # 更新 Schema（开发环境）
pnpm mikro-orm migration:create # 创建迁移文件
pnpm mikro-orm migration:up     # 运行迁移
pnpm mikro-orm migration:down   # 回滚迁移
pnpm mikro-orm migration:pending # 查看待执行迁移
```

**Drizzle (兼容旧 Schema)**:
```bash
# Drizzle 命令（保留用于旧代码参考）
pnpm db:generate  # Generate Drizzle schema migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes directly
pnpm db:studio    # Open Drizzle Studio
```

**说明**:
- 项目正在从 Drizzle 迁移到 MikroORM
- 新功能请使用 MikroORM Entity 和 Repository
- 旧代码暂时保留 Drizzle Schema 作为参考
- 详见：`docs/migration/mikro-orm-migration-progress.md`


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

## 五、TypeScript Configuration Rules

> **重要**: 完整配置文档请参考 `docs/guides/typescript-configuration.md`

### 5.1 Import Type 使用规则

**⚠️ 关键规则**: 在 NestJS 中，构造函数注入的服务**禁止**使用 `import type`

```typescript
// ❌ 错误 - 会导致依赖注入元数据丢失
import type { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}  // ❌ 运行时错误
}

// ✅ 正确
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}  // ✅ 正常工作
}
```

**规则总结：**

| 场景 | 是否可以用 `import type` | 原因 |
|------|------------------------|------|
| 构造函数注入的 Service | ❌ **禁止** | 需要 `emitDecoratorMetadata` 生成运行时元数据 |
| 方法参数类型 | ✅ 可以 | 纯类型，不需要运行时 |
| 返回值类型 | ✅ 可以 | 纯类型，不需要运行时 |
| 接口/DTO | ✅ 可以 | 纯类型，不需要运行时 |
| 类装饰器 | ❌ **禁止** | 需要运行时引用 |

**快速检查命令：**

```bash
# 检查所有可能有问题的 import type
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"
```

### 5.2 库构建配置

#### 构建工具选择

- **使用 `tsc` 构建**：简单库，不需要打包（如 `@oksai/kernel`, `@oksai/context`）
- **使用 `tsup` 构建**：需要多格式输出或打包（如 `@oksai/logger`, `@oksai/database`）

#### composite 配置规则

**⚠️ 关键**: 为避免增量编译缓存导致构建产物不更新

```json
// tsconfig.json (开发配置)
{
  "compilerOptions": {
    "composite": true  // ✅ 启用，用于项目引用和 IDE
  }
}

// tsconfig.build.json (构建配置)
{
  "compilerOptions": {
    "composite": false  // ⚠️ 必须禁用，确保生成构建产物
  }
}
```

**适用范围：**
- ✅ 所有使用 `tsc` 构建的库
- ❌ 使用 `tsup` 构建的库不需要此配置

#### 构建命令标准

```bash
# 清理所有构建缓存和产物
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all
pnpm nx reset

# 重新构建所有项目
pnpm build

# 构建特定项目（自动处理依赖）
pnpm nx build @oksai/gateway
```

### 5.3 依赖注入元数据问题排查

**症状：**

```
Error: Nest can't resolve dependencies of the AppController (?).
Please make sure that the argument Function at index [0] is available.
```

**诊断步骤：**

1. **检查编译后的元数据**

```bash
cat apps/gateway/dist/src/app.controller.js | grep -A 3 "__metadata"

# 正确: tslib_1.__metadata("design:paramtypes", [app_service_1.AppService])
# 错误: tslib_1.__metadata("design:paramtypes", [Function])
```

2. **批量修复命令**

```bash
# 修复所有使用 import type 导入 Service 的文件
find apps/gateway/src -name "*.ts" -exec \
  sed -i 's/import type { \([^}]*Service[^}]*\) }/import { \1 }/g' {} \;
```

3. **验证修复**

```bash
# 确保没有遗漏
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"
```

### 5.4 项目配置模板

#### tsc 构建的库

```json
// libs/shared/lib-name/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "module": "node16",
    "moduleResolution": "node16",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

#### tsup 构建的库

```typescript
// libs/shared/lib-name/tsup.config.ts
import { type Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "@nestjs/common",
    "@oksai/config"
  ]
};

export default config;
```

### 5.5 常见问题快速修复

#### 问题 1: 类型声明文件找不到

```bash
# 清理并重新构建
find libs -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

#### 问题 2: rimraf: not found

```bash
# 已统一使用 pnpm exec rimraf
# 所有 package.json 的 clean 脚本应使用：
"clean": "pnpm exec rimraf dist coverage"
```

#### 问题 3: Nx Cloud 已禁用

**说明**: 项目已在 `nx.json` 中配置 `neverConnectToCloud: true`，无需任何操作

### 5.6 新库创建清单

创建新的共享库时，确保：

```markdown
- [ ] 创建 `tsconfig.json` (extends tsconfig.base.json)
- [ ] 创建 `tsconfig.build.json` (composite: false)
- [ ] 在 `tsconfig.base.json` 添加路径映射
- [ ] 选择构建工具 (tsc/tsup)
- [ ] 配置 `package.json` 构建脚本
- [ ] 添加到 `apps/gateway/project.json` 的 dependsOn（如果被使用）
```

### 5.7 完整清理和重建流程

**⚠️ 当遇到任何构建或类型问题时，执行此流程：**

```bash
# 1. 清理所有构建产物和缓存
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all

# 2. 重置 Nx 缓存
pnpm nx reset

# 3. 重新安装依赖（可选）
pnpm install --force

# 4. 重新构建所有项目
pnpm build

# 5. 验证构建结果
pnpm test

# 6. 启动开发服务器
pnpm dev
```

## 六、Spec 优先开发

详细流程参见 `specs/README.md`。每个功能包含：`design.md`、`implementation.md`、`decisions.md`、`prompts.md`、`future-work.md`、`docs/`。
