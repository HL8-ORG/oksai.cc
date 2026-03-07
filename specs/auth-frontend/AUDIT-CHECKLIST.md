# 前端模版审计清单

基于上下文工程最佳实践（Jiang & Nam, 2025; Anthropic, 2025），用于审查前端规格文档质量。

---

## 一、单一事实来源审查

### 检查重复内容

| 问题                   | 若是，则                                | 检查文件                  |
| :--------------------- | :-------------------------------------- | :------------------------ |
| 同一技术栈在多处解释？ | 保留最权威位置，其他处引用              | design.md ↔ workflow.md  |
| 相同代码示例出现多次？ | 保留一个标准示例，其他处引用            | workflow.md ↔ testing.md |
| 工具/库用法重复说明？  | 移到 `technicalResources`，仅保留决策点 | design.md ↔ prompts.md   |
| API 集成模式重复？     | 统一在 design.md，其他处引用            | 所有文件                  |

### 具体检查项

- [ ] **TanStack Query 用法**：design.md、workflow.md、prompts.md 中是否重复？
- [ ] **表单处理**：design.md、workflow.md、prompts.md 中是否重复？
- [ ] **测试模式**：testing.md、workflow.md、prompts.md 中是否重复？
- [ ] **组件结构**：design.md、workflow.md 中是否重复？
- [ ] **错误处理**：design.md、testing.md、prompts.md 中是否重复？

### 解决方案

````markdown
# ✅ 正确做法

design.md:

## API 集成

使用 TanStack Query（详见 technicalResources）。
关键决策：查询用 useQuery，变更用 useMutation。

workflow.md:

## Step 3: 创建 API Hook

参考 design.md "API 集成" 章节的模式。

# ❌ 错误做法

design.md:

## API 集成

TanStack Query 是一个强大的数据获取库...

```typescript
const { data } = useQuery({ ... });
```
````

workflow.md:

## Step 3: 创建 API Hook

TanStack Query 是一个强大的数据获取库...

```typescript
const { data } = useQuery({ ... });
```

````

---

## 二、抽象高度审查

### 校准测试

> **核心问题**：这个细节程度，资深前端开发者会需要，还是能自行推断？

| 内容类型 | 判断标准 | 行动 |
|:---|:---|:---|
| **显而易见** | 资深开发者不需要说明 | 删除 |
| **需要提醒** | 资深开发者可能忽略 | 保留简短提示 |
| **需要解释** | 资深开发者需要上下文 | 保留完整说明 |
| **需要示例** | 复杂模式或团队约定 | 保留示例 + 简短说明 |

### 具体检查项

#### 应该删除的内容（显而易见）

- [ ] React 基础概念（如 `useState`、`useEffect` 用法）
- [ ] TypeScript 基础类型定义
- [ ] 基本的 CSS 类名组合
- [ ] 显而易见的步骤（如"创建文件"、"导入组件"）
- [ ] 标准的错误处理（如 `try-catch`）

#### 应该精简的内容（需要提醒）

- [ ] 表单验证基础模式（保留关键决策点）
- [ ] API 错误处理模式（保留策略而非详细步骤）
- [ ] 组件命名规范（保留约定而非解释）
- [ ] 测试 AAA 模式（保留模式名称而非详细说明）

#### 应该保留的内容（需要解释）

- [ ] 项目特定的架构决策
- [ ] 领域特定的业务逻辑
- [ ] 团队约定和最佳实践
- [ ] 复杂交互的设计模式

#### 应该强化的内容（需要示例）

- [ ] 完整的组件实现示例
- [ ] 端到端的用户流程示例
- [ ] 复杂状态管理示例
- [ ] 可访问性实现示例

### 示例对比

