# TypeScript 配置方案和策略

> **文档版本**: v1.0  
> **最后更新**: 2026-03-05  
> **维护者**: Oksai Team

---

## 目录

1. [项目概述](#项目概述)
2. [TypeScript 配置架构](#typescript-配置架构)
3. [关键配置详解](#关键配置详解)
4. [库构建策略](#库构建策略)
5. [常见问题和解决方案](#常见问题和解决方案)
6. [最佳实践](#最佳实践)
7. [故障排除指南](#故障排除指南)

---

## 项目概述

### 项目结构

```
oksai.cc/
├── apps/                    # 应用程序
│   ├── gateway/            # NestJS API Gateway
│   └── web-admin/          # TanStack Start 管理后台
├── libs/                    # 共享库
│   ├── database/           # 数据库层
│   ├── oauth/              # OAuth 服务
│   ├── testing/            # 测试工具
│   ├── notification/       # 通知服务
│   │   └── email/          # 邮件服务
│   └── shared/             # 共享业务逻辑
│       ├── kernel/         # DDD 核心基类
│       ├── config/         # 配置管理
│       ├── logger/         # 日志服务
│       ├── context/        # 上下文管理
│       └── ...
├── tsconfig.base.json      # 基础 TypeScript 配置
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
tsconfig.base.json (基础配置)
    ↓
┌───┴────────────────────┐
│                        │
tsconfig.json          tsconfig.build.json
(开发配置)              (构建配置)
    ↓                      ↓
[IDE/类型检查]         [生产构建]
```

### 三层配置策略

#### 1. 基础配置 (`tsconfig.base.json`)

所有项目共享的基础配置：

```json
{
  "compilerOptions": {
    // 模块系统
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "es2022",
    "lib": ["es2022"],
    
    // 类型检查
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    
    // 输出配置
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // 互操作性
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // 路径映射
    "baseUrl": ".",
    "paths": {
      "@oksai/*": ["libs/*", "libs/shared/*"]
    }
  }
}
```

**关键点：**
- ✅ `composite: true` - 启用项目引用（用于增量构建）
- ✅ `moduleResolution: "bundler"` - 现代 Node.js 解析策略
- ✅ `strict: true` - 严格类型检查
- ⚠️ **不使用 `noEmit`** - 允许生成构建产物

---

#### 2. 开发配置 (`tsconfig.json`)

每个项目的开发配置（IDE + 类型检查）：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**用途：**
- IDE 类型提示
- `pnpm tsc --noEmit` 类型检查
- 项目引用（Project References）

---

#### 3. 构建配置 (`tsconfig.build.json`)

生产构建专用配置：

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,  // ⚠️ 关键：禁用增量编译缓存
    "module": "node16",
    "moduleResolution": "node16",
    "removeComments": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.int-spec.ts",
    "**/*.e2e-spec.ts"
  ]
}
```

**关键决策：**

| 配置项 | 值 | 原因 |
|--------|---|------|
| `composite` | `false` | 避免增量编译缓存导致构建产物不更新 |
| `module` | `"node16"` | 支持 ESM/CommonJS 互操作 |
| `moduleResolution` | `"node16"` | 正确解析 package.json exports |

---

## 关键配置详解

### 1. `composite` 配置策略

#### 问题背景

TypeScript 的 `composite: true` 会生成 `.tsbuildinfo` 缓存文件，导致以下问题：

```bash
# 问题场景
pnpm nx run @oksai/kernel:clean  # 删除 dist/
pnpm nx run @oksai/kernel:build  # ❌ 不生成 dist/，因为有缓存
```

#### 解决方案

**开发配置（`tsconfig.json`）：**
```json
{
  "compilerOptions": {
    "composite": true  // ✅ 启用，用于项目引用和 IDE
  }
}
```

**构建配置（`tsconfig.build.json`）：**
```json
{
  "compilerOptions": {
    "composite": false  // ⚠️ 禁用，确保生成构建产物
  }
}
```

#### 适用项目

需要此配置的库（使用 `tsc` 构建）：

```
✅ libs/shared/kernel/
✅ libs/shared/context/
✅ libs/shared/config/        (部分)
✅ libs/shared/better-auth-mikro-orm/
✅ libs/shared/constants/      (部分)
```

**不需要的库（使用 `tsup` 构建）：**

```
❌ libs/shared/logger/        (tsup)
❌ libs/shared/nestjs-better-auth/ (tsup)
❌ libs/database/             (tsup)
❌ libs/oauth/                (tsup)
```

---

### 2. `emitDecoratorMetadata` 配置

#### NestJS 依赖注入原理

NestJS 使用 TypeScript 的 `emitDecoratorMetadata` 在编译时生成元数据：

```typescript
// 源代码
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}

// 编译后（正确）
__metadata("design:paramtypes", [AppService])

// 编译后（错误）
__metadata("design:paramtypes", [Function])  // ❌
```

#### 关键规则

**✅ 正确用法：**

```typescript
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}  // ✅
}
```

**❌ 错误用法：**

```typescript
import type { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}  // ❌ 元数据丢失
}
```

#### 配置要求

在 `apps/gateway/tsconfig.json` 中：

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2022"
  }
}
```

#### 受影响的场景

| 场景 | 是否可以用 `import type` |
|------|------------------------|
| 构造函数注入的 Service | ❌ 不可以 |
| 方法参数的类型 | ✅ 可以 |
| 返回值类型 | ✅ 可以 |
| 属性类型 | ✅ 可以 |
| 泛型参数 | ✅ 可以 |

**批量检查命令：**

```bash
# 检查所有可能导致问题的 import type
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"
```

---

### 3. 路径映射 (Path Mapping)

#### 配置方式

**基础配置 (`tsconfig.base.json`):**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@oksai/kernel": ["libs/shared/kernel/src/index.ts"],
      "@oksai/config": ["libs/shared/config/src/index.ts"],
      "@oksai/logger": ["libs/shared/logger/src/index.ts"]
    }
  }
}
```

**应用配置 (`apps/gateway/tsconfig.json`):**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "./",
    "moduleResolution": "node"  // 使用 node 而非 bundler
  }
}
```

