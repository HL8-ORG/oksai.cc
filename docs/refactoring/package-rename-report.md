# 包名重命名报告

**日期**: 2026-03-09  
**操作**: 移除冗余的 `iam/` 前缀  
**状态**: ✅ 完成

## 一、重命名原因

### 问题

- `@oksai/iam/better-auth-mikro-orm` - 包名冗余
- `@oksai/iam/nestjs-better-auth` - 包名冗余

### 原因分析

1. **语义冗余**: `better-auth` 和 `nestjs-better-auth` 本身已明确表达用途
2. **路径冗余**: `iam/` 前缀在包名中重复了目录结构
3. **使用不便**: 长包名降低开发体验

### 解决方案

去掉 `iam/` 前缀，保留在 `libs/iam/` 目录下，但使用顶级包名。

## 二、重命名详情

### 2.1 包名变更

| 旧包名                             | 新包名                         | 目录位置                          |
| ---------------------------------- | ------------------------------ | --------------------------------- |
| `@oksai/iam/better-auth-mikro-orm` | `@oksai/better-auth-mikro-orm` | `libs/iam/better-auth-mikro-orm/` |
| `@oksai/iam/nestjs-better-auth`    | `@oksai/nestjs-better-auth`    | `libs/iam/nestjs-better-auth/`    |

### 2.2 目录结构（不变）

```
libs/iam/                           # 目录容器
├── domain/                         # @oksai/iam-domain
├── infrastructure/                 # @oksai/iam-infrastructure
├── better-auth-mikro-orm/         # @oksai/better-auth-mikro-orm (重命名)
└── nestjs-better-auth/            # @oksai/nestjs-better-auth (重命名)
```

### 2.3 更新的文件

#### package.json 文件

1. ✅ `libs/iam/better-auth-mikro-orm/package.json`
2. ✅ `libs/iam/nestjs-better-auth/package.json`
3. ✅ `apps/gateway/package.json`

#### TypeScript 源文件

1. ✅ `apps/gateway/src/auth/**/*.ts` (9个文件)
2. ✅ `apps/gateway/src/tenant/**/*.ts` (2个文件)
3. ✅ `apps/gateway/src/*.ts` (1个文件)
4. ✅ `libs/iam/better-auth-mikro-orm/**/*.ts` (包内注释和示例)

#### Import 路径变更示例

**之前**:

```typescript
import { BetterAuthApiClient } from '@oksai/iam/nestjs-better-auth';
import { mikroOrmAdapter } from '@oksai/iam/better-auth-mikro-orm';
```

**之后**:

```typescript
import { BetterAuthApiClient } from '@oksai/nestjs-better-auth';
import { mikroOrmAdapter } from '@oksai/better-auth-mikro-orm';
```

## 三、验证结果

### 3.1 构建测试

| 包名                           | 构建状态 | 构建时间 |
| ------------------------------ | -------- | -------- |
| `@oksai/better-auth-mikro-orm` | ✅ 成功  | <1s      |
| `@oksai/nestjs-better-auth`    | ✅ 成功  | ~8s      |
| `@oksai/gateway`               | ✅ 成功  | ~15s     |

### 3.2 依赖关系

```mermaid
graph TD
    A[apps/gateway] --> B[@oksai/better-auth-mikro-orm]
    A --> C[@oksai/nestjs-better-auth]
    A --> D[@oksai/iam-domain]
    A --> E[@oksai/iam-infrastructure]
    A --> F[@oksai/database]
```

### 3.3 缓存清理

执行了以下清理操作以确保构建成功：

```bash
rm -rf apps/gateway/dist
rm -rf apps/gateway/node_modules/.cache
rm -rf .nx/cache
pnpm install
```

## 四、影响范围

### 4.1 受影响的包

| 包                             | 影响类型        | 文件数量              |
| ------------------------------ | --------------- | --------------------- |
| apps/gateway                   | Import 路径更新 | 12 个 TypeScript 文件 |
| libs/iam/better-auth-mikro-orm | 包名 + 注释更新 | 5 个文件              |
| libs/iam/nestjs-better-auth    | 包名更新        | 1 个文件              |

### 4.2 不受影响的包

以下包保持不变：

- ✅ `@oksai/iam-domain`
- ✅ `@oksai/iam-infrastructure`
- ✅ `@oksai/database`
- ✅ 其他所有 shared 包

### 4.3 破坏性变更

**这是破坏性变更**，所有依赖这两个包的项目需要更新 import 路径：

```bash
# 自动更新命令
find . -name "*.ts" -exec \
  sed -i 's/@oksai\/iam\/nestjs-better-auth/@oksai\/nestjs-better-auth/g' {} \;

find . -name "*.ts" -exec \
  sed -i 's/@oksai\/iam\/better-auth-mikro-orm/@oksai\/better-auth-mikro-orm/g' {} \;
```

## 五、后续工作

### 5.1 已完成

- ✅ 包名重命名
- ✅ package.json 更新
- ✅ TypeScript import 路径更新
- ✅ 构建验证
- ✅ 缓存清理

### 5.2 待完成

- ⏳ 运行单元测试验证
- ⏳ 运行 E2E 测试验证
- ⏳ 启动开发服务器验证
- ⏳ 更新文档（如果有其他项目引用）

### 5.3 建议

1. **立即执行**: 运行完整测试套件

   ```bash
   pnpm test
   ```

2. **短期执行**: 启动开发服务器验证运行时

   ```bash
   pnpm dev
   ```

3. **中期执行**: 更新项目文档，通知团队成员

## 六、总结

### 6.1 成果

- ✅ 包名简洁明了，提升开发体验
- ✅ 保持了目录结构的逻辑性
- ✅ 所有包构建成功
- ✅ 无类型错误
- ✅ 依赖关系正确

### 6.2 改进

- 包名长度减少 4-5 个字符
- 更符合包命名最佳实践
- 与其他 `@oksai/*` 包保持一致

### 6.3 风险

- ⚠️ 破坏性变更，需要更新所有依赖项目的 import 路径
- ✅ 已通过自动化命令完成更新
- ✅ 已通过构建验证

---

**重命名结论**: ✅ 成功完成，包名更简洁，构建验证通过，可继续后续工作。
