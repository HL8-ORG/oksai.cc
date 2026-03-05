# Spec 命令文档更新总结

## 更新日期

2026-03-06

## 更新内容

### 1. 新增模板文件说明

在 `.opencode/commands/spec.md` 中添加了新增模板的完整说明：

#### testing.md 模板

- **用途**: 测试计划和覆盖率目标
- **使用时机**: 编写测试前
- **包含内容**:
  - 测试策略（测试金字塔）
  - 单元测试/集成测试/E2E 测试规划
  - BDD 场景
  - 覆盖率目标
  - Mock 策略
  - 测试命令

#### workflow.md 模板

- **用途**: 开发工作流程指南
- **使用时机**: 开始开发前
- **包含内容**:
  - 用户故事编写规范
  - BDD 场景编写指南（Given-When-Then）
  - TDD 循环流程（Red-Green-Refactor）
  - DDD 分层实现指南
  - 代码 Review 检查清单

### 2. 更新的章节

#### 2.1 Spec 文件结构

添加了 `testing.md` 和 `workflow.md` 到文件结构说明，并添加了核心文件说明表格：

```markdown
| 文件 | 用途 | 更新时机 |
|------|------|----------|
| `design.md` | 技术设计文档 | 开始实现前 |
| `testing.md` | 测试计划和覆盖率目标 | 编写测试前 |
| `workflow.md` | 开发流程（用户故事→BDD→TDD） | 开始开发前 |
```

#### 2.2 模板使用指南

新增完整的模板使用指南章节，包括：

- 如何使用 testing.md
- 如何使用 workflow.md
- 完整的开发流程

#### 2.3 模板文件说明

新增模板文件说明表格，清晰展示每个模板的用途和使用时机：

```markdown
| 模板文件 | 用途 | 使用时机 | 必填 |
|---------|------|---------|------|
| `testing.md` | 测试计划 | 编写测试前 | ✅ |
| `workflow.md` | 开发工作流程 | 开始开发前 | ✅ |
```

#### 2.4 最佳实践

更新了最佳实践部分，强调：

1. **实现前规划**：填写 design.md、阅读 workflow.md、规划 testing.md
2. **推荐工作流**：完整的 7 步开发流程
3. **TDD 开发**：强调 Red-Green-Refactor 循环

#### 2.5 测试覆盖要求

新增测试覆盖要求章节，包括：

- 测试金字塔（单元 70%、集成 20%、E2E 10%）
- 覆盖率目标
- 测试文件命名规范

#### 2.6 自定义模板

新增自定义模板章节，说明如何：

- 添加新模板文件
- 修改现有模板

### 3. 更新后的工作流程

```
1. /spec new <feature>          # 创建 spec
2. 填写 design.md               # 明确设计
3. 阅读 workflow.md             # 了解流程
4. 规划 testing.md              # 制定测试计划
5. 开始 TDD 开发                # Red-Green-Refactor
6. 更新 implementation.md       # 记录进度
7. /spec docs <feature>         # 生成文档
```

## 影响范围

### 受影响的文件

- `.opencode/commands/spec.md` - 主要更新文件
- `specs/_templates/testing.md` - 已存在，文档已补充说明
- `specs/_templates/workflow.md` - 已存在，文档已补充说明

### 向后兼容性

- ✅ 向后兼容，不影响现有 spec
- ✅ 现有 spec 不会自动获得新模板文件
- ✅ 需要手动复制新模板到现有 spec（如需要）

## 使用建议

### 对于新功能

1. 使用 `/spec new <feature>` 创建 spec
2. 自动获得 testing.md 和 workflow.md 模板
3. 按照推荐工作流程开发

### 对于现有功能

如需补充测试计划和工作流程：

```bash
# 手动复制模板
cp specs/_templates/testing.md specs/{existing-feature}/
cp specs/_templates/workflow.md specs/{existing-feature}/

# 根据实际情况填写内容
```

## 后续工作

### 建议优化

1. 考虑添加 `/spec add-testing <feature>` 命令
2. 考虑添加 `/spec add-workflow <feature>` 命令
3. 为现有 spec 批量补充模板

### 文档维护

1. 当模板文件更新时，同步更新命令文档
2. 收集用户反馈，优化模板内容
3. 添加更多示例和最佳实践

## 验证

### 验证清单

- [x] testing.md 模板已存在
- [x] workflow.md 模板已存在
- [x] 命令文档已更新
- [x] 文件结构说明已更新
- [x] 最佳实践已更新
- [x] 使用指南已添加
- [x] 文档格式正确

### 测试验证

```bash
# 创建新 spec 验证模板复制
cd /home/arligle/oks/oksai.cc
ls specs/_templates/
# 应该看到 testing.md 和 workflow.md
```

## 总结

本次更新确保了 `.opencode/commands/spec.md` 与 `specs/_templates/` 模板的一致性，完整地反映了新增的 `testing.md` 和 `workflow.md` 模板，为开发者提供了清晰的测试计划和工作流程指南。
