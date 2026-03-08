---
description: 管理 Spec 优先开发流程。用于创建新功能 spec、同步已实现功能文档、继续开发或生成文档。当用户说"创建 spec"、"新建 spec"、"同步 spec"、"继续开发"、"生成文档"时使用。
argument-hint: '[action] <feature-name> [--template] [--status]'
---

# Spec 命令

管理 Spec 优先开发流程的命令行工具。

## 上下文

- **当前分支:** !`git branch --show-current`
- **Specs 目录:** !`ls -d specs/*/ 2>/dev/null | head -10 || echo "暂无 specs"`

## 用户指令

$ARGUMENTS

**重要：** 如果用户提供了具体指令，优先遵循用户指令而非默认行为。

## 命令操作

| 操作       | 说明                                       | 示例                                 |
| ---------- | ------------------------------------------ | ------------------------------------ |
| `new`      | 创建新的功能 spec                          | `/spec new user-profile`             |
| `sync`     | 同步已实现功能到 spec 文档（包括填充模板） | `/spec sync nestjs-better-auth`      |
| `continue` | 继续开发某功能（读取 implementation.md）   | `/spec continue user-profile`        |
| `docs`     | 生成带截图的文档                           | `/spec docs user-profile`            |
| `status`   | 查看功能实现状态                           | `/spec status user-profile`          |
| `list`     | 列出所有 spec 及其状态                     | `/spec list`                         |
| `fill`     | 手动填充模板文档                           | `/spec fill user-profile testing.md` |

## 解析参数

从 `$ARGUMENTS` 中解析：

1. **action**: 第一个参数，可选值为 `new`、`sync`、`continue`、`docs`、`status`、`list`
2. **feature-name**: 第二个参数，功能名称
3. **选项**:
   - `--template`: 使用特定模板
   - `--status`: 设置初始状态

如果未提供 action，根据上下文推断：

- 提到"创建"、"新建"、"开始" → `new`
- 提到"同步"、"更新文档"、"补全" → `sync`
- 提到"继续"、"恢复"、"继续开发" → `continue`
- 提到"文档"、"截图"、"生成文档" → `docs`
- 提到"状态"、"进度" → `status`
- 其他 → `list`

---

## 操作详情

### 1. new - 创建新功能 Spec

**流程：**

1. **检查 specs 目录是否存在**，不存在则创建
2. **检查功能是否已存在**：`specs/{feature-name}/design.md`
3. **复制模板**：

   ```bash
   cp -r specs/_templates specs/{feature-name}
   ```

   模板包含以下核心文件：
   - `design.md` - 技术设计（Source of Truth）
   - `testing.md` - 测试计划（测试金字塔、覆盖率目标）
   - `workflow.md` - 开发流程（用户故事→BDD→TDD）
   - `implementation.md` - 实现进度跟踪
   - `decisions.md` - 架构决策记录
   - `prompts.md` - 常用提示词

4. **更新 AGENTS.md**：将 `{功能名称}` 替换为实际名称
5. **引导用户填写 design.md**：
   - 询问功能描述
   - 询问要解决的问题
   - 询问用户故事
6. **初始化 implementation.md**：
   - 状态设为 `未开始`
   - 填写下一步计划
7. **提示用户规划测试和流程**：
   - 填写 `testing.md` 确定测试策略
   - 参考 `workflow.md` 了解开发流程

**输出示例：**

```
[spec] 创建新功能 spec: user-profile
[spec] 目录已创建: specs/user-profile/
[spec] 模板文件已复制:
  - design.md (技术设计)
  - testing.md (测试计划)
  - workflow.md (开发流程)
  - implementation.md (进度跟踪)
  - decisions.md (决策记录)
[spec] 请描述该功能要实现什么？
```

---

### 2. sync - 同步已实现功能

**流程：**

1. **检查功能目录**：`specs/{feature-name}/`
2. **如果目录不存在**，基于代码创建：
   - 扫描相关代码目录
   - 分析实现内容
   - 创建 spec 文档
   - **填充模板文档为实际内容**
