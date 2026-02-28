# Nx TypeScript 代码仓库

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ 这是一个展示 [Nx](https://nx.dev) TypeScript monorepo 核心功能的代码仓库 ✨

## 完成 Nx 平台配置

🚀 [完成工作空间配置](https://cloud.nx.app/connect/na5hFAaVxR) 以获得更快的构建速度，支持远程缓存、分布式任务执行和自愈 CI。[了解更多关于 Nx Cloud](https://nx.dev/ci/intro/why-nx-cloud)。

## 📦 项目概述

本仓库展示了一个生产就绪的 TypeScript monorepo，包含：

- **3 个可发布包** - 可直接发布到 NPM

  - `@org/strings` - 字符串处理工具库
  - `@org/async` - 异步工具函数，支持重试逻辑
  - `@org/colors` - 颜色转换和处理工具库

- **1 个内部库**
  - `@org/utils` - 共享工具库（私有，不发布）

## 🚀 快速开始

```bash
# 克隆仓库
git clone <your-fork-url>
cd typescript-template

# 安装依赖
npm install

# 构建所有包
npx nx run-many -t build

# 运行测试
npx nx run-many -t test

# 检查所有项目
npx nx run-many -t lint

# 并行执行所有任务
npx nx run-many -t lint test build --parallel=3

# 可视化项目依赖图
npx nx graph
```

## ⭐ Nx 核心功能

本仓库展示了 Nx 的多项强大功能：

### 1. 🔒 模块边界

使用标签强制执行架构约束。每个包都有特定的依赖规则：

- `scope:shared` (utils) - 可被所有包使用
- `scope:strings` - 只能依赖共享工具库
- `scope:async` - 只能依赖共享工具库
- `scope:colors` - 只能依赖共享工具库

**试试看：**

```bash
# 查看当前项目图和边界
npx nx graph

# 查看特定项目的详细信息
npx nx show project strings --web
```

[了解更多关于模块边界 →](https://nx.dev/features/enforce-module-boundaries)

### 2. 🛠️ 自定义运行命令

包可以定义标准 build/test/lint 之外的自定义命令：

```bash
# 运行 strings 包的自定义 build-base 命令
npx nx run strings:build-base

# 查看项目的所有可用目标
npx nx show project strings
```

[了解更多关于自定义运行命令 →](https://nx.dev/concepts/executors-and-configurations)

### 3. 🔧 自愈 CI

CI 流水线包含 `nx fix-ci`，可自动识别并建议修复常见问题。你可以修改 `async-retry.spec.ts` 使其失败并创建 PR 来测试此功能。

```bash
# 运行测试并查看失败
npx nx test async

# 在 CI 中，此命令提供自动修复
npx nx fix-ci
```

[了解更多关于自愈 CI →](https://nx.dev/ci/features/self-healing-ci)

### 4. 📦 包发布

使用 Nx Release 管理版本和发布：

```bash
# 预览将要发布的内容
npx nx release --dry-run

# 版本更新并发布包
npx nx release

# 只发布特定包
npx nx release publish --projects=strings,colors
```

[了解更多关于 Nx Release →](https://nx.dev/features/manage-releases)

## 📁 项目结构

```
├── packages/
│   ├── strings/     [scope:strings] - 字符串工具库（可发布）
│   ├── async/       [scope:async]   - 异步工具库（可发布）
│   ├── colors/      [scope:colors]  - 颜色工具库（可发布）
│   └── utils/       [scope:shared]  - 共享工具库（私有）
├── nx.json          - Nx 配置
├── tsconfig.json    - TypeScript 配置
└── eslint.config.mjs - ESLint 模块边界规则
```

## 🏷️ 理解标签

本仓库使用标签来强制执行模块边界：

| 包名           | 标签            | 可导入自       |
| -------------- | --------------- | -------------- |
| `@org/utils`   | `scope:shared`  | 无（基础库）   |
| `@org/strings` | `scope:strings` | `scope:shared` |
| `@org/async`   | `scope:async`   | `scope:shared` |
| `@org/colors`  | `scope:colors`  | `scope:shared` |

ESLint 配置强制执行这些边界，防止循环依赖并保持清晰的架构。

## 🧪 测试模块边界

查看模块边界强制执行的实际效果：

1. 尝试在 `@org/strings` 中导入 `@org/colors`
2. 运行 `npx nx lint strings`
3. 你将看到违反模块边界的错误

## 📚 常用命令

```bash
# 项目探索
npx nx graph                                    # 交互式依赖图
npx nx list                                     # 列出已安装的插件
npx nx show project strings --web              # 查看项目详情

# 开发
npx nx build strings                           # 构建特定包
npx nx test async                              # 测试特定包
npx nx lint colors                             # 检查特定包

# 运行多个任务
npx nx run-many -t build                       # 构建所有项目
npx nx run-many -t test --parallel=3          # 并行测试
npx nx run-many -t lint test build            # 运行多个目标

# Affected 命令（适用于 CI）
npx nx affected -t build                       # 只构建受影响的项目
npx nx affected -t test                        # 只测试受影响的项目

# 发布管理
npx nx release --dry-run                       # 预览发布变更
npx nx release                                 # 创建新版本
```

## Nx Cloud

Nx Cloud 确保[快速且可扩展的 CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) 流水线。它包含以下功能：

- [远程缓存](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [跨多机任务分发](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [自动化 e2e 测试分割](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [任务不稳定性检测和重试](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🔗 了解更多

- [Nx 文档](https://nx.dev)
- [模块边界](https://nx.dev/features/enforce-module-boundaries)
- [自定义命令](https://nx.dev/concepts/executors-and-configurations)
- [自愈 CI](https://nx.dev/ci/features/self-healing-ci)
- [发布包](https://nx.dev/features/manage-releases)
- [Nx Cloud](https://nx.dev/ci/intro/why-nx-cloud)

## 💬 社区

加入 Nx 社区：

- [Discord](https://go.nx.dev/community)
- [X (Twitter)](https://twitter.com/nxdevtools)
- [LinkedIn](https://www.linkedin.com/company/nrwl)
- [YouTube](https://www.youtube.com/@nxdevtools)
- [博客](https://nx.dev/blog)