#### pnpm Workspace 符号链接

pnpm 自动创建符号链接：

```
apps/gateway/node_modules/@oksai/
├── config -> ../../libs/shared/config
├── logger -> ../../libs/shared/logger
└── kernel -> ../../libs/shared/kernel
```

**验证命令：**

```bash
ls -la apps/gateway/node_modules/@oksai/
```

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

| 项目 | 原因 |
|------|------|
| `@oksai/kernel` | 纯 DDD 基础类，无复杂依赖 |
| `@oksai/context` | 上下文管理，简单结构 |
| `@oksai/better-auth-mikro-orm` | 简单的适配器层 |
| `@oksai/constants` | 常量定义 |

**配置示例：**

```json
// package.json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc -p tsconfig.build.json --watch"
  }
}

// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "module": "node16",
    "moduleResolution": "node16",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**输出结构：**

```
dist/
├── index.js
├── index.d.ts
├── index.js.map
├── index.d.ts.map
└── lib/
    ├── entity.js
    └── entity.d.ts
```

---

### 2. 使用 `tsup` 构建的库

**适用场景：**
- 需要多格式输出（CJS + ESM）
- 需要打包优化
- 有复杂的外部依赖

**项目列表：**

| 项目 | 原因 |
|------|------|
| `@oksai/logger` | 需要 CJS + ESM，外部依赖多 |
| `@oksai/config` | 需要 CJS + ESM，环境变量解析 |
| `@oksai/nestjs-better-auth` | 需要处理 peer dependencies |
| `@oksai/database` | 复杂的数据库层，外部依赖多 |
| `@oksai/oauth` | OAuth 协议实现，依赖复杂 |

**配置示例：**

```json
// package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts"
  }
}

