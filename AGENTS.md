---
description: oksai.cc 项目宪章
globs:
alwaysApply: true
---
<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# 一、General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## 二、核心原则

### 2.1 Spec 优先开发

`monorepo`下的`specs`目录包含正在开发功能的设计文档。AI 助手（OpenCode）应当读取这些文档来理解要构建的内容并跟踪进度。

**工作方式**：

1. **在实现功能前**，先创建包含设计文档的 spec 文件夹
2. **AI 助手先读设计**，再编写代码
3. **进度记录**在 `implementation.md`，用于会话连续性
4. **决策记录**在 `decisions.md`，用于后续参考
5. 功能完成后会**生成带截图的文档**

**开始新功能**：

```bash
cp -r specs/_templates specs/{feature-name}
```

然后告诉 AI 助手：
```
"I want to build {feature}. Here's my idea: [description].
Review the codebase and fill in specs/{feature}/design.md"
```

**文件结构**：

每个功能包含：

| 文件/目录 | 用途 |
|-----------|------|
| `AGENTS.md` | AI 助手在处理该功能时的说明 |
| `design.md` | 事实来源（Source of truth）——做什么、怎么做 |
| `implementation.md` | 进度跟踪——已完成、进行中、阻塞项 |
| `decisions.md` | 架构决策记录（ADR） |
| `prompts.md` | 常见任务可复用提示词 |
| `future-work.md` | 延后实现的想法与增强项 |
| `docs/` | 含截图的内部文档 |
| `docs/screenshots/` | 开发过程中采集的截图 |

**会话连续性**：

开始新的 AI 助手会话时：
```
"Continue working on {feature}"
```

AI 助手会读取 `implementation.md`，从上次中断处继续。

**生成文档**：

当功能准备好写文档时：
```
"Generate docs with screenshots for {feature}"
```

AI 助手会：
1. 在浏览器中打开该功能
2. 对关键 UI 状态截图
3. 保存到 `specs/{feature}/docs/screenshots/`
4. 更新 `specs/{feature}/docs/README.md`

**具体阅读`specs/README.md`**

### 2.2 中文优先原则

- 所有代码注释、技术文档、错误消息、日志输出及用户界面文案**必须使用中文**
- Git 提交信息**必须使用英文描述**
- 代码变量命名**保持英文**，但必须配有中文注释说明业务语义

| 内容类型 | 语言要求 |
|:---|:---|
| 代码注释 | **必须使用中文** |
| 技术文档 | **必须使用中文** |
| 错误消息 | **必须使用中文** |
| 日志输出 | **必须使用中文** |
| 用户界面文案 | **必须使用中文** |
| Git 提交信息 | **必须使用英文** |
| 代码变量命名 | **保持英文**，但必须配有中文注释说明业务语义 |

**理由**：统一中文语境提升团队沟通效率，确保业务认知一致，降低知识传递成本。

### 2.3 代码即文档原则

- 公共 API、类、方法、接口、枚举**必须编写完整 TSDoc 注释**
- TSDoc 必须覆盖：功能描述、业务规则、使用场景、前置条件、后置条件、异常抛出及注意事项
- 代码变更时**必须同步更新注释**，保持实现与文档一致

**理由**：通过高质量注释让代码自身成为权威业务文档，缩短交接时间并减少额外文档维护负担。