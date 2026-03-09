# TypeScript 配置方案和策略

> **文档版本**: v2.0  
> **最后更新**: 2026-03-07  
> **维护者**: Oksai Team

---

## 目录

1. [项目概述](#项目概述)
2. [TypeScript 配置架构](#typescript-配置架构)
3. [共享配置包](#共享配置包)
4. [关键配置详解](#关键配置详解)
5. [库构建策略](#库构建策略)
6. [常见问题和解决方案](#常见问题和解决方案)
7. [最佳实践](#最佳实践)
8. [故障排除指南](#故障排除指南)

---

## 项目概述

### 项目结构

```
oksai.cc/
├── apps/                    # 应用程序
│   ├── gateway/            # NestJS API Gateway
│   └── web-admin/          # TanStack Start 管理后台
├── libs/                    # 共享库
│   ├── tsconfig/           # TypeScript 共享配置包
│   ├── oauth/              # OAuth 服务
│   ├── testing/            # 测试工具
│   ├── notification/       # 通知服务
│   │   └── email/          # 邮件服务
│   └── shared/             # 共享业务逻辑
│       ├── database/       # 数据库层
│       ├── kernel/         # DDD 核心基类
│       ├── config/         # 配置管理
│       ├── logger/         # 日志服务
│       ├── context/        # 上下文管理
│       └── ...
├── tsconfig.json           # 根 TypeScript 配置
├── nx.json                 # Nx 配置
└── package.json            # 根 package.json
```

### 技术栈

- **构建工具**: Nx + pnpm workspace
- **包管理**: pnpm v10.30.3
- **TypeScript**: v5.9.3
- **运行时**: Node.js v20.20.0
- **测试框架**: Vitest
- **代码检查**: Biome

---

## TypeScript 配置架构

### 配置层次结构

```
@oksai/tsconfig (共享配置包)
├── base.json (严格基础配置)
├── nestjs.json (NestJS 应用)
├── node-library.json (Node.js 库)
├── react-library.json (React 库)
├── tanstack-start.json (TanStack Start 应用)
└── build.json (构建配置)

tsconfig.json (根目录)
└── extends @oksai/tsconfig/base.json + paths

apps/*/
├── tsconfig.json (extends @oksai/tsconfig/*)
└── tsconfig.build.json (extends @oksai/tsconfig/* + build.json)

libs/*/
├── tsconfig.json (统一模板)
└── tsconfig.build.json (统一模板)
```

### 配置策略概览

与 Novu 对齐，使用独立的 TypeScript 配置包 `@oksai/tsconfig`：

| 配置项                  | base    | nestjs   | node-library | react-library |
| ----------------------- | ------- | -------- | ------------ | ------------- |
| `strict`                | ✅ true | ✅ true  | ✅ true      | ✅ true       |
| `module`                | -       | CommonJS | CommonJS     | ESNext        |
| `moduleResolution`      | node    | Node     | Node         | Bundler       |
| `composite`             | false   | -        | true         | -             |
| `emitDecoratorMetadata` | true    | true     | -            | -             |
| `noUnusedLocals`        | true    | true     | true         | true          |

---

## 共享配置包

### libs/tsconfig/ 目录结构

```
libs/tsconfig/
├── base.json              # 基础配置（最严格）
├── nestjs.json            # NestJS 应用配置
├── node-library.json      # Node.js 库配置
├── react-library.json     # React 库配置
├── tanstack-start.json    # TanStack Start 应用配置
├── build.json             # 构建配置
└── package.json           # 包定义
```

### 基础配置 (base.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "oksai.cc Base Config",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "importHelpers": true,
    "isolatedModules": true,
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "strict": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "target": "ES2022",
    "resolveJsonModule": true
  },
  "exclude": ["node_modules"]
}
```

### NestJS 配置 (nestjs.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "oksai.cc NestJS Application",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "sourceMap": true,
    "incremental": true,
    "noEmit": false,
    "types": ["node", "@nestjs/core"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.e2e.ts"]
}
```

### Node.js 库配置 (node-library.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "oksai.cc Node.js Library",
  "extends": "./base.json",
  "compilerOptions": {
    "composite": true,
    "module": "CommonJS",
    "moduleResolution": "Node",
    "sourceMap": true,
    "noEmit": false,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### 构建配置 (build.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "oksai.cc Build Config",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noEmit": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.int-spec.ts",
    "**/*.e2e-spec.ts",
    "**/*.e2e.ts"
  ]
}
```

---

## 关键配置详解

### 1. 根配置 (tsconfig.json)

```json
{
  "extends": "@oksai/tsconfig/base.json",
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@oksai/better-auth-mikro-orm": ["libs/shared/better-auth-mikro-orm/src/index.ts"],
      "@oksai/config": ["libs/shared/config/src/index.ts"],
      "@oksai/constants": ["libs/shared/constants/src/index.ts"],
      "@oksai/context": ["libs/shared/context/src/index.ts"],
      "@oksai/database": ["libs/shared/database/src/index.ts"],
      "@oksai/email": ["libs/notification/email/src/index.ts"],
      "@oksai/event-store": ["libs/shared/event-store/src/index.ts"],
      "@oksai/exceptions": ["libs/shared/exceptions/src/index.ts"],
      "@oksai/nestjs-utils": ["libs/shared/nestjs-utils/src/index.ts"],
      "@oksai/cache": ["libs/shared/cache/src/index.ts"]
    }
  },
  "references": [
    {"path": "./apps/gateway"},
    {"path": "./apps/web-admin"},
    {"path": "./libs/shared/database"},
    {"path": "./libs/shared/kernel"},
    ...
  ],
  "exclude": ["node_modules", "dist", "apps"]
}
```

**关键点：**

- ✅ 直接 extends `@oksai/tsconfig/base.json`
- ✅ 只保留 workspace paths 映射
- ✅ 项目引用 (references) 用于增量构建

---

### 2. 应用配置 (apps/gateway)

#### tsconfig.json

```json
{
  "extends": "@oksai/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "types": ["node", "@nestjs/core", "@nestjs/swagger", "vitest/globals"]
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [
    {"path": "../../libs/shared/nestjs-better-auth"},
    {"path": "../../libs/shared/logger"},
    {"path": "../../libs/shared/database"},
    ...
  ]
}
```

#### tsconfig.build.json

```json
{
  "extends": ["@oksai/tsconfig/nestjs.json", "@oksai/tsconfig/build.json"],
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.e2e.ts",
    "test"
  ]
}
```

---

### 3. 库配置 (libs/\*)

#### 统一的 tsconfig.json 模板

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

#### 有依赖的库（带 references）

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "references": [{ "path": "../kernel" }]
}
```

#### 统一的 tsconfig.build.json 模板

```json
{
  "extends": [
    "@oksai/tsconfig/node-library.json",
    "@oksai/tsconfig/build.json"
  ],
  "compilerOptions": {
    "outDir": "./dist",
    "composite": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

---

### 4. `composite` 配置策略

#### 问题背景

TypeScript 的 `composite: true` 会生成 `.tsbuildinfo` 缓存文件，导致构建产物不更新。

#### 解决方案

| 配置文件                          | composite | 用途                   |
| --------------------------------- | --------- | ---------------------- |
| `libs/tsconfig/base.json`         | `false`   | 基础配置，默认禁用     |
| `libs/tsconfig/node-library.json` | `true`    | 开发配置，启用项目引用 |
| `libs/*/tsconfig.build.json`      | `false`   | 构建配置，确保生成产物 |
| `apps/*/tsconfig.build.json`      | `false`   | 构建配置，确保生成产物 |

---

### 5. `emitDecoratorMetadata` 配置

#### NestJS 依赖注入原理

```typescript
// 源代码
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}

// 编译后（正确）
__metadata('design:paramtypes', [AppService]);

// 编译后（错误）
__metadata('design:paramtypes', [Function]); // ❌
```

#### 关键规则

**✅ 正确用法：**

```typescript
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {} // ✅
}
```

**❌ 错误用法：**

```typescript
import type { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {} // ❌ 元数据丢失
}
```

#### 受影响的场景

| 场景                   | 是否可以用 `import type` |
| ---------------------- | ------------------------ |
| 构造函数注入的 Service | ❌ 不可以                |
| 方法参数的类型         | ✅ 可以                  |
| 返回值类型             | ✅ 可以                  |
| 属性类型               | ✅ 可以                  |

---

## 库构建策略

### 策略选择

```
决策树：
是否需要自定义构建？
├─ 是 → 使用 tsup
│   ├─ 需要多格式输出 (CJS + ESM)
│   ├─ 需要代码打包
│   └─ 需要外部依赖处理
└─ 否 → 使用 tsc
    ├─ 简单的库
    └─ 只需要类型声明