// tsup.config.ts
import { type Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "@nestjs/common",
    "@nestjs/core"
  ]
};

export default config;
```

**输出结构：**

```
dist/
├── index.js          # CommonJS
├── index.js.map
├── index.mjs         # ESM
├── index.mjs.map
├── index.d.ts        # 类型声明
└── index.d.mts
```

**关键配置：**

```typescript
// tsup.config.ts
export default {
  // ✅ 声明外部依赖，避免打包进产物
  external: [
    "@oksai/config",
    "@oksai/constants",
    "@nestjs/common"
  ],
  
  // ✅ 生成类型声明
  dts: true,
  
  // ✅ 生成 sourcemap
  sourcemap: true,
  
  // ✅ 清理旧产物
  clean: true
}
```

---

### 3. NestJS 应用构建

**配置：**

```json
// apps/gateway/project.json
{
  "name": "@oksai/gateway",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "dependsOn": ["^build"],  // ⚠️ 关键：确保依赖先构建
      "options": {
        "command": "nest build"
      }
    }
  }
}
```

**`dependsOn` 的重要性：**

```json
"dependsOn": ["^build"]

// ^ 表示所有依赖项目
// 确保构建顺序：
// 1. @oksai/kernel
// 2. @oksai/context
// 3. @oksai/config
// 4. @oksai/logger
// 5. @oksai/gateway  ← 最后构建
```

**验证构建顺序：**

```bash
# 查看依赖图
pnpm nx graph --focus=@oksai/gateway

# 串行构建（调试用）
pnpm nx run-many -t build --all --parallel=false
```

---

## 常见问题和解决方案

### 问题 1: 类型声明文件找不到

**症状：**

```
error TS7016: Could not find a declaration file for module '@oksai/logger'.
```

**原因：**

1. 库未构建
2. 构建产物被清理但未重新构建
3. TypeScript 增量编译缓存

**解决方案：**

```bash
# 方案 1: 清理所有缓存并重新构建
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx reset
NX_SKIP_NX_CLOUD=true pnpm build

# 方案 2: 重新构建特定库
pnpm nx build @oksai/logger --skip-nx-cache

# 方案 3: 完整重建
rm -rf libs/**/dist apps/**/dist .nx
NX_SKIP_NX_CLOUD=true pnpm build
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

**预防措施：**

在 CI/CD 中添加检查：

```bash
#!/bin/bash
# scripts/check-import-type.sh

ERRORS=$(grep -rn "import type.*Service" apps/gateway/src --include="*.ts" | \
         grep -v ".spec.ts" | \
         grep -v "// @ts-ignore")

if [ ! -z "$ERRORS" ]; then
  echo "❌ 发现使用 'import type' 导入 Service 的代码："
  echo "$ERRORS"
  exit 1
fi

echo "✅ 检查通过"
```

---

### 问题 3: rimraf: not found

**症状：**

```
sh: 1: rimraf: not found
ELIFECYCLE  Command failed.
```

**原因：**

pnpm workspace 中，`rimraf` 在根目录的 `node_modules`，但子包脚本找不到。

**解决方案：**

```bash
# 1. 安装 rimraf 到根 package.json
pnpm add -D -w rimraf

# 2. 修改所有库的 clean 脚本
find libs apps -name "package.json" -type f -exec \
  sed -i 's/"clean": "rimraf/"clean": "pnpm exec rimraf/g' {} \;
```

**验证：**

```bash
pnpm nx run @oksai/kernel:clean
```

---

### 问题 4: 构建顺序错误

**症状：**

```
Error: Cannot find module '@oksai/logger/dist/index.js'
```

**原因：**

gateway 在依赖库构建前就开始构建。

**解决方案：**

在 `apps/gateway/project.json` 添加：

```json
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]  // ← 关键
    }
  }
}
```

**Nx 全局配置 (`nx.json`):**

