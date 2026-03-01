# Spec 优先开发

该目录包含正在开发功能的设计文档。AI 助手（OpenCode）会读取这些文档来理解要构建的内容并跟踪进度。

## 工作方式

1. **在实现功能前**，先创建包含设计文档的 spec 文件夹
2. **AI 助手先读设计**，再编写代码
3. **进度记录**在 `implementation.md`，用于会话连续性
4. **决策记录**在 `decisions.md`，用于后续参考
5. 功能完成后会**生成带截图的文档**

## 开始新功能

```bash
cp -r specs/_templates specs/{feature-name}
```

然后告诉 AI 助手：
```
"I want to build {feature}. Here's my idea: [description].
Review the codebase and fill in specs/{feature}/design.md"
```

## 文件结构

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

## 会话连续性

开始新的 AI 助手会话时：
```
"Continue working on {feature}"
```

AI 助手会读取 `implementation.md`，从上次中断处继续。

## 生成文档

当功能准备好写文档时：
```
"Generate docs with screenshots for {feature}"
```

AI 助手会：
1. 在浏览器中打开该功能
2. 对关键 UI 状态截图
3. 保存到 `specs/{feature}/docs/screenshots/`
4. 更新 `specs/{feature}/docs/README.md`

## 提升为公开文档

当内部文档准备好面向客户时：
```
"Promote {feature} docs to public"
```

AI 助手会：
1. 将内容复制到 `docs/{feature}.mdx`（Mintlify 格式）
2. 将截图移动到 `docs/images/{feature}/`
3. 更新 `docs/mint.json` 导航
4. 调整措辞以适配客户受众

## 最重要的规则

每个 PR 都必须在 10 分钟内可审阅完成：
- 最多改动 5-7 个文件（不含测试）
- 最多改动 500 行
- 每个 PR 只做一个聚焦变更

如果改动更大，请拆分为多个 PR。
