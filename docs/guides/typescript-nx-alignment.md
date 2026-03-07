# TypeScript 和 Nx 配置对齐说明

> 日期：2026-03-07
> 参考：Novu 项目的最佳实践

## 一、对齐背景

### 为什么要对齐

本项目（oksai.cc）的 TypeScript 和 Nx 配置需要优化，以提高：

1. **构建性能**：更快的增量构建和缓存利用
2. **类型安全**：更严格的类型检查，减少运行时错误
3. **开发体验**：更好的 IDE 支持和智能提示
4. **代码质量**：统一的配置规范，减少配置错误

### 参考对象

[Novu](https://github.com/novuhq/novu) 是一个成功的开源项目，使用类似的技术栈（Nx + TypeScript + NestJS），其配置经过实战验证。

## 二、主要改进

### 2.1 TypeScript 配置优化

#### 根配置 (`tsconfig.base.json`)

**改进内容**：

- ✅ 添加 `noUnusedParameters: true` - 检查未使用的参数
- ✅ 添加 `strictBindCallApply: true` - 严格的 bind/call/apply
- ✅ 添加 `strictFunctionTypes: true` - 严格的函数类型检查
- ✅ 添加 `strictNullChecks: true` - 严格的空值检查
- ✅ 添加 `strictPropertyInitialization: true` - 严格的属性初始化检查
- ✅ 添加 `forceConsistentCasingInFileNames: true` - 强制文件名大小写一致
- ✅ 修正 `lib` 为 `["ES2022"]`（大写）

**影响**：

- 🎯 更严格的类型检查，提前发现潜在 bug
- 🎯 更一致的代码风格
- ⚠️ 可能暴露一些隐藏的类型问题（需要修复）

### 2.2 Nx 配置优化

#### `nx.json` 改进

**新增 targetDefaults**：

```json
{
  "build": {
    "dependsOn": ["^build"],
    "inputs": ["production", "^production"],
    "cache": true,
    "outputs": ["{projectRoot}/dist", "{projectRoot}/.tsbuildinfo"]
  },
  "test": {
    "dependsOn": ["^build"],
    "inputs": ["default", "^production"],
    "cache": true
  },
  "lint": {
    "inputs": ["default", "{workspaceRoot}/biome.json"],
    "cache": true
  },
  "typecheck": {
    "dependsOn": ["^build"],
    "inputs": ["default", "^production"],
    "cache": true
  }
}
```

**好处**：

- ✅ **自动依赖管理**：`dependsOn: ["^build"]` 自动处理项目依赖顺序
- ✅ **缓存优化**：`inputs` 指定缓存键，`cache: true` 启用缓存
- ✅ **构建输出**：`outputs` 指定构建产物位置，支持增量构建
- ✅ **生产环境优化**：`production` input 排除测试文件，加速 CI

**新增 sharedGlobals**：

```json
{
  "sharedGlobals": [{ "runtime": "node --version" }]
}
```

**好处**：

- ✅ Node.js 版本变化时自动失效缓存

**其他改进**：

- ✅ 添加 `defaultBase: "main"` - 默认基准分支
- ✅ 更新 TypeScript 插件配置，使用 `tsconfig.build.json`

### 2.3 配置模板创建

创建了 `docs/templates/tsconfig-templates.md`，包含：

#### 应用配置模板

- ✅ NestJS 应用模板（CommonJS + 装饰器）
- ✅ TanStack Start 应用模板（ESNext + Bundler）

#### 库配置模板

- ✅ tsc 构建的库模板（Node16 + composite 策略）
- ✅ tsup 构建的库模板（多格式输出）

#### 最佳实践

- ✅ import type 使用规则
- ✅ 项目引用配置
- ✅ 构建命令标准
- ✅ 常见问题诊断

### 2.4 文档更新

#### AGENTS.md 更新

**新增内容**：

- ✅ 配置策略概览（5.0 节）
- ✅ 分层配置原则图示
- ✅ 关键配置说明表
- ✅ Nx 构建优化说明

## 三、配置策略对比

### 与 Novu 的对比

| 特性              | oksai.cc           | Novu            | 说明               |
| ----------------- | ------------------ | --------------- | ------------------ |
| 根配置严格度      | strict: true       | 宽松            | ✅ oksai.cc 更现代 |
| composite 策略    | 开发启用，构建禁用 | 部分启用        | ✅ 避免缓存问题    |
| 装饰器配置        | 全局启用           | 全局启用        | ✅ 一致            |
| 模块系统          | Node16/ESNext      | CommonJS/ESNext | ✅ oksai.cc 更现代 |
| import type       | 严格限制           | 无限制          | ✅ oksai.cc 更安全 |
| Nx targetDefaults | 完整配置           | 基础配置        | ✅ oksai.cc 更完善 |
| 项目引用          | 完整支持           | 部分支持        | ✅ oksai.cc 更好   |

**总结**：

- ✅ oksai.cc 的配置比 Novu 更现代、更严格
- ✅ 保留了 Novu 的最佳实践
- ✅ 增加了额外的类型安全保障

## 四、迁移影响

### 4.1 需要修复的问题

由于启用了更严格的类型检查，可能会暴露一些问题：

1. **未使用的参数**

```typescript
// ❌ 会报错
function example(value: string, unused: number) {}

// ✅ 修复方法 1：使用下划线前缀
function example(value: string, _unused: number) {}

// ✅ 修复方法 2：移除未使用的参数
function example(value: string) {}
```

2. **未初始化的类属性**

```typescript
// ❌ 会报错
class Example {
  private value: string; // 严格模式下需要初始化
}

// ✅ 修复方法 1：添加默认值
class Example {
  private value: string = '';
}

// ✅ 修复方法 2：使用 definite assignment assertion
class Example {
  private value!: string; // 告诉 TypeScript 会在其他地方初始化
}

// ✅ 修复方法 3：使用可选属性
class Example {
  private value?: string;
}
```

3. **文件名大小写不一致**

```bash
# 错误示例
文件系统: user.Service.ts
导入路径: "./user.service.ts"

# 修复：统一使用小写 + 点分隔
user.service.ts
```

### 4.2 验证步骤

执行以下命令验证配置：

```bash
# 1. 清理旧构建产物
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx reset

# 2. 重新构建所有项目
pnpm build

# 3. 运行类型检查
pnpm nx run-many -t typecheck --all

# 4. 运行测试
pnpm test

# 5. 运行 lint
pnpm lint

# 6. 启动开发服务器
pnpm dev
```

### 4.3 可能遇到的问题

#### 问题 1: 类型错误增多

**原因**：启用了更严格的类型检查

**解决**：

```bash
# 查看所有类型错误
pnpm nx run-many -t typecheck --all

# 逐个修复，或者临时在 tsconfig.json 中添加例外
{
  "compilerOptions": {
    "strictNullChecks": false  // 临时禁用，后续逐步修复
  }
}
```

#### 问题 2: 构建缓存问题

**原因**：composite 配置变化导致缓存失效

**解决**：

```bash
# 清理所有缓存
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

#### 问题 3: Nx 构建顺序问题

**原因**：targetDefaults 配置变化

**解决**：

```bash
# 使用 --skip-nx-cache 强制重新构建
pnpm nx run-many -t build --all --skip-nx-cache
```

## 五、后续行动

### 5.1 立即执行

- [ ] 验证构建：`pnpm build`
- [ ] 运行测试：`pnpm test`
- [ ] 启动开发：`pnpm dev`
- [ ] 修复类型错误（如有）

### 5.2 短期优化（1-2 周）

- [ ] 为所有库添加 `tsconfig.build.json`（如果没有）
- [ ] 统一库的构建配置（tsc/tsup 选择）
- [ ] 添加项目引用到所有项目
- [ ] 修复所有 strict 模式下的类型错误

### 5.3 长期改进（1-2 月）

- [ ] 启用 `noUncheckedIndexedAccess` - 更安全的索引访问
- [ ] 启用 `exactOptionalPropertyTypes` - 更严格的可选属性
- [ ] 配置 Nx Cloud（如果需要）
- [ ] 持续监控构建性能

## 六、文档链接

- [配置模板文档](../templates/tsconfig-templates.md)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Nx 官方文档](https://nx.dev/)
- [Novu GitHub](https://github.com/novuhq/novu)

## 七、总结

本次对齐参考 Novu 的最佳实践，对 oksai.cc 的 TypeScript 和 Nx 配置进行了全面优化：

✅ **保持优势**：

- 保留了项目已有的严格类型检查
- 保留了 composite 策略（开发启用，构建禁用）
- 保留了完整的路径映射

✅ **借鉴经验**：

- 学习了 Novu 的分层配置策略
- 学习了 Novu 的 Nx targetDefaults 配置
- 学习了 Novu 的项目引用最佳实践

✅ **优化改进**：

- 启用了更多严格类型检查选项
- 完善了 Nx 构建缓存配置
- 创建了完整的配置模板和文档
- 统一了配置规范

**预期效果**：

- 🎯 更快的构建速度（缓存优化）
- 🎯 更好的类型安全（严格模式）
- 🎯 更好的开发体验（项目引用）
- 🎯 更少的配置错误（统一模板）