```json
{
  "targetDefaults": {
    "test": {
      "dependsOn": ["^build"]
    },
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

### 问题 5: Nx Cloud 连接失败

**症状：**

```
NX   Nx Cloud encountered some problems
This workspace is more than three days old and is not connected.
```

**解决方案：**

```bash
# 方案 1: 跳过 Nx Cloud
export NX_SKIP_NX_CLOUD=true

# 方案 2: 永久禁用
# nx.json
{
  "neverConnectToCloud": true
}

# 方案 3: 重新连接
pnpm nx connect
```

---

## 最佳实践

### 1. 导入规则

#### ✅ DO - 推荐做法

```typescript
// ✅ 注入的服务必须正常导入
import { AppService } from "./app.service";
import { ConfigService } from "@oksai/config";
import { LoggerService } from "@oksai/logger";

// ✅ 纯类型可以使用 import type
import type { IUser } from "./user.interface";
import type { ConfigOptions } from "@oksai/config";
import type { Request, Response } from "express";

// ✅ 类型 + 值混合导入
import { Controller, Get, type Request } from "@nestjs/common";
```

#### ❌ DON'T - 避免的做法

```typescript
// ❌ 注入的服务不要用 import type
import type { AppService } from "./app.service";

// ❌ 运行时需要的值不要用 import type
import type { APP_GUARD } from "@nestjs/core";

// ❌ 类装饰器不要用 import type
import type { Injectable } from "@nestjs/common";
```

---

### 2. 构建流程

#### 标准构建流程

```bash
# 1. 清理
find libs apps -name "*.tsbuildinfo" -delete
NX_SKIP_NX_CLOUD=true pnpm nx run-many -t clean --all

# 2. 重置 Nx 缓存
pnpm nx reset

# 3. 构建
NX_SKIP_NX_CLOUD=true pnpm build

# 4. 验证
pnpm test
```

#### 开发流程

```bash
# 1. 首次启动前构建所有依赖
NX_SKIP_NX_CLOUD=true pnpm build

# 2. 启动开发服务器
pnpm dev

# 3. 修改库后重新构建
pnpm nx build @oksai/logger --skip-nx-cache
```

---

### 3. 新库创建清单

创建新的共享库时，确保：

```markdown
- [ ] 创建 `tsconfig.json` (extends base)
- [ ] 创建 `tsconfig.build.json` (composite: false)
- [ ] 在 `tsconfig.base.json` 添加路径映射
- [ ] 在 `package.json` 添加依赖声明
- [ ] 选择构建工具 (tsc/tsup)
- [ ] 配置 `project.json` (如果需要)
- [ ] 添加到根 `nx.json` 的依赖图
```

**模板：**

```json
// libs/shared/new-lib/tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"]
}

// libs/shared/new-lib/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "module": "node16",
    "moduleResolution": "node16"
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

---

### 4. CI/CD 配置

#### GitHub Actions 示例

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 10.30.3
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: NX_SKIP_NX_CLOUD=true pnpm build
      
      - name: Test
        run: NX_SKIP_NX_CLOUD=true pnpm test
      
      - name: Lint
        run: NX_SKIP_NX_CLOUD=true pnpm lint
```

---

### 5. 性能优化

#### 增量构建

```bash
# 使用 Nx 增量构建
pnpm nx build @oksai/gateway

# Nx 会自动：
# 1. 检查依赖变化
# 2. 只重新构建受影响的项目
# 3. 使用缓存加速
```

#### 并行构建

```bash
# 默认并行构建（推荐）
pnpm nx run-many -t build --all

# 调整并行度
pnpm nx run-many -t build --all --parallel=4

# 串行构建（调试用）
pnpm nx run-many -t build --all --parallel=false
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
cd libs/shared/logger && pnpm tsc --showConfig

# 4. 检查依赖图
pnpm nx graph --focus=@oksai/gateway