```markdown
# ❌ 过于详细（显而易见）
## 表单处理

1. 导入必要的 hooks：
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
````

2. 定义 schema：

```typescript
const schema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
});
```

3. 使用 useForm：

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

4. 在 JSX 中使用：

```typescript
<input {...register('name')} />
{errors.name && <span>{errors.name.message}</span>}
```

# ✅ 合适抽象高度

## 表单处理

使用 React Hook Form + Zod 验证。完整示例参考 `technicalResources`。

关键模式：

- Zod schema 定义表单数据类型
- `useForm` + `zodResolver` 集成
- 错误处理：`errors.fieldName?.message`
- 提交处理：`handleSubmit(onSubmit)`

**团队约定**：

- 表单字段使用 `<FormField>` 组件包装
- 验证错误使用 `<ErrorMessage>` 组件显示

````

---

## 三、示例优于规则审查

### 检查规则是否可以转为示例

| 规则类型 | 是否可以转为示例 | 建议 |
|:---|:---|:---|
| 代码风格规则 | ✅ 可以 | 用代码示例展示 |
| 命名规范 | ✅ 可以 | 用实际命名示例 |
| 组件结构 | ✅ 可以 | 用完整组件示例 |
| 测试模式 | ✅ 可以 | 用实际测试代码 |
| 错误处理 | ⚠️ 部分可以 | 用场景示例 + 简短规则 |

### 具体检查项

- [ ] 是否有 3 段以上文字解释一个概念？→ 改为示例
- [ ] 是否有多个相似规则列表？→ 合并为一个示例
- [ ] 是否有复杂流程用文字描述？→ 改为流程图 + 示例
- [ ] 是否有模式用抽象规则定义？→ 改为代码示例

### 示例对比

```markdown
# ❌ 规则列表（冗长）
## 组件命名规范

1. 页面组件应以 `Page` 结尾，如 `UserListPage`
2. 业务组件应以功能命名，如 `UserList`
3. 通用组件应描述性命名，如 `Button`、`Input`
4. 高阶组件应以 `with` 开头，如 `withAuth`
5. Hook 应以 `use` 开头，如 `useUsers`
6. 工具函数应动词开头，如 `formatDate`

# ✅ 示例优于规则
## 组件命名示例

````

pages/
users/
UsersPage.tsx # 页面组件：{Resource}Page
components/
UserList.tsx # 业务组件：{Entity}{Action}
UserForm.tsx # 业务组件：{Entity}{Action}

components/
ui/
Button.tsx # 通用组件：功能描述
Input.tsx

hooks/
useUsers.ts # Hook：use{Resource}
useCreateUser.ts # Hook：use{Action}

utils/
formatDate.ts # 工具函数：动词 + 名词
validateEmail.ts

```

```

---

## 四、防御性重复审查

### 识别过度强调

| 强调方式                 | 问题       | 建议             |
| :----------------------- | :--------- | :--------------- |
| `MUST` / `NEVER`         | 防御性重复 | 删除，说一次即可 |
| `IMPORTANT` / `CRITICAL` | 过度强调   | 删除，信任模型   |
| 多次重复同一规则         | 不信任模型 | 保留一次即可     |
| 3 次以上 "确保"          | 冗余       | 保留关键处       |

### 具体检查项

- [ ] 检查所有 `MUST`、`NEVER`、`ALWAYS` 关键词
- [ ] 检查是否有重复 3 次以上的规则
- [ ] 检查是否有加粗强调但已说明的内容
- [ ] 检查是否有 "确保" 开头的多个句子

### 示例对比

```markdown
# ❌ 防御性重复

## 不要做

- ❌ **MUST** 不要添加 design.md 之外的功能
- ❌ **NEVER** 跳过可访问性检查
- ❌ **CRITICAL** 不要使用内联样式（除非动态计算）
- ❌ **IMPORTANT** 不要忽略加载和错误状态
- ❌ 确保 Always 使用 Tailwind classes
- ❌ 确保 NEVER 使用 testid 查询

# ✅ 信任模型

## 不要做

- 不要添加 design.md 之外的功能
- 不要跳过可访问性检查
- 优先使用 Tailwind classes，避免内联样式
- 使用 accessible queries（`getByRole`、`getByText`），避免 testid
```

---

## 五、组织结构审查

### 清晰分段

| 检查项   | 标准                 | 问题           |
| :------- | :------------------- | :------------- |
| 章节划分 | 每个章节单一主题     | 主题混杂需拆分 |
| 标题层级 | 最多 3 层（##、###） | 过深需扁平化   |
| 段落长度 | 每段 < 150 词        | 过长需拆分     |
| 列表项   | 每项 < 30 词         | 过长需独立成段 |

### 具体检查项

- [ ] 每个文件是否有清晰的章节结构？
- [ ] 标题层级是否过深（>3 层）？
- [ ] 是否有超长段落（>150 词）？
- [ ] 是否有超长列表项（>30 词）？

---

## 六、开发者上下文分类审查

基于 Jiang & Nam (2025) 五分类法检查内容组织：

### 1. 约定（Conventions）

**位置**：AGENTS.md

- [ ] 代码风格约定
- [ ] 命名规范
- [ ] 格式规则
- [ ] 文件组织约定