3. **如果目录存在**，更新：
   - 读取现有 design.md
   - 扫描代码变更
   - 更新 implementation.md 的已完成项
   - 记录新的决策到 decisions.md
   - **检查并更新模板文档**：
     - 如果 `testing.md` 还是模板 → 填充实际测试计划
     - 如果 `workflow.md` 还是模板 → 填充实际开发流程
     - 如果 `prompts.md` 还是模板 → 填充常用提示词
     - 如果 `future-work.md` 还是模板 → 填充后续工作

**代码分析要点：**

- 目录结构和文件列表
- 导出的公共 API
- 类/函数的 TSDoc 注释
- 依赖关系
- 测试文件和测试覆盖率
- 代码中的 TODO/FIXME 注释

**模板检查规则：**

- 如果文档包含 `{功能名称}`、`{feature}` 等占位符 → 识别为模板
- 如果 `implementation.md` 状态不是"未开始" → 功能已开始开发，应该填充模板
- 如果存在测试文件（`*.spec.ts`） → 应该填充 `testing.md`
- 如果存在已实现的代码 → 应该填充 `workflow.md` 和 `prompts.md`

**自动填充策略：**

1. **testing.md**：
   - 扫描所有测试文件
   - 提取测试用例和覆盖率
   - 生成测试计划表格
   - 填充测试策略和 Mock 策略

2. **workflow.md**：
   - 分析 `implementation.md` 的 TDD 循环进度
   - 提取用户故事和 BDD 场景
   - 生成完整的工作流程文档

3. **prompts.md**：
   - 分析常用开发模式
   - 提取测试模式、BDD 模式、代码审查模式
   - 生成可复用的提示词

4. **future-work.md**：
   - 扫描代码中的 TODO/FIXME
   - 分析技术债
   - 识别可选优化项
   - 生成后续工作计划

**输出示例：**

```
[spec] 同步功能: nestjs-better-auth
[spec] 分析代码: libs/auth/nestjs-better-auth/src/
[spec] 发现 8 个源文件
[spec] 检测到模板文档需要填充:
  - testing.md (模板)
  - workflow.md (模板)
[spec] 自动填充模板文档...
[spec] 更新 implementation.md:
  - [x] auth-module.ts
  - [x] auth-guard.ts
  - [x] decorators.ts
  ...
[spec] 更新 testing.md:
  - 单元测试: 45 个
  - 覆盖率: 92%
[spec] 更新 workflow.md:
  - TDD 循环: 5 个组件
  - BDD 场景: 8 个
[spec] 同步完成
```

**验证规则：**

sync 操作完成后，验证：

- [ ] 所有模板文档已填充实际内容（不包含 `{功能名称}` 等占位符）
- [ ] `testing.md` 的测试覆盖率与实际测试一致
- [ ] `workflow.md` 的 TDD 循环进度与 `implementation.md` 一致
- [ ] `prompts.md` 的提示词与实际代码模式匹配
- [ ] `future-work.md` 的技术债与代码中的 TODO/FIXME 一致

**如果验证失败，提示用户：**

```
[spec] ⚠️  检测到模板文档未填充：
  - testing.md 仍然是模板
  - workflow.md 仍然是模板

[spec] 是否自动填充这些文档？(y/n)
```

---

### 3. continue - 继续开发

**流程：**

1. **读取** `specs/{feature-name}/implementation.md`
2. **显示当前状态**：
   - 已完成项
   - 进行中项
   - 阻塞项
   - 下一步
3. **读取会话备注**，了解上下文
4. **询问用户**是否继续下一步

**输出示例：**

```
[spec] 继续开发: user-profile
[spec] 状态: 进行中
[spec]
[spec] 已完成:
  - 用户资料数据模型
  - API 路由设计
[spec]
[spec] 进行中:
  - 前端组件开发
[spec]
[spec] 下一步:
  1. 完成用户资料表单组件
  2. 添加头像上传功能
[spec]
[spec] 是否继续下一步？(y/n)
```

---

### 4. docs - 生成文档

**流程：**