# 5. 检查缓存
ls -la .nx/cache/

# 6. 检查元数据
cat apps/gateway/dist/src/app.controller.js | grep "__metadata"

# 7. 验证 import type
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"

# 8. 检查 package.json exports
cat libs/shared/logger/package.json | grep -A 10 '"exports"'
```

---

### 常用修复命令

```bash
# 完整清理和重建
rm -rf libs/**/dist apps/**/dist .nx node_modules/.cache
find . -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm install
NX_SKIP_NX_CLOUD=true pnpm build

# 修复依赖注入问题
find apps/gateway/src -name "*.ts" -exec \
  sed -i 's/import type { \([^}]*Service[^}]*\) }/import { \1 }/g' {} \;

# 修复 composite 问题
find libs/shared -name "tsconfig.build.json" -exec \
  sed -i '/"extends": "\.\/tsconfig\.json",/a\\t\t"composite": false,' {} \;

# 清理 rimraf 问题
find libs apps -name "package.json" -exec \
  sed -i 's/"clean": "rimraf/"clean": "pnpm exec rimraf/g' {} \;
```

---

### 调试技巧

#### 1. 查看编译后的代码

```bash
# 检查元数据是否正确
cat apps/gateway/dist/src/app.controller.js | grep -A 5 "__metadata"

# 检查导入是否被移除
cat libs/shared/logger/dist/index.js | grep "import type"
```

#### 2. 查看依赖解析

```bash
# 查看 Node.js 模块解析
node -e "console.log(require.resolve('@oksai/logger'))"

# 查看 pnpm 符号链接
ls -la apps/gateway/node_modules/@oksai/logger
```

#### 3. 查看 Nx 任务图

```bash
# 查看构建任务图
pnpm nx run @oksai/gateway:build --graph

# 查看项目依赖
pnpm nx show project @oksai/gateway --web
```

---

## 附录

### A. 项目配置速查表

| 项目 | 构建工具 | composite | 特殊配置 |
|------|---------|-----------|---------|
| `@oksai/kernel` | tsc | ❌ false | - |
| `@oksai/context` | tsc | ❌ false | - |
| `@oksai/config` | tsup | N/A | external deps |
| `@oksai/logger` | tsup | N/A | external deps |
| `@oksai/nestjs-better-auth` | tsup | N/A | external peer deps |
| `@oksai/database` | tsup | N/A | external MikroORM |
| `apps/gateway` | nest build | N/A | emitDecoratorMetadata |

---

### B. 配置文件模板

#### tsc 库模板

```json
// package.json
{
  "name": "@oksai/lib-name",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc -p tsconfig.build.json --watch",
    "typecheck": "tsc --noEmit",
    "clean": "pnpm exec rimraf dist coverage"
  }
}

// tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  }
}

// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "module": "node16",
    "moduleResolution": "node16",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

#### tsup 库模板

```json
// package.json
{
  "name": "@oksai/lib-name",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "clean": "pnpm exec rimraf dist coverage"
  }
}
```

---

### C. 参考资源

- [TypeScript 官方文档 - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Nx 官方文档 - Build System](https://nx.dev/concepts/build-system-and-plugins)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [NestJS - TypeScript Configuration](https://docs.nestjs.com/cli/monorepo#typescript-configuration)
- [tsup Documentation](https://tsup.egoist.dev/)

---

## 变更日志

### v1.0 (2026-03-05)

- ✅ 初始版本
- ✅ 文档化所有已知问题和解决方案
- ✅ 添加配置模板和最佳实践
- ✅ 提供完整的故障排除指南

---

**维护说明：**

- 当添加新库时，更新相应章节
- 当遇到新的配置问题时，添加到故障排除指南
- 定期审查和更新最佳实践
- 保持配置模板同步更新

**贡献指南：**

如发现新的配置问题或有改进建议，请：
1. 在项目中创建 Issue
2. 提供复现步骤
3. 提交 PR 更新本文档
