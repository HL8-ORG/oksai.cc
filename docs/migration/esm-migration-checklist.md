# ESM 迁移清单

**分支**: `feat/esm-migration`
**开始日期**: 2026-03-08
**目标**: 全面拥抱 ESM，为 NestJS 12 做好准备

## ✅ Phase 0: 配置改造（已完成）

- [x] 创建迁移分支 `feat/esm-migration`
- [x] 修改 `apps/gateway/package.json` 添加 `"type": "module"`
- [x] 创建 `libs/tsconfig/nestjs-esm.json` ESM 配置
- [x] 修改 `apps/gateway/tsconfig.json` 使用 ESM 配置
- [x] 修改 `apps/gateway/nest-cli.json` 启用 tsc builder

## 🔄 Phase 1: 代码改造（进行中）

### 1.1 Import 语句改造

- [ ] 为所有本地 import 添加 `.js` 后缀
  - [ ] `apps/gateway/src/**/*.ts`
  - [ ] `libs/**/*.ts`
- [ ] 替换 `require()` 为 `import`

### 1.2 CommonJS 特有语法处理

- [ ] 替换 `__dirname` → `import.meta.url`
- [ ] 替换 `__filename` → `import.meta.url`
- [ ] 移除 `module.exports` → `export default`
- [ ] 移除 `require.cache` 相关代码

### 1.3 第三方库适配

- [ ] MikroORM 配置适配
- [ ] Better Auth 配置适配
- [ ] Passport.js 配置适配（可能需要 passport-esm 补丁）

## 🧪 Phase 2: 验证测试

### 2.1 构建验证

```bash
# 清理缓存
pnpm nx reset
find libs apps -name "*.tsbuildinfo" -delete

# 重新构建
pnpm nx build @oksai/gateway
```

**预期错误**:

- Import 路径缺少 `.js` 后缀
- `__dirname` 未定义
- CommonJS 模块导入问题

### 2.2 测试验证

```bash
pnpm nx test @oksai/gateway
```

### 2.3 运行验证

```bash
pnpm dev
```

## 📦 Phase 3: 依赖升级

### 3.1 验证关键依赖 ESM 兼容性

- [x] MikroORM 6.6.8 - ✅ 原生 ESM 支持
- [x] Better Auth 1.5.2 - ✅ 支持 ESM
- [ ] Passport.js - ⚠️ 需要测试
- [ ] class-validator - ⚠️ 迁移到 Zod
- [ ] reflect-metadata - ⚠️ 需要测试
- [ ] tsconfig-paths - ⚠️ 可能需要移除

### 3.2 移除 CommonJS 专用依赖

- [ ] `tsconfig-paths` - ESM 不需要

## 🎯 Phase 4: NestJS 12 升级（待发布）

- [ ] 升级所有 `@nestjs/*` 到 v12
- [ ] 启用 Standard Schema 支持
- [ ] 配置 Vitest + SWC（已有基础）
- [ ] 性能对比测试

## 🐛 已知问题

### 问题 1: Import 路径必须包含后缀

**错误**: `Error: Cannot find module './app.module'`
**解决**: 改为 `import { AppModule } from './app.module.js';`

### 问题 2: \_\_dirname 未定义

**错误**: `ReferenceError: __dirname is not defined`
**解决**:

```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### 问题 3: reflect-metadata 加载顺序

**解决**: 确保 `reflect-metadata` 在所有其他 import 之前加载

```typescript
import 'reflect-metadata';
// 其他 import...
```

## 📊 进度追踪

- **开始**: 2026-03-08
- **Phase 0**: ✅ 完成（2026-03-08）
- **Phase 1**: 🔄 进行中
- **Phase 2**: ⏳ 待开始
- **Phase 3**: ⏳ 待开始
- **Phase 4**: ⏳ 待 NestJS 12 发布

## 🔗 相关文档

- [NestJS ESM 官方文档](https://docs.nestjs.com)
- [TypeScript ESM 指南](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Node.js ESM 规范](https://nodejs.org/api/esm.html)