```

### 1. 使用 `tsc` 构建的库

**适用场景：**

- 简单的 TypeScript 库
- 不需要打包
- 只需要类型声明文件

**项目列表：**

| 项目                | 原因                      |
| ------------------- | ------------------------- |
| `@oksai/domain-core`     | 纯 DDD 基础类，无复杂依赖 |
| `@oksai/context`    | 上下文管理，简单结构      |
| `@oksai/constants`  | 常量定义                  |
| `@oksai/exceptions` | 异常类定义                |
| `@oksai/types`      | 类型定义                  |
| `@oksai/utils`      | 工具函数                  |

### 2. 使用 `tsup` 构建的库

**适用场景：**

- 需要多格式输出（CJS + ESM）
- 需要打包优化
- 有复杂的外部依赖

**项目列表：**

| 项目                           | 原因                         |
| ------------------------------ | ---------------------------- |
| `@oksai/logger`                | 需要 CJS + ESM，外部依赖多   |
| `@oksai/config`                | 需要 CJS + ESM，环境变量解析 |
| `@oksai/nestjs-better-auth`    | 需要处理 peer dependencies   |
| `@oksai/nestjs-utils`          | NestJS 工具集                |
| `@oksai/database`              | 复杂的数据库层，外部依赖多   |
| `@oksai/cache`                 | 缓存服务                     |
| `@oksai/event-store`           | 事件存储                     |
| `@oksai/better-auth-mikro-orm` | Better Auth 适配器           |
| `@oksai/event-store`            | 仓储层                       |

---

## 常见问题和解决方案

### 问题 1: 类型声明文件找不到

**症状：**

```
error TS7016: Could not find a declaration file for module '@oksai/logger'.
```

**解决方案：**

```bash
# 清理所有缓存并重新构建
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

