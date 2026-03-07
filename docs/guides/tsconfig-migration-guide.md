# TypeScript 配置迁移指南

> 日期：2026-03-07
> 对齐目标：与 Novu 的 tsconfig 包管理模式对齐

## 一、迁移概述

### 1.1 为什么要迁移

1. **与 Novu 对齐**：未来将从 Novu 引入模块，保持配置一致性
2. **规模化准备**：为项目规模扩大做准备
3. **配置复用**：统一管理 TypeScript 配置
4. **易于维护**：修改一处，影响所有项目

### 1.2 迁移前后对比

#### 迁移前（文件继承）

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

#### 迁移后（包引用）

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

## 二、新配置包结构

### 2.1 包结构

```
libs/tsconfig/
├── package.json           # 包定义
├── README.md              # 使用文档
├── base.json              # 基础配置（最严格）
├── nestjs.json            # NestJS 应用配置
├── node-library.json      # Node.js 库配置
├── react-library.json     # React 库配置
├── tanstack-start.json    # TanStack Start 应用配置
└── build.json             # 构建配置（用于 tsconfig.build.json）
```

### 2.2 配置继承关系

```
base.json (基础)
├── nestjs.json (NestJS 应用)
├── node-library.json (Node.js 库)
├── react-library.json (React 库)
└── tanstack-start.json (TanStack Start 应用)
```

### 2.3 配置特点

| 配置文件            | module   | moduleResolution | composite | 特点                |
| ------------------- | -------- | ---------------- | --------- | ------------------- |
| base.json           | -        | node             | false     | 最严格基础配置      |
| nestjs.json         | CommonJS | Node             | -         | NestJS 应用         |
| node-library.json   | ESNext   | Bundler          | true      | Node.js 库          |
| react-library.json  | ESNext   | Bundler          | -         | React 库            |
| tanstack-start.json | ESNext   | Bundler          | -         | TanStack Start 应用 |

## 三、迁移步骤

### 3.1 添加依赖

在项目的 `package.json` 中添加：

```json
{
  "devDependencies": {
    "@oksai/tsconfig": "workspace:*"
  }
}
```

然后运行：

```bash
pnpm install
```

### 3.2 更新 tsconfig.json

#### Node.js 库

**旧配置**：

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node", "vitest/globals"]
  },
  "references": [{ "path": "../constants" }, { "path": "../config" }]
}
```

**新配置**：

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "references": [{ "path": "../constants" }, { "path": "../config" }]
}
```

**变化**：

- ✅ 使用包引用替代文件路径
- ✅ 移除重复配置（composite, types 等）
- ✅ 继承 node-library.json 的所有配置

#### NestJS 应用

**旧配置**：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "types": ["node", "@nestjs/core"]
  }
}
```

**新配置**：

```json
{
  "extends": "@oksai/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [
    { "path": "../../libs/shared/logger" },
    { "path": "../../libs/shared/config" }
  ]
}
```

**变化**：

- ✅ 使用 nestjs.json 预设
- ✅ 移除所有 NestJS 相关的重复配置
- ✅ 保留项目特定的配置

### 3.3 更新 tsconfig.build.json

#### tsc 构建的库

**旧配置**：

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**新配置**：

```json
{
  "extends": [
    "@oksai/tsconfig/node-library.json",
    "@oksai/tsconfig/build.json"
  ],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.int-spec.ts",
    "**/*.e2e-spec.ts"
  ]
}
```

**变化**：

- ✅ 使用数组 extends 继承多个配置
- ✅ 继承 node-library.json + build.json
- ✅ 保留 composite: false（关键！）

#### tsup 构建的库

**旧配置**：

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "outDir": "./dist",
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**新配置**：

```json
{
  "extends": [
    "@oksai/tsconfig/node-library.json",
    "@oksai/tsconfig/build.json"
  ],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**变化**：

- ✅ 使用包引用
- ✅ 保留特定的 noUnused 配置（因为 tsup 会处理）

### 3.4 NestJS 应用构建配置

**旧配置**：

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts", "test"]
}
```

**新配置**：

```json
{
  "extends": ["@oksai/tsconfig/nestjs.json", "@oksai/tsconfig/build.json"],
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "removeComments": true,
    "noEmit": false
  },
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

**变化**：

- ✅ 直接继承预设配置
- ✅ 移除对 tsconfig.json 的继承（避免循环依赖）
- ✅ 保留测试文件排除规则

## 四、迁移示例

### 4.1 迁移 logger 包（Node.js 库）

#### package.json

```diff
{
  "devDependencies": {
+   "@oksai/tsconfig": "workspace:*",
    "pino-pretty": "catalog:",
    "tsup": "catalog:"
  }
}
```

#### tsconfig.json

```diff
{
- "extends": "../../../tsconfig.base.json",
+ "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
-   "composite": true,
+   "baseUrl": ".",
    "rootDir": "./src",
-   "outDir": "./dist",
-   "types": ["node", "vitest/globals"]
+   "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "references": [
    { "path": "../constants" },
    { "path": "../config" },
    { "path": "../context" }
  ]
}
```

#### tsconfig.build.json

