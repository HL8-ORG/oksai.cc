# TypeScript 配置模板

> 参考 Novu 最佳实践，本项目使用分层配置策略

## 一、配置策略概述

### 分层配置原则

```
tsconfig.base.json        # 根配置：最严格（ES2022 + Strict Mode）
├── apps/*/
│   ├── tsconfig.json     # 开发配置：中等严格度
│   └── tsconfig.build.json # 构建配置：排除测试，优化输出
└── libs/*/
    ├── tsconfig.json     # 开发配置：最严格（继承根配置）
    └── tsconfig.build.json # 构建配置：禁用 composite，确保输出
```

### 关键配置说明

| 配置项                  | 根配置  | 应用     | 库         | 说明                             |
| ----------------------- | ------- | -------- | ---------- | -------------------------------- |
| `strict`                | ✅ true | ✅ true  | ✅ true    | 启用所有严格类型检查             |
| `composite`             | ✅ true | ❌ false | ❌ false\* | \*仅开发配置启用，构建禁用       |
| `emitDecoratorMetadata` | ✅ true | ✅ true  | ❌ false\* | \*仅 NestJS 应用启用             |
| `target`                | ES2022  | ES2022   | ES2022     | 现代 JavaScript 特性             |
| `module`                | ESNext  | CommonJS | Node16     | 应用使用 CommonJS，库使用 Node16 |

## 二、应用配置模板

### 2.1 NestJS 应用

#### `apps/[app-name]/tsconfig.json` (开发配置)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "target": "ES2022",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "types": ["node", "@nestjs/core", "vitest/globals"]
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [
    // 添加库引用
    { "path": "../../libs/shared/logger" },
    { "path": "../../libs/shared/config" }
  ]
}
```

#### `apps/[app-name]/tsconfig.build.json` (构建配置)

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.e2e.ts",
    "test"
  ],
  "compilerOptions": {
    "removeComments": true,
    "declarationOnly": false,
    "noEmit": false
  }
}
```

### 2.2 TanStack Start 应用

#### `apps/[app-name]/tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

#### `apps/[app-name]/tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    },
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

## 三、库配置模板

### 3.1 使用 tsc 构建的库

#### `libs/[lib-name]/tsconfig.json` (开发配置)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "Node16",
    "moduleResolution": "Node16",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "references": [
    // 添加库依赖引用
    { "path": "../constants" },
    { "path": "../config" }
  ]
}
```

#### `libs/[lib-name]/tsconfig.build.json` (构建配置)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src"
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

**注意**：`composite: false` 是关键，避免增量编译缓存导致构建产物不更新

### 3.2 使用 tsup 构建的库

#### `libs/[lib-name]/tsconfig.json`

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

#### `libs/[lib-name]/tsup.config.ts`

```typescript
import { type Options } from 'tsup';

const config: Options = {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    // 添加外部依赖
    '@nestjs/common',
    '@oksai/config',
  ],
};

export default config;
```

**tsup 库不需要 tsconfig.build.json**，直接使用 tsup 处理构建

## 四、配置最佳实践

### 4.1 import type 使用规则

⚠️ **NestJS 依赖注入禁止使用 `import type`**

```typescript
// ❌ 错误 - 会导致依赖注入失败
import type { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {} // ❌ 运行时错误
}

// ✅ 正确
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {} // ✅ 正常
}
```

**规则**：

- 构造函数注入的 Service：**禁止** `import type`
- 方法参数类型：✅ 可以 `import type`
- 返回值类型：✅ 可以 `import type`
- 类装饰器：**禁止** `import type`

### 4.2 项目引用 (Project References)

**开发配置必须添加项目引用**：

```json
{
  "references": [
    { "path": "../../libs/shared/logger" },
    { "path": "../../libs/shared/config" },
    { "path": "../../libs/database" }
  ]
}
```

**好处**：

- ✅ 更快的增量构建
- ✅ 更好的 IDE 智能提示
- ✅ 强制依赖顺序

### 4.3 构建命令标准

```bash
# 清理所有构建缓存和产物
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all
pnpm nx reset

# 重新构建所有项目（Nx 自动处理依赖顺序）
pnpm build

# 构建特定项目（自动处理依赖）
pnpm nx build @oksai/gateway

# 检查构建影响范围
pnpm nx affected -t build
```

### 4.4 常见问题诊断

#### 问题 1: 类型声明文件找不到

```bash
# 清理并重新构建
find libs -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

#### 问题 2: 依赖注入元数据丢失

```bash
# 检查是否有 import type 导入 Service
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"

# 批量修复（谨慎使用）
find apps/gateway/src -name "*.ts" -exec \
  sed -i 's/import type { \([^}]*Service[^}]*\) }/import { \1 }/g' {} \;
```

#### 问题 3: 构建产物不更新

```bash
# 清理 composite 缓存
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

## 五、新项目创建清单

创建新的应用或库时，确保：

- [ ] 创建 `tsconfig.json` (extends tsconfig.base.json)
- [ ] 创建 `tsconfig.build.json` (composite: false，仅 tsc 构建)
- [ ] 添加项目引用 (references)
- [ ] 在 `tsconfig.base.json` 添加路径映射（如需）
- [ ] 选择构建工具 (tsc/tsup)
- [ ] 配置 `project.json` 构建目标
- [ ] 添加到依赖项目的 dependsOn（如被使用）

## 六、配置差异对比

### 与 Novu 的对比

| 特性           | oksai.cc           | Novu            | 说明               |
| -------------- | ------------------ | --------------- | ------------------ |
| 根配置严格度   | strict: true       | 宽松            | ✅ oksai.cc 更现代 |
| composite 策略 | 开发启用，构建禁用 | 部分启用        | ✅ 避免缓存问题    |
| 装饰器配置     | 全局启用           | 全局启用        | ✅ 一致            |
| 模块系统       | Node16/ESNext      | CommonJS/ESNext | ✅ oksai.cc 更现代 |
| import type    | 严格限制           | 无限制          | ✅ oksai.cc 更安全 |

## 七、迁移指南

### 从旧配置迁移到新配置

1. **备份现有配置**

```bash
cp tsconfig.json tsconfig.json.bak
cp tsconfig.build.json tsconfig.build.json.bak
```

2. **应用新配置模板**（参考上述模板）

3. **验证构建**

```bash
# 清理并重新构建
pnpm nx reset
pnpm build

# 运行测试
pnpm test

# 启动开发服务器
pnpm dev
```

4. **检查类型错误**

```bash
pnpm nx run-many -t typecheck --all
```

## 八、参考资料

- [TypeScript 官方文档 - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Nx 官方文档 - TypeScript](https://nx.dev/recipes/typescript)
- [Novu TypeScript 配置](https://github.com/novuhq/novu)
- [AGENTS.md - TypeScript Configuration Rules](../../AGENTS.md#五typescript-configuration-rules)