---

### 问题 2: 依赖注入失败 - Function

**症状：**

```
Error: Nest can't resolve dependencies of the AppController (?).
Please make sure that the argument Function at index [0] is available.
```

**原因：**

使用了 `import type` 导入注入的服务，导致 `emitDecoratorMetadata` 生成错误的元数据。

**诊断命令：**

```bash
# 检查编译后的元数据
cat apps/gateway/dist/src/app.controller.js | grep "__metadata"

# 正确的输出：
# tslib_1.__metadata("design:paramtypes", [app_service_1.AppService])

# 错误的输出：
# tslib_1.__metadata("design:paramtypes", [Function])
```

**解决方案：**

```bash
# 批量修复
find apps/gateway/src -name "*.ts" -exec grep -l "import type.*Service" {} \; | \
  xargs sed -i 's/import type { \([^}]*Service[^}]*\) }/import { \1 }/g'
```

---

### 问题 3: 构建顺序错误

**症状：**

```
Error: Cannot find module '@oksai/logger/dist/index.js'
```

**解决方案：**

在 `apps/gateway/project.json` 添加：

```json
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

### 问题 4: No inputs were found in config

**症状：**

```
error TS18003: No inputs were found in config file 'tsconfig.build.json'.
```

**原因：**

`tsconfig.build.json` 缺少 `include` 字段。

**解决方案：**

确保所有 `tsconfig.build.json` 包含：

```json
{
  "extends": ["@oksai/tsconfig/node-library.json", "@oksai/tsconfig/build.json"],
  "include": ["src/**/*"],
  ...
}
```

---

## 最佳实践

### 1. 导入规则

#### ✅ DO - 推荐做法

```typescript
// ✅ 注入的服务必须正常导入
import { AppService } from './app.service';
import { ConfigService } from '@oksai/config';
import { LoggerService } from '@oksai/logger';

// ✅ 纯类型可以使用 import type
import type { IUser } from './user.interface';
import type { ConfigOptions } from '@oksai/config';

