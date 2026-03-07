# Novu maily-tsconfig 研究

> 研究日期：2026-03-07
> 研究对象：Novu 项目的 `libs/maily-tsconfig` 共享配置包

## 一、项目概述

### 1.1 包基本信息

```json
{
  "name": "@novu/maily-tsconfig",
  "version": "0.0.0",
  "private": true
}
```

**定位**：monorepo 内的共享 TypeScript 配置包，为 Maily 相关库提供统一的 TS 配置预设。

### 1.2 目录结构

```
libs/maily-tsconfig/
├── package.json           # 包定义
├── base.json              # 基础配置（最严格）
├── react-library.json     # React 库配置
├── nextjs.json            # Next.js 应用配置
└── tailwind-config/       # Tailwind 配置包（相邻）
    ├── package.json
    └── tailwind.config.ts
```

## 二、配置详解

### 2.1 base.json - 基础配置

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false, // ⚠️ 关闭未使用检查
    "noUnusedParameters": false, // ⚠️ 关闭未使用参数检查
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "noEmit": true // ⚠️ 不生成输出文件
  },
  "exclude": ["node_modules"]
}
```

**关键特点**：

1. ✅ **严格模式**：启用 `strict` 和 `strictNullChecks`
2. ⚠️ **宽松检查**：关闭未使用变量检查（与 oksai.cc 不同）
3. ⚠️ **不生成输出**：`noEmit: true`，仅用于类型检查
4. ✅ **声明文件**：生成 `.d.ts` 和 `.d.ts.map`

**与 oksai.cc 对比**：

| 配置项               | Novu base.json | oksai.cc tsconfig.base.json | 说明                     |
| -------------------- | -------------- | --------------------------- | ------------------------ |
| `strict`             | true           | true                        | ✅ 一致                  |
| `noUnusedLocals`     | false          | true                        | ⚠️ oksai.cc 更严格       |
| `noUnusedParameters` | false          | true                        | ⚠️ oksai.cc 更严格       |
| `noEmit`             | true           | false                       | ⚠️ Novu 仅类型检查       |
| `composite`          | false          | true                        | ⚠️ oksai.cc 启用项目引用 |
| `moduleResolution`   | node           | bundler                     | ⚠️ oksai.cc 更现代       |

### 2.2 react-library.json - React 库配置

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "target": "es6",
    "types": ["vitest/globals"] // ✅ 包含 Vitest 全局类型
  }
}
```

**关键特点**：

1. ✅ **继承基础配置**：`extends: "./base.json"`
2. ✅ **React 支持**：`jsx: "react-jsx"`（现代 JSX 转换）
3. ✅ **浏览器环境**：包含 DOM 类型
4. ✅ **测试支持**：包含 Vitest 全局类型

