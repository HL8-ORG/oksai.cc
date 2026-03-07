# TypeScript 配置迁移状态

## 迁移进度概览

**已迁移**: 2/20 项目 (10%)
**待迁移**: 18/20 项目 (90%)

## 详细状态

### ✅ 已迁移项目

| 项目                 | 类型         | tsconfig.json | tsconfig.build.json | package.json |
| -------------------- | ------------ | ------------- | ------------------- | ------------ |
| `libs/shared/logger` | node-library | ✅            | ✅                  | ✅           |
| `apps/gateway`       | nestjs       | ✅            | ✅                  | ✅           |

### 🔄 待迁移项目

#### Node.js 库（使用 tsc 构建）

- [ ] `libs/shared/kernel` - 核心库
- [ ] `libs/shared/context` - 上下文库
- [ ] `libs/shared/exceptions` - 异常库
- [ ] `libs/shared/event-store` - 事件存储
- [ ] `libs/shared/repository` - 仓库库
- [ ] `libs/shared/types` - 类型定义
- [ ] `libs/shared/utils` - 工具库
- [ ] `libs/testing` - 测试工具

#### Node.js 库（使用 tsup 构建）

- [ ] `libs/shared/config` - 配置库
- [ ] `libs/shared/constants` - 常量库
- [ ] `libs/database` - 数据库模块
- [ ] `libs/notification/email` - 邮件通知
- [ ] `libs/shared/better-auth-mikro-orm` - Better Auth 适配器
- [ ] `libs/shared/nestjs-better-auth` - NestJS Better Auth
- [ ] `libs/shared/nestjs-utils` - NestJS 工具
- [ ] `libs/shared/cache` - 缓存模块
- [ ] `libs/oauth` - OAuth 模块

#### 应用

- [ ] `apps/web-admin` - TanStack Start 应用

## 迁移方案

### 方案 1：批量自动迁移（推荐）

**使用脚本批量迁移**：

```bash
# 1. 执行批量迁移脚本
./scripts/migrate-all-tsconfig.sh

# 2. 安装依赖
pnpm install

# 3. 验证
pnpm nx run-many -t typecheck --all
pnpm build

# 4. 如有问题，从备份恢复
find . -name "*.bak" -exec sh -c 'mv "$0" "${0%.bak}"' {} \;
```

**优点**：

- ✅ 快速完成所有项目迁移
- ✅ 自动添加依赖
- ✅ 自动更新配置文件
- ✅ 自动创建备份

**缺点**：

- ⚠️ 可能需要手动修复个别项目

### 方案 2：逐个手动迁移

**手动迁移步骤**（以 config 为例）：

1. **添加依赖**

```bash
cd libs/shared/config
jq '.devDependencies["@oksai/tsconfig"] = "workspace:*"' package.json > tmp.json && mv tmp.json package.json
```

2. **更新 tsconfig.json**

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

3. **更新 tsconfig.build.json**（如果存在）

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
  }
}
```

4. **验证**

```bash
cd libs/shared/config
pnpm typecheck
pnpm build
```

**优点**：

- ✅ 精确控制每个项目的迁移
- ✅ 可以逐个验证

**缺点**：

- ⚠️ 耗时较长
- ⚠️ 容易遗漏

## 推荐迁移顺序

### 阶段 1：基础设施库（优先）

1. `libs/shared/kernel` - 核心库（无依赖）
2. `libs/shared/constants` - 常量库（仅依赖 kernel）
3. `libs/shared/context` - 上下文库（依赖 constants）
4. `libs/shared/config` - 配置库（依赖 constants, context）

### 阶段 2：工具库

5. `libs/shared/types` - 类型定义
6. `libs/shared/utils` - 工具库
7. `libs/shared/exceptions` - 异常库
8. `libs/shared/event-store` - 事件存储
9. `libs/shared/repository` - 仓库库
10. `libs/testing` - 测试工具

### 阶段 3：业务模块

11. `libs/database` - 数据库模块
12. `libs/shared/better-auth-mikro-orm` - Better Auth 适配器
13. `libs/shared/nestjs-better-auth` - NestJS Better Auth
14. `libs/shared/nestjs-utils` - NestJS 工具
15. `libs/shared/cache` - 缓存模块
16. `libs/notification/email` - 邮件通知
17. `libs/oauth` - OAuth 模块

### 阶段 4：应用

18. `apps/web-admin` - TanStack Start 应用

## 迁移检查清单

每个项目迁移后需要检查：

- [ ] `package.json` 中添加 `@oksai/tsconfig` 依赖
- [ ] `tsconfig.json` 更新 `extends` 为 `@oksai/tsconfig/*`
- [ ] `tsconfig.build.json` 更新 `extends` 为数组（如果存在）
- [ ] 运行 `pnpm typecheck` 通过
- [ ] 运行 `pnpm build` 通过
- [ ] 运行 `pnpm test` 通过（如果有测试）

## 当前使用的配置

### 检查命令

```bash
# 查看所有使用 @oksai/tsconfig 的项目
grep -r '"extends".*"@oksai/tsconfig' libs apps --include="tsconfig*.json"

# 查看所有使用旧配置的项目
grep -r '"extends".*tsconfig\.base\.json' libs apps --include="tsconfig*.json"
```

### 当前状态

- **@oksai/tsconfig**: 3 个文件（logger x2, gateway x1）
- **tsconfig.base.json**: 27 个文件（其他所有项目）

## 下一步行动

### 立即执行（推荐方案 1）

```bash
# 1. 执行批量迁移
./scripts/migrate-all-tsconfig.sh

# 2. 安装依赖
pnpm install

# 3. 验证所有项目
pnpm nx run-many -t typecheck --all
pnpm build

# 4. 提交更改
git add .
git commit -m "feat: migrate all projects to @oksai/tsconfig"
```

### 或者逐步执行（方案 2）

按照推荐的迁移顺序，逐个手动迁移和验证。

## 预期收益

迁移完成后：

1. ✅ **配置简化**: 每个项目减少 10-40 行配置
2. ✅ **统一管理**: 修改 `@oksai/tsconfig` 即可影响所有项目
3. ✅ **类型安全**: 完整的 JSON Schema 支持
4. ✅ **与 Novu 对齐**: 便于引入 Novu 模块

## 参考文档

- 迁移指南: `docs/guides/tsconfig-migration-guide.md`
- 配置包 README: `libs/tsconfig/README.md`
- 批量迁移脚本: `scripts/migrate-all-tsconfig.sh`