1. **检查功能是否可访问**（需要运行中的应用）
2. **打开浏览器**到功能页面
3. **采集截图**：
   - 关键 UI 状态
   - 不同屏幕尺寸（可选）
   - 错误状态（可选）
4. **保存截图**到 `specs/{feature}/docs/screenshots/`
5. **创建/更新** `specs/{feature}/docs/README.md`

**文档结构：**

```markdown
# {功能名称} 文档

## 功能概览

{截图: 概览}

## 使用方式

### 步骤 1: {操作}

{截图: 步骤 1}

### 步骤 2: {操作}

{截图: 步骤 2}

## 配置选项

## 常见用例
```

**输出示例：**

```
[spec] 生成文档: user-profile
[spec] 启动应用...
[spec] 打开浏览器: http://localhost:3000/profile
[spec] 采集截图:
  - profile-overview.png
  - profile-edit.png
  - profile-avatar.png
[spec] 文档已生成: specs/user-profile/docs/README.md
```

---

### 5. status - 查看状态

**流程：**

1. **读取** `specs/{feature-name}/implementation.md`
2. **显示**：
   - 当前状态
   - 完成进度（已完成/总数）
   - 阻塞项（如有）
   - 最近更新（从 git log 或会话备注）

**输出示例：**

```
[spec] 状态: user-profile
[spec]
[spec] 当前状态: 进行中
[spec] 完成进度: 5/8 (62%)
[spec]
[spec] 已完成:
  ✅ 用户资料数据模型
  ✅ API 路由设计
  ✅ 前端组件开发
  ✅ 表单验证
  ✅ 单元测试
[spec]
[spec] 进行中:
  🔄 集成测试
[spec]
[spec] 待开始:
  ⬜ E2E 测试
  ⬜ 文档编写
```

---

### 6. list - 列出所有 Spec

**流程：**

1. **扫描** `specs/` 目录
2. **过滤**出功能目录（排除 `_templates`）
3. **读取每个** `implementation.md` 的状态
4. **检查模板文档**是否已填充
5. **表格输出**

**输出示例：**

```
[spec] 所有功能 spec:
[spec]
| 功能 | 状态 | 完成度 | 模板状态 | 最后更新 |
|------|------|--------|---------|----------|
| nestjs-better-auth | ✅ 已完成 | 100% | ✅ 已填充 | 2024-03-02 |
| user-profile | 🔄 进行中 | 62% | ⚠️ 部分模板 | 2024-03-01 |
| payment-integration | ⬜ 未开始 | 0% | ❌ 未填充 | - |
```

**模板状态说明：**

- ✅ **已填充**：所有模板文档已转换为实际内容
- ⚠️ **部分模板**：部分文档仍是模板（如 testing.md 已填充，但 workflow.md 仍是模板）
- ❌ **未填充**：所有文档都是模板

---

### 7. fill - 手动填充模板文档

**用途**：手动触发模板文档填充（通常在 `/spec sync` 未自动填充时使用）

**语法**：

```bash
/spec fill <feature-name> [document-name]
```

**参数**：

- `feature-name`：功能名称（必需）
- `document-name`：文档名称（可选）
  - 不指定：填充所有模板文档
  - 指定 `testing.md`：只填充测试计划
  - 指定 `workflow.md`：只填充开发流程
  - 指定 `prompts.md`：只填充提示词
  - 指定 `future-work.md`：只填充后续工作

**流程：**

1. **检查功能目录**：`specs/{feature-name}/`
2. **识别模板文档**：
   - 检查文档是否包含 `{功能名称}` 等占位符
   - 检查文档是否为标准模板格式
3. **扫描相关代码**：
   - 测试文件（用于填充 testing.md）
   - 源代码（用于填充 workflow.md、prompts.md）
   - TODO/FIXME 注释（用于填充 future-work.md）
4. **填充文档内容**：
   - 替换占位符为实际内容
   - 添加实际数据（测试覆盖率、TDD 循环等）
   - 生成结构化表格
5. **验证填充结果**：
   - 检查是否还有占位符
   - 检查数据一致性

