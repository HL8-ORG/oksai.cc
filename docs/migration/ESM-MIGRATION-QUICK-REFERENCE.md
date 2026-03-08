# ESM 迁移快速参考

## 📍 当前进度

**Phase 0**: ✅ 完成  
**Phase 1**: ⏳ 准备就绪  
**分支**: `feat/esm-migration`

## 🎯 已完成

### 配置改造

- ✅ 创建 `libs/tsconfig/nestjs-esm.json`
- ✅ 修改 `apps/gateway/package.json` → `"type": "module"`
- ✅ 更新 `tsconfig.json` 和 `tsconfig.build.json`
- ✅ 更新 `nest-cli.json` → `builder: "tsc"`

### 构建验证

- ✅ 所有依赖库构建成功（ESM 格式）
- ✅ Gateway 构建成功（ESM 格式）
- ✅ 输出 `import/export` 语法

### 自动化工具

- ✅ `scripts/esm/add-js-extensions.ts` - 添加 .js 后缀
- ✅ `scripts/esm/transform-dirname.ts` - 转换 \_\_dirname

## 📊 影响范围

| 项目                | 数量 | 状态            |
| ------------------- | ---- | --------------- |
| TypeScript 文件     | 60   | 需添加 .js 后缀 |
| \_\_dirname 使用    | 1    | 需转换          |
| class-validator DTO | 9    | 待迁移到 Zod    |

## 🚀 立即可执行的命令

### 1. 添加 .js 后缀

```bash
pnpm tsx scripts/esm/add-js-extensions.ts
```

### 2. 转换 \_\_dirname

```bash
pnpm tsx scripts/esm/transform-dirname.ts
```

### 3. 测试构建

```bash
# 清理并重新构建
rm -rf apps/gateway/dist
pnpm nx build @oksai/gateway --skip-nx-cache

# 检查产物
head -20 apps/gateway/dist/main.js
```

### 4. 测试运行

```bash
# 测试开发模式
pnpm dev

# 测试单元测试
pnpm test
```

## 🐛 已知问题

### 1. Import 路径缺少 .js 后缀

**当前状态**: 构建成功（tsconfig-paths 补救）  
**目标状态**: 显式添加 .js 后缀

**解决**: 运行 `pnpm tsx scripts/esm/add-js-extensions.ts`

### 2. tsconfig-paths 依赖

**问题**: ESM 模式下可能不需要  
**状态**: 暂时保留，待测试移除

## 📚 相关文档

- [迁移清单](./esm-migration-checklist.md)
- [NestJS ESM 指南](https://docs.nestjs.com)
- [TypeScript ESM](https://www.typescriptlang.org/docs/handbook/esm-node.html)

## 🔗 下一步

1. **执行自动化脚本**（5分钟）
   - 添加 .js 后缀
   - 转换 \_\_dirname

2. **验证构建和运行**（10分钟）
   - `pnpm build`
   - `pnpm dev`
   - `pnpm test`

3. **提交 Phase 1**（5分钟）
   - `git add .`
   - `git commit -m "feat(esm): add .js extensions and transform __dirname"`

4. **Phase 2: 依赖验证**（下周）
   - MikroORM ESM 兼容性
   - Better Auth ESM 兼容性
   - Passport.js ESM 兼容性

---

**最后更新**: 2026-03-08  
**负责人**: AI Assistant  
**状态**: ✅ Phase 0 完成，等待执行 Phase 1