```diff
{
- "extends": "../../../tsconfig.base.json",
+ "extends": ["@oksai/tsconfig/node-library.json", "@oksai/tsconfig/build.json"],
  "compilerOptions": {
-   "composite": false,
-   "declaration": true,
-   "declarationMap": true,
    "outDir": "./dist",
-   "noUnusedLocals": false,
-   "noUnusedParameters": false
+   "rootDir": "./src",
+   "composite": false,
+   "noUnusedLocals": false,
+   "noUnusedParameters": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### 4.2 迁移 gateway 应用（NestJS）

#### package.json

```diff
{
  "devDependencies": {
+   "@oksai/tsconfig": "workspace:*",
    "@nestjs/cli": "catalog:",
    ...
  }
}
```

#### tsconfig.json

```diff
{
- "extends": "../../tsconfig.base.json",
+ "extends": "@oksai/tsconfig/nestjs.json",
  "compilerOptions": {
-   "module": "CommonJS",
-   "moduleResolution": "node",
-   "declaration": true,
-   "removeComments": true,
-   "emitDecoratorMetadata": true,
-   "experimentalDecorators": true,
-   "allowSyntheticDefaultImports": true,
-   "target": "ES2022",
-   "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
-   "incremental": true,
-   "skipLibCheck": true,
-   "strictNullChecks": true,
-   "noImplicitAny": true,
-   "strictBindCallApply": true,
-   "forceConsistentCasingInFileNames": true,
-   "noFallthroughCasesInSwitch": true,
-   "esModuleInterop": true,
-   "resolveJsonModule": true,
-   "declarationOnly": false,
-   "noEmit": false,
-   "types": ["@nestjs/core", "@nestjs/swagger"],
-   "stripInternal": true
+   "incremental": true,
+   "declaration": true,
+   "declarationMap": true,
+   "sourceMap": true,
+   "types": ["node", "@nestjs/core", "@nestjs/swagger", "vitest/globals"]
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [
    { "path": "../../libs/shared/nestjs-better-auth" },
    { "path": "../../libs/shared/logger" },
    ...
  ]
}
```

#### tsconfig.build.json

```diff
{
- "extends": "./tsconfig.json",
+ "extends": ["@oksai/tsconfig/nestjs.json", "@oksai/tsconfig/build.json"],
+ "compilerOptions": {
+   "outDir": "./dist",
+   "baseUrl": "./",
+   "removeComments": true,
+   "declaration": true,
+   "declarationMap": true,
+   "sourceMap": true,
+   "noEmit": false
+ },
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.test.ts",
+   "**/*.e2e.ts",
    "test"
  ]
}
```

## 五、批量迁移脚本

创建一个辅助脚本 `scripts/migrate-tsconfig.sh`：

```bash
#!/bin/bash

# 为 Node.js 库添加依赖
for dir in libs/shared/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Adding @oksai/tsconfig to $dir"
    jq '.devDependencies["@oksai/tsconfig"] = "workspace:*"' "$dir/package.json" > tmp.json && mv tmp.json "$dir/package.json"
  fi
done

# 为应用添加依赖
for dir in apps/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Adding @oksai/tsconfig to $dir"
    jq '.devDependencies["@oksai/tsconfig"] = "workspace:*"' "$dir/package.json" > tmp.json && mv tmp.json "$dir/package.json"
  fi
done

echo "Migration completed. Please run 'pnpm install'"
```

**使用方法**：

```bash
chmod +x scripts/migrate-tsconfig.sh
./scripts/migrate-tsconfig.sh
pnpm install
```

## 六、验证迁移

### 6.1 类型检查

```bash
# 检查单个项目
cd libs/shared/logger
pnpm typecheck

# 检查所有项目
pnpm nx run-many -t typecheck --all
```

### 6.2 构建测试

```bash
# 构建单个项目
pnpm nx build @oksai/logger

# 构建所有项目
pnpm build

# 清理并重新构建
find . -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

### 6.3 运行测试

```bash
# 运行单个项目测试
cd libs/shared/logger
pnpm test

# 运行所有测试
pnpm test
```

## 七、常见问题

### 7.1 找不到 @oksai/tsconfig

**问题**：

```
Error: Cannot find module '@oksai/tsconfig'
```

**解决**：

```bash
pnpm install
```

### 7.2 模块系统冲突

**问题**：

```
The current file is a CommonJS module whose imports will produce 'require' calls
```

**解决**：使用 `node-library.json` 而不是 `tsconfig.base.json`

### 7.3 构建产物不更新

**问题**：修改代码后构建产物没有更新

**解决**：

```bash
# 清理缓存
find . -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

### 7.4 项目引用错误

**问题**：

```
File '/path/to/project/tsconfig.json' is not a project
```

**解决**：确保被引用的项目有 `composite: true`

```json
{
  "compilerOptions": {
    "composite": true
  }
}
```

## 八、迁移清单

### 8.1 Node.js 库（使用 tsup）

- [ ] `libs/shared/logger`
- [ ] `libs/shared/config`
- [ ] `libs/shared/constants`
- [ ] `libs/database`
- [ ] `libs/notification/email`
- [ ] `libs/shared/better-auth-mikro-orm`
- [ ] `libs/shared/nestjs-better-auth`
- [ ] `libs/shared/nestjs-utils`
- [ ] `libs/cache`

### 8.2 Node.js 库（使用 tsc）

- [ ] `libs/shared/kernel`
- [ ] `libs/shared/context`
- [ ] `libs/shared/exceptions`
- [ ] `libs/shared/event-store`
- [ ] `libs/shared/repository`
- [ ] `libs/testing`

### 8.3 NestJS 应用

- [ ] `apps/gateway`

### 8.4 TanStack Start 应用

- [ ] `apps/web-admin`

## 九、参考资料

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Novu tsconfig](https://github.com/novuhq/novu/tree/next/libs/maily-tsconfig)
- [@oksai/tsconfig README](../libs/shared/tsconfig/README.md)
- [AGENTS.md - TypeScript Configuration](../AGENTS.md#五typescript-configuration-rules)

---

**迁移完成后记得**：

1. ✅ 运行 `pnpm install`
2. ✅ 验证类型检查
3. ✅ 验证构建
4. ✅ 验证测试
5. ✅ 清理旧的 tsconfig.base.json（可选）