**输出示例：**

```
[spec] 填充模板: user-profile
[spec] 检测到模板文档:
  - testing.md (模板)
  - workflow.md (模板)
  - prompts.md (模板)
[spec] 扫描代码...
[spec] 发现 45 个测试文件
[spec] 发现 12 个源文件
[spec] 发现 5 个 TODO 注释
[spec]
[spec] 填充 testing.md:
  - 测试策略: 单元 70%, 集成 20%, E2E 10%
  - 单元测试: 45 个
  - 覆盖率: 92%
  - Mock 策略: 已生成
[spec]
[spec] 填充 workflow.md:
  - 用户故事: 3 个
  - BDD 场景: 8 个
  - TDD 循环: 5 个组件
[spec]
[spec] 填充 prompts.md:
  - 开发流程提示词: 5 个
  - 测试相关提示词: 6 个
  - 代码审查提示词: 2 个
[spec]
[spec] 填充 future-work.md:
  - 增强项: 3 个
  - 技术债: 2 个
  - 可选优化: 1 个
[spec]
[spec] ✅ 所有模板文档已填充
```

**使用场景：**

1. **场景 1：部分文档未自动填充**

   ```
   [spec] ⚠️  检测到部分模板文档未填充
   [spec] 运行: /spec fill user-profile
   ```

2. **场景 2：只想填充特定文档**

   ```
   [spec] 只想更新测试计划
   [spec] 运行: /spec fill user-profile testing.md
   ```

3. **场景 3：重新生成某个文档**
   ```
   [spec] 测试覆盖率有变化，需要更新 testing.md
   [spec] 运行: /spec fill user-profile testing.md
   ```

---

| nestjs-better-auth | ✅ 已完成 | 100% | 2024-03-02 |
| user-profile | 🔄 进行中 | 62% | 2024-03-01 |
| payment-integration | ⬜ 未开始 | 0% | - |

````

---

---

## 模板使用指南

### testing.md - 测试计划

**用途：** 规划测试策略和覆盖率目标

**何时填写：** 开始编写测试前

**关键内容：**

- 测试策略（测试金字塔：单元 70% / 集成 20% / E2E 10%）
- 各层测试用例规划
- BDD 场景定义
- Mock 策略
- 测试覆盖率目标

**示例：**

```markdown
## 单元测试（70%）

| 组件 | 测试文件                 | 测试用例             | 状态 |
| :--- | :----------------------- | :------------------- | :--: |
| User | `user.aggregate.spec.ts` | 创建、验证、业务规则 |  ⏳  |
````

### workflow.md - 开发工作流程

**用途：** 定义从需求到实现的完整流程

**何时参考：** 开始开发前

**关键流程：**

1. **用户故事** → 业务需求（作为...我想要...以便于...）
2. **BDD 场景** → 验收标准（Given-When-Then）
3. **TDD 循环** → 测试驱动开发（Red-Green-Refactor）
4. **代码实现** → 领域代码 + 基础设施

**推荐工作流程：**

```bash
# 1. 编写用户故事
# 在 design.md 中使用 "作为...我想要...以便于..." 格式

# 2. 编写 BDD 场景
# 创建 features/{feature}.feature 文件

# 3. TDD 循环
pnpm vitest watch  # 启动测试监听
# 🔴 Red: 编写失败的测试
# 🟢 Green: 编写最简实现
# 🔵 Refactor: 优化代码

