# @oksai/tsconfig 包移动说明

> 日期：2026-03-07
> 变更：从 `libs/shared/tsconfig` 移动到 `libs/tsconfig`

## 变更内容

将 TypeScript 配置共享包从 `libs/shared/tsconfig` 移动到 `libs/tsconfig`，以简化目录结构。

## 影响范围

### 1. 目录结构变更

**变更前**：

```
libs/shared/tsconfig/
├── package.json
├── base.json
└── ...
```

**变更后**：

```
libs/tsconfig/
├── package.json
├── base.json
└── ...
```

### 2. 包名不变

包名仍然是 `@oksai/tsconfig`，因此：

✅ **无需修改引用**：

- `package.json` 中的依赖引用保持不变：`"@oksai/tsconfig": "workspace:*"`
- `tsconfig.json` 中的 extends 保持不变：`"extends": "@oksai/tsconfig/node-library.json"`

### 3. 文档更新

已更新以下文档中的路径引用：

- ✅ `AGENTS.md`
- ✅ `docs/guides/tsconfig-migration-guide.md`
- ✅ `docs/guides/NOVU_ALIGNMENT_SUMMARY.md`
- ✅ `scripts/add-tsconfig-deps.sh`

## 验证步骤

### 1. 重新安装依赖

```bash
pnpm install
```

### 2. 验证类型检查

```bash
cd libs/shared/logger
pnpm typecheck
```

### 3. 验证构建

```bash
cd libs/shared/logger
pnpm build
```

## 验证结果

✅ **验证通过**：

- pnpm install 成功
- 类型检查通过
- 构建成功

## 好处

1. ✅ **简化路径**：从 `libs/shared/tsconfig` 简化为 `libs/tsconfig`
2. ✅ **易于访问**：配置包在 libs 根目录，更容易找到
3. ✅ **与 Novu 对齐**：Novu 的 tsconfig 也在 libs 根目录（`libs/maily-tsconfig`）
4. ✅ **无破坏性变更**：包名不变，所有引用无需修改

## 参考文档

- 配置包使用：`libs/tsconfig/README.md`
- 迁移指南：`docs/guides/tsconfig-migration-guide.md`
- 对齐总结：`docs/guides/NOVU_ALIGNMENT_SUMMARY.md`