// ✅ 类型 + 值混合导入
import { Controller, Get, type Request } from '@nestjs/common';
```

#### ❌ DON'T - 避免的做法

```typescript
// ❌ 注入的服务不要用 import type
import type { AppService } from './app.service';

// ❌ 运行时需要的值不要用 import type
import type { APP_GUARD } from '@nestjs/core';
```

---

### 2. 构建流程

#### 标准构建流程

```bash
# 1. 清理缓存
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all

# 2. 重置 Nx 缓存
pnpm nx reset

# 3. 构建
pnpm build

# 4. 验证
pnpm test
```

---

### 3. 新库创建清单

```markdown
- [ ] 创建 `tsconfig.json` (extends @oksai/tsconfig/node-library.json)
- [ ] 创建 `tsconfig.build.json` (extends node-library + build.json)
- [ ] 在根 `tsconfig.json` 添加路径映射
- [ ] 在根 `tsconfig.json` 添加 references
- [ ] 选择构建工具 (tsc/tsup)
- [ ] 在根 `package.json` 添加依赖（如果被其他项目使用）
```

**模板：**

```json
// libs/shared/new-lib/tsconfig.json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}

// libs/shared/new-lib/tsconfig.build.json
{
  "extends": ["@oksai/tsconfig/node-library.json", "@oksai/tsconfig/build.json"],
  "compilerOptions": {
    "outDir": "./dist",
    "composite": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

---

## 故障排除指南

### 诊断命令集合

```bash
# 1. 检查构建产物
find libs -name "dist" -type d -exec ls -la {} \;

# 2. 检查符号链接
ls -la apps/gateway/node_modules/@oksai/

# 3. 检查 TypeScript 配置
pnpm exec tsc --showConfig -p libs/shared/logger/tsconfig.json

# 4. 检查依赖图
pnpm nx graph --focus=@oksai/gateway

# 5. 检查元数据
cat apps/gateway/dist/src/app.controller.js | grep "__metadata"

# 6. 验证 import type
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"
```

---

### 常用修复命令

```bash
# 完整清理和重建
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all
pnpm nx reset
pnpm build

# 修复依赖注入问题
find apps/gateway/src -name "*.ts" -exec \
  sed -i 's/import type { \([^}]*Service[^}]*\) }/import { \1 }/g' {} \;
```

---

## 附录

### A. 项目配置速查表

| 项目                        | 构建工具   | 配置包         | 特殊配置              |
| --------------------------- | ---------- | -------------- | --------------------- |
| `@oksai/domain-core`             | tsc        | node-library   | -                     |
| `@oksai/context`            | tsc        | node-library   | -                     |
| `@oksai/constants`          | tsc        | node-library   | -                     |
| `@oksai/config`             | tsup       | node-library   | external deps         |
| `@oksai/logger`             | tsup       | node-library   | external deps         |
| `@oksai/nestjs-better-auth` | tsup       | node-library   | external peer deps    |
| `@oksai/database`           | tsup       | node-library   | external MikroORM     |
| `apps/gateway`              | nest build | nestjs         | emitDecoratorMetadata |
| `apps/web-admin`            | vite       | tanstack-start | -                     |

---

### B. 参考资源

- [TypeScript 官方文档 - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Nx 官方文档 - Build System](https://nx.dev/concepts/build-system-and-plugins)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [NestJS - TypeScript Configuration](https://docs.nestjs.com/cli/monorepo#typescript-configuration)
- [tsup Documentation](https://tsup.egoist.dev/)

---

## 变更日志

### v2.0 (2026-03-07)

- ✅ 删除 `tsconfig.base.json`，使用 `@oksai/tsconfig` 共享配置包
- ✅ 统一 libs 下的 tsconfig.json 和 tsconfig.build.json 模板
- ✅ 精简配置，移除冗余项
- ✅ 与 Novu 配置策略对齐
- ✅ 保留严格模式（strict: true）
- ✅ 更新文档结构

### v1.0 (2026-03-05)

- ✅ 初始版本

---

**维护说明：**

- 当添加新库时，更新相应章节
- 当遇到新的配置问题时，添加到故障排除指南
- 定期审查和更新最佳实践
- 保持配置模板同步更新