# 4. 验证覆盖率
pnpm vitest run --coverage
```

---

## 模板文件说明

创建新 spec 时会复制以下模板文件：

| 模板文件            | 用途         | 使用时机       | 必填 |
| ------------------- | ------------ | -------------- | ---- |
| `AGENTS.md`         | AI 助手指南  | 创建时自动生成 | ✅   |
| `design.md`         | 技术设计文档 | 开始实现前     | ✅   |
| `implementation.md` | 实现进度跟踪 | 每次开发会话   | ✅   |
| `decisions.md`      | 架构决策记录 | 做技术决策时   | ⭕   |
| `prompts.md`        | 常用提示词   | 发现新模式时   | ⭕   |
| `testing.md`        | 测试计划     | 编写测试前     | ✅   |
| `workflow.md`       | 开发工作流程 | 开始开发前     | ✅   |
| `future-work.md`    | 后续工作     | 功能完成后     | ⭕   |

### testing.md 包含内容

- 测试策略（测试金字塔：单元 70%、集成 20%、E2E 10%）
- 测试用例表格
- BDD 场景规划
- 覆盖率目标
- Mock 策略
- 测试命令

### workflow.md 包含内容

- 用户故事模板和示例
- BDD 场景编写指南（Given-When-Then）
- TDD 循环流程（Red-Green-Refactor）
- DDD 分层实现指南
- 代码 Review 检查清单

---

## 模板变量

创建新 spec 时，替换以下模板变量：

| 变量                     | 替换为                 |
| ------------------------ | ---------------------- |
| `{功能名称}`             | 用户提供的功能名称     |
| `{feature}`              | 功能名称（kebab-case） |
| `{component}`            | 相关组件名称           |
| `{relevant directories}` | 相关代码目录           |

---

## Spec 文件结构

```
specs/{feature-name}/
├── AGENTS.md           # AI 助手指南
├── design.md           # 技术设计（Source of truth）
├── implementation.md   # 实现进度跟踪
├── decisions.md        # 架构决策记录（ADR）
├── prompts.md          # 常用提示词
├── testing.md          # 测试计划（测试金字塔 + 覆盖率目标）
├── workflow.md         # 开发工作流程（用户故事 → BDD → TDD）
├── future-work.md      # 后续工作
└── docs/
    ├── README.md       # 带截图的文档
    └── screenshots/    # 截图目录
```

### 核心文件说明

| 文件                | 用途                         | 更新时机     |
| ------------------- | ---------------------------- | ------------ |
| `design.md`         | 技术设计文档，所有实现的原点 | 开始实现前   |
| `implementation.md` | 实现进度跟踪                 | 每次开发会话 |
| `testing.md`        | 测试计划和覆盖率目标         | 编写测试前   |
| `workflow.md`       | 开发流程（用户故事→BDD→TDD） | 开始开发前   |
| `decisions.md`      | 架构决策记录（ADR）          | 做技术决策时 |
| `prompts.md`        | 常用 AI 提示词               | 发现新模式时 |

---

## implementation.md 状态值

| 状态     | 说明               |
| -------- | ------------------ |
| `未开始` | 功能尚未开始实现   |
| `进行中` | 正在实现中         |
| `已完成` | 功能实现完成       |
| `已暂停` | 临时暂停，有阻塞项 |
| `已废弃` | 不再计划实现       |

---

## 自动触发条件

**何时应该将模板转换为实际内容？**

满足以下**任一条件**时，应该自动填充模板文档：

### 触发条件 1: 功能已开始开发

```markdown
- `implementation.md` 状态不是"未开始"
- 存在已完成或进行中的任务
```

### 触发条件 2: 存在测试文件

```markdown
- 存在任何 `*.spec.ts` 文件
- 存在任何 `*.int-spec.ts` 文件（集成测试）
- 存在任何 `*.e2e-spec.ts` 文件（E2E 测试）
```

### 触发条件 3: 存在已实现的源代码

```markdown
- 存在对应的领域模型文件（如 `*.aggregate.ts`）
- 存在对应的服务文件（如 `*.service.ts`）
- 存在对应的控制器文件（如 `*.controller.ts`）
```

### 触发条件 4: Phase 1 完成

```markdown
- 领域层实现完成（聚合根、值对象）
- 基础设施层实现完成（中间件、守卫、过滤器）
- 单元测试覆盖率 > 80%
```

### 触发条件 5: Phase 2 完成

```markdown
- 应用层实现完成（Service、Handler）
- 接口层实现完成（Controller、DTO）
- 集成测试通过
```

---

## 填充顺序和依赖关系

```
1. testing.md
   ↓ 依赖（需要测试数据）