### 2. 指南（Guidelines）

**位置**：workflow.md、decisions.md

- [ ] 开发流程指南
- [ ] 决策启发式
- [ ] 最佳实践
- [ ] 工作流模式

### 3. 项目信息（Project Information）

**位置**：design.md、README.md

- [ ] 架构信息
- [ ] 技术栈说明
- [ ] 依赖关系
- [ ] 领域知识

### 4. LLM 指令（LLM Directives）

**位置**：AGENTS.md、prompts.md

- [ ] 行为约束
- [ ] 输出格式要求
- [ ] 决策优先级
- [ ] 错误处理指令

### 5. 示例（Examples）

**位置**：workflow.md、testing.md

- [ ] 代码示例
- [ ] 完整实现示例
- [ ] 测试示例
- [ ] 用户流程示例

---

## 七、审计流程

### Phase 1: 快速扫描（10 分钟）

1. 检查文件总行数（目标 < 2000 行）
2. 识别重复章节标题
3. 标记过长段落和列表

### Phase 2: 内容审查（30 分钟）

1. **单一事实来源**：标记重复内容
2. **抽象高度**：标记显而易见内容
3. **示例优于规则**：标记可转为示例的规则
4. **防御性重复**：标记过度强调

### Phase 3: 优化实施（1-2 小时）

1. 删除显而易见内容
2. 合并重复内容到单一位置
3. 转换规则为示例
4. 精简过度强调

### Phase 4: 验证（10 分钟）

1. 检查是否仍有重复
2. 确认抽象高度合适
3. 验证示例清晰度

---

## 八、常见问题

### Q1: 如何判断内容是否"显而易见"？

**测试**：资深前端开发者看到这个概念，是否会想"这还用说？"

**示例**：

- ❌ 显而易见："React 组件必须有返回值" → 删除
- ✅ 需要说明："团队约定：页面组件必须有 ErrorBoundary" → 保留

### Q2: 示例和规则的平衡点？

**原则**：一个完整示例 > 三段解释文字

**判断**：

- 简单概念：示例 + 1 句话
- 复杂概念：示例 + 关键决策点（2-3 句）
- 团队约定：示例 + 约定说明（1-2 句）

### Q3: 多少重复算是"过度"？

**标准**：

- 2 次：可能需要合并
- 3 次及以上：必须合并到单一位置

**例外**：

- 不同上下文中的简短引用（1 句话）
- 示例中的自然重复（代码示例中）

### Q4: 如何处理跨文件引用？

**原则**：引用而非重复

```markdown
# ✅ 正确引用

详见 design.md "API 集成" 章节。

# ❌ 错误重复

（复制粘贴 design.md 的内容）
```

---

## 九、优化优先级

### 高优先级（立即修复）

1. **删除显而易见内容**（节省最多空间）
2. **合并重复内容**（提高一致性）
3. **精简防御性重复**（提高可读性）

### 中优先级（本周完成）

1. **转换规则为示例**（提高理解度）
2. **优化组织结构**（提高查找效率）
3. **添加上下文地图**（提高导航性）

### 低优先级（后续迭代）

1. **细化五分类组织**（长期优化）
2. **添加更多示例**（丰富资源）
3. **建立示例库**（external resources）

---

## 十、审计报告模板

```markdown
# {文件名} 审计报告

**审计日期**：{YYYY-MM-DD}
**审计人**：{姓名}

## 发现的问题

### 1. 单一事实来源

- [ ] 问题 1：{描述}
- [ ] 问题 2：{描述}

### 2. 抽象高度

- [ ] 问题 1：{描述}
- [ ] 问题 2：{描述}

### 3. 示例优于规则

- [ ] 问题 1：{描述}
- [ ] 问题 2：{描述}

## 优化建议

### 高优先级

1. {建议 1}
2. {建议 2}

### 中优先级

1. {建议 1}
2. {建议 2}

## 优化后统计

- 原始行数：{N} 行
- 优化后行数：{N} 行
- 减少比例：{X}%

## 质量评分

- 单一事实来源：{1-5} 分
- 抽象高度：{1-5} 分
- 示例质量：{1-5} 分
- 组织结构：{1-5} 分
- **总分**：{4-20} 分
```

---

**参考来源**：

- Jiang & Nam (2025) - Empirical Study of Developer-Provided Context
- Anthropic (2025) - Effective Context Engineering for AI Agents
- Mei et al. (2025) - A Survey of Context Engineering for LLMs