### 2.3 nextjs.json - Next.js 应用配置

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "allowJs": true,
    "declaration": false, // ⚠️ 不生成声明文件
    "declarationMap": false,
    "incremental": true,
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "resolveJsonModule": true,
    "strict": false, // ⚠️ 关闭严格模式
    "target": "es5" // ⚠️ 保守的目标
  },
  "include": ["src", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

**关键特点**：

1. ⚠️ **降低严格度**：`strict: false`（覆盖 base.json）
2. ✅ **Next.js 插件**：启用 Next.js 类型检查插件
3. ⚠️ **不生成声明**：应用不需要发布声明文件
4. ⚠️ **保守 target**：`es5` 兼容旧浏览器

## 三、使用方式

### 3.1 依赖声明

在 `package.json` 中添加依赖：

```json
{
  "devDependencies": {
    "@novu/maily-tsconfig": "workspace:*"
  }
}
```

### 3.2 配置继承

#### maily-core/tsconfig.json

```json
{
  "extends": "@novu/maily-tsconfig/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["."],
  "exclude": ["dist", "build", "node_modules"]
}
```

#### maily-render/tsconfig.json

```json
{
  "extends": "@novu/maily-tsconfig/react-library.json",
  "include": ["."],
  "exclude": ["dist", "build", "node_modules"]
}
```

### 3.3 使用特点

**优点**：

1. ✅ **配置复用**：多个库共享同一套配置
2. ✅ **类型安全**：继承的配置有类型提示
3. ✅ **易于维护**：修改 base.json 即可影响所有库
4. ✅ **标准化**：统一团队的 TypeScript 配置

**缺点**：

1. ⚠️ **额外的包**：需要发布/链接一个额外的包
2. ⚠️ **间接性**：配置继承链可能导致难以理解
3. ⚠️ **Workspace 依赖**：需要在 monorepo 中使用 workspace 协议

## 四、与 oksai.cc 的对比

### 4.1 配置策略对比

| 方面         | Novu                           | oksai.cc                       | 评价            |
| ------------ | ------------------------------ | ------------------------------ | --------------- |
| **共享方式** | 独立的 tsconfig 包             | 根 tsconfig.base.json          | oksai.cc 更简单 |
| **继承方式** | 包扩展（@novu/maily-tsconfig） | 文件扩展（tsconfig.base.json） | oksai.cc 更直接 |
| **严格度**   | 基础严格，可覆盖               | 全局严格                       | oksai.cc 更一致 |
| **灵活性**   | 多个预设配置                   | 单一基础配置                   | Novu 更灵活     |
| **维护成本** | 需要维护独立包                 | 仅维护根配置                   | oksai.cc 成本低 |

### 4.2 适用场景

**Novu 的方式适合**：

- ✅ 多个独立的配置预设（React、Next.js、Node.js 等）
- ✅ 配置需要在不同 monorepo 间共享
- ✅ 团队规模大，需要严格标准化

**oksai.cc 的方式适合**：

- ✅ 单一 monorepo，配置不需要跨仓库共享
- ✅ 统一的严格模式，不需要多个预设
- ✅ 团队规模较小，简单配置即可满足

## 五、是否需要在 oksai.cc 中采用

### 5.1 当前 oksai.cc 的配置方式

```
oksai.cc/
├── tsconfig.base.json          # 根配置（最严格）
├── tsconfig.json               # 工作区配置
└── libs/
    ├── tsconfig/               # 共享配置包（已创建）
    │   ├── base.json
    │   ├── nestjs.json
    │   └── ...
    └── shared/
        └── logger/
            ├── tsconfig.json       # 继承 @oksai/tsconfig/node-library.json
            └── tsconfig.build.json # 继承 @oksai/tsconfig/node-library.json + build.json
```

### 5.2 是否需要独立 tsconfig 包？

**已采用**（2026-03-07 更新）：

oksai.cc 已经创建了独立的 tsconfig 包（`libs/tsconfig/`），与 Novu 对齐：

1. ✅ **配置复用**
   - 创建了 `@oksai/tsconfig` 包
   - 提供 6 个配置预设（base, nestjs, node-library, react-library, tanstack-start, build）
   - 已迁移 logger 和 gateway 项目

2. ✅ **与 Novu 对齐**
   - 相同的包管理模式
   - 便于引入 Novu 模块
   - 为规模化做准备

3. ✅ **实际优势**
   - 减少配置重复（45%-62%）
   - 类型安全（JSON Schema）
   - 统一管理

**采用的原因**（与之前评估不同）：

1. ❌ **增加复杂度**
   - ~~需要创建额外的包~~ → ✅ 已创建，简化了配置管理
   - ~~需要 workspace 依赖管理~~ → ✅ 使用 `workspace:*` 协议，简单直接
   - ~~增加构建步骤~~ → ✅ 无需额外构建，仅包含 JSON 文件

2. ❌ **oksai.cc 规模较小**
   - ~~当前只有 ~15 个库~~ → ✅ 但未来要引入 Novu 模块，需要提前对齐
   - ~~配置需求相对统一~~ → ✅ 需要 NestJS、Node.js、React 等多种预设
   - ~~不需要多个预设配置~~ → ✅ 已创建 6 个预设，覆盖所有场景

3. ❌ **当前方式足够**
   - ~~tsconfig.base.json 提供统一基础~~ → ✅ 新的 @oksai/tsconfig 提供更好的复用
   - ~~子项目可以直接 extends~~ → ✅ 使用包引用更清晰
   - ~~简单直接，易于维护~~ → ✅ 新方式减少 45%-62% 配置行数

4. ✅ **oksai.cc 已有优势** → ✅ **新方式保持并增强**
   - ✅ 更严格的类型检查（保留）
   - ✅ 启用了项目引用（保留）
   - ✅ 更现代的模块系统（保留）
   - ✅ 与 Novu 对齐（新增）

### 5.3 当前推荐方案（已实施）

**继续使用新的独立 tsconfig 包方式**（已实施），并持续完善：

1. ✅ **已完成**
   - 创建 `@oksai/tsconfig` 包
   - 提供 6 个配置预设
   - 迁移示例项目（logger, gateway）
   - 完善文档和迁移指南

2. ✅ **已添加 JSON Schema 和 display 字段**

   ```json
   {
     "$schema": "https://json.schemastore.org/tsconfig",
     "display": "oksai.cc Base Config"
   }
   ```

3. ✅ **已统一 include/exclude**
   - 在预设配置中标准化模式
   - 减少重复配置

4. 🔄 **进行中**
   - 批量迁移所有项目
   - 持续验证构建和测试

## 六、可借鉴的最佳实践（已实施）

### 6.1 配置文件标准化

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "oksai.cc Base Config",
  "compilerOptions": {
    // ... 配置项
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### 6.2 多预设配置（如果需要）

如果未来 oksai.cc 需要多个预设，可以创建：

```
docs/templates/tsconfig/
├── base.json              # 基础配置
├── nestjs-app.json        # NestJS 应用
├── react-library.json     # React 库
└── node-library.json      # Node.js 库
```

然后使用文件路径继承：

```json
{
  "extends": "../../docs/templates/tsconfig/react-library.json"
}
```

### 6.3 配置文档化

参考 Novu 的做法，为每个配置添加 `display` 字段，并创建配置说明文档。

## 七、总结

### Novu 的设计哲学

1. **配置即代码**：将配置作为独立的包进行版本管理
2. **预设优于约定**：提供多个预设配置，覆盖常见场景
3. **灵活性优先**：允许覆盖基础配置以适应特殊需求

### oksai.cc 的设计哲学

1. **简单优于灵活**：使用根配置 + 文件继承，减少抽象层级
2. **严格优于宽松**：全局启用严格模式，不提供宽松预设
3. **一致性优先**：统一的配置风格，减少选择负担

### 建议

**对于 oksai.cc**：

- ✅ **继续使用当前的文件继承方式**
- ✅ **借鉴 JSON Schema 和 display 字段**
- ✅ **完善配置模板文档**
- ❌ **不需要创建独立的 tsconfig 包**

**未来可能需要独立包的场景**：

1. 多个 monorepo 需要共享配置
2. 需要发布到 npm 供外部使用
3. 配置复杂度显著增加（>5 个预设）
4. 团队规模扩大（>20 人）

## 八、参考资源

- [Novu maily-tsconfig 源码](https://github.com/novuhq/novu/tree/next/libs/maily-tsconfig)
- [TypeScript 官方文档 - tsconfig](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [JSON Schema Store - tsconfig](https://json.schemastore.org/tsconfig)