2. workflow.md
   ↓ 依赖（需要开发流程数据）

3. prompts.md
   ↓ 依赖（需要常用模式数据）

4. future-work.md
   ↓ 依赖（需要代码分析数据）

5. docs/README.md
   ↓ 依赖（需要所有其他文档）

6. 提升为公开文档（可选）
```

---

## 模板文档填充详细指南

### testing.md 填充指南

**何时填充**：存在任何测试文件时

**数据来源**：

1. **测试文件扫描**：

   ```bash
   # 扫描所有测试文件
   find . -name "*.spec.ts" -o -name "*.int-spec.ts" -o -name "*.e2e-spec.ts"

   # 提取测试用例描述
   grep -r "it\|describe" **/*.spec.ts
   ```

2. **覆盖率报告**：

   ```bash
   # 生成覆盖率
   pnpm vitest run --coverage

   # 读取 coverage/coverage-summary.json
   ```

3. **测试模式分析**：
   - AAA 模式（Arrange-Act-Assert）
   - Given-When-Then 模式
   - Fixture 工厂模式

**填充内容**：

- [ ] 测试策略（测试金字塔比例）
- [ ] 各层测试用例表格
- [ ] BDD 场景规划
- [ ] 覆盖率目标和实际数据
- [ ] Mock 策略
- [ ] 测试命令

---

### workflow.md 填充指南

**何时填充**：功能开发进入 Phase 1 时

**数据来源**：

1. **implementation.md 分析**：
   - 读取 TDD 循环进度表
   - 提取已完成、进行中、待完成的任务
   - 识别测试覆盖率

2. **design.md 分析**：
   - 提取用户故事
   - 提取 BDD 场景
   - 识别业务规则

3. **代码分析**：
   - 扫描领域层实现
   - 扫描应用层实现
   - 扫描基础设施层实现

**填充内容**：

- [ ] 用户故事（主故事 + 相关故事）
- [ ] BDD 场景（Given-When-Then）
- [ ] TDD 循环进度（Red-Green-Refactor）
- [ ] 代码实现示例
- [ ] 完整工作流程示例
- [ ] 开发检查清单

---

### prompts.md 填充指南

**何时填充**：发现重复的开发模式时

**数据来源**：

1. **常用任务识别**：
   - 创建实体
   - 编写测试
   - 实现 Handler
   - 代码审查

2. **提示词模板提取**：
   - 开发流程提示词
   - 测试相关提示词
   - BDD 相关提示词
   - 代码审查提示词

3. **检查清单提取**：
   - 工作流程完成度
   - 发布前检查

**填充内容**：

- [ ] 开发流程提示词
- [ ] 测试相关提示词
- [ ] BDD 相关提示词
- [ ] 代码审查提示词
- [ ] 文档相关提示词
- [ ] 检查清单

---

### future-work.md 填充指南

**何时填充**：Phase 1 或 Phase 2 完成时

**数据来源**：

1. **代码扫描**：

   ```bash
   # 扫描 TODO 注释
   grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts"

   # 扫描未实现的接口
   grep -r "throw new Error.*Not implemented"
   ```

2. **implementation.md 分析**：
   - 识别阻塞项
   - 识别待完成任务

3. **design.md 分析**：
   - 识别"范围外"的功能
   - 识别延期决策

**填充内容**：

- [ ] 增强项（优先级、工作量估算）
- [ ] 技术债（影响、解决方案）
- [ ] 可选优化（收益、工作量）
- [ ] 讨论记录（延期/采纳/待定）

---

## 最佳实践

1. **开始新功能前**：先用 `/spec new` 创建 spec
2. **实现前规划**：
   - 填写 `design.md` 明确设计
   - 阅读 `workflow.md` 了解开发流程
   - 规划 `testing.md` 测试策略
3. **实现过程中**：定期更新 `implementation.md`
4. **做技术决策时**：记录到 `decisions.md`
5. **编写测试时**：参考 `testing.md` 的测试计划
6. **功能开发后**：用 `/spec sync` 同步并填充模板文档
7. **功能完成后**：用 `/spec docs` 生成文档
8. **新会话开始时**：用 `/spec continue` 恢复上下文

### 推荐工作流

```
1. /spec new <feature>          # 创建 spec
2. 填写 design.md               # 明确设计
3. 阅读 workflow.md             # 了解流程
4. 规划 testing.md              # 制定测试计划
5. 开始 TDD 开发                # Red-Green-Refactor
6. 更新 implementation.md       # 记录进度
7. /spec sync <feature>         # 同步并填充模板
8. /spec docs <feature>         # 生成文档
```

---

## 测试覆盖要求

每个功能 spec 应包含完整的测试计划（`testing.md`）：

### 测试金字塔

```
      /\
     /E2E\      10% - 关键业务流程
    /------\
   / 集成  \    20% - 组件协作
  /----------\
 /   单元测试  \ 70% - 领域逻辑
/--------------\
```

### 覆盖率目标

- 领域层：> 90%
- 应用层：> 85%
- 总体：> 80%

### 测试文件命名规范

```
{entity}.aggregate.spec.ts       # 聚合根测试
{value-object}.vo.spec.ts        # 值对象测试
{command}.handler.spec.ts        # 命令处理器测试
{repository}.repository.int-spec.ts  # Repository 集成测试
{feature}.e2e-spec.ts            # E2E 测试
```

---

## 自定义模板

可以自定义 `specs/_templates/` 中的模板文件以适应项目需求：

### 添加新模板文件

1. 创建 `specs/_templates/{new-template}.md`
2. 在本命令文档中添加说明
3. 更新 `AGENTS.md` 模板以引用新文件

### 修改现有模板

编辑 `specs/_templates/` 中的文件，更改会应用到所有新创建的 spec。

---

## 错误处理

| 错误            | 处理方式                  |
| --------------- | ------------------------- |
| Spec 目录不存在 | 提示使用 `/spec new` 创建 |
| 功能名称未提供  | 提示用户输入功能名称      |
| design.md 为空  | 引导用户填写设计内容      |
| 无法访问应用    | 提示先启动应用再生成文档  |

---

## 示例会话

### 示例 1: 创建新功能

```
用户: /spec new user-profile

[spec] 创建新功能 spec: user-profile
[spec] 目录已创建: specs/user-profile/
[spec]
[spec] 请描述该功能要实现什么？
用户: 用户可以查看和编辑自己的个人资料，包括头像、昵称、个人简介

[spec] 已更新 design.md
[spec]
[spec] 接下来请描述：
[spec] 1. 这个功能解决什么问题？
[spec] 2. 有哪些用户故事？
[spec] 3. 技术设计要点？
```

### 示例 2: 同步已实现功能

```
用户: /spec sync nestjs-better-auth

[spec] 同步功能: nestjs-better-auth
[spec] 分析代码: libs/auth/nestjs-better-auth/src/
[spec]
[spec] 发现模块:
  - AuthModule (动态模块)
  - AuthGuard (全局守卫)
  - AuthService (认证服务)
  - 装饰器: @AllowAnonymous, @OptionalAuth, @Roles, @OrgRoles, @Session
  - 钩子系统: @Hook, @BeforeHook, @AfterHook
[spec]
[spec] 更新 implementation.md...
[spec] 生成 decisions.md (4 个 ADR)...
[spec] 同步完成
```

### 示例 3: 继续开发

```
用户: /spec continue user-profile

[spec] 继续开发: user-profile
[spec]
[spec] 📋 状态: 进行中
[spec]
[spec] ✅ 已完成:
  - 用户资料数据模型
  - API 路由设计
[spec]
[spec] 🔄 进行中:
  - 前端组件开发
[spec]
[spec] 📝 下一步:
  1. 完成用户资料表单组件
  2. 添加头像上传功能
[spec]
[spec] 是否继续第 1 步？(y/n)
用户: y

[spec] 开始: 完成用户资料表单组件
[spec] 请先阅读 specs/user-profile/design.md 了解设计要求
```
