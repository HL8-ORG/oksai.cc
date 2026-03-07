# 前端模版上下文地图

基于 Jiang & Nam (2025) 的开发者上下文五分类法，快速定位前端开发所需信息。

---

## 🗺️ 快速导航

### 按开发阶段查找

| 阶段           | 需要阅读的文件            | 关键章节             |
| :------------- | :------------------------ | :------------------- |
| **开始新功能** | README.md → design.md     | 用户故事、UI/UX 设计 |
| **开始开发**   | workflow.md → AGENTS.md   | 开发流程、代码模式   |
| **编写测试**   | testing.md                | 组件测试、E2E 测试   |
| **遇到问题**   | prompts.md → decisions.md | 常见问题、技术决策   |
| **后续优化**   | future-work.md            | 增强项、技术债       |

### 按任务类型查找

| 任务类型     | 主要参考                 | 辅助参考                    |
| :----------- | :----------------------- | :-------------------------- |
| **创建页面** | workflow.md "组件开发"   | design.md "路由设计"        |
| **创建表单** | design.md "表单处理"     | workflow.md "Step 5"        |
| **API 集成** | design.md "API 集成"     | prompts.md "创建 API Hook"  |
| **状态管理** | design.md "状态管理"     | decisions.md "状态管理方案" |
| **编写测试** | testing.md               | workflow.md "测试验证"      |
| **优化性能** | design.md "性能优化"     | future-work.md "性能优化"   |
| **可访问性** | design.md "可访问性设计" | testing.md "可访问性测试"   |

---

## 📋 五分类内容地图

### 1️⃣ 约定（Conventions）

**定义**：编码风格、命名模式、格式规则

| 约定类型     | 位置         | 关键内容                                  |
| :----------- | :----------- | :---------------------------------------- |
| **代码模式** | AGENTS.md    | 组件测试模式、API Hook 模式、表单处理模式 |
| **命名规范** | design.md    | 路由命名、组件命名、Hook 命名             |
| **文件组织** | workflow.md  | 目录结构、文件命名                        |
| **样式约定** | decisions.md | Tailwind CSS 使用规范                     |

**快速查找**：

```bash
# 查找命名约定
grep -n "命名" design.md workflow.md

# 查找代码模式
grep -n "模式" AGENTS.md

# 查找样式约定
grep -n "Tailwind\|样式" decisions.md
```

---

### 2️⃣ 指南（Guidelines）

**定义**：决策启发式、工作流模式

| 指南类型     | 位置                     | 关键内容                           |
| :----------- | :----------------------- | :--------------------------------- |
| **开发流程** | workflow.md              | 用户故事 → UI/UX → 组件开发 → 测试 |
| **决策标准** | decisions.md             | 组件库选择、状态管理方案、表单方案 |
| **测试策略** | testing.md               | 测试金字塔、覆盖率目标             |
| **性能优化** | design.md "性能优化"     | 代码分割、虚拟滚动、图片优化       |
| **可访问性** | design.md "可访问性设计" | WCAG 2.1 AA 标准                   |

**关键决策点**：

- **组件库**：使用 Shadcn/ui（详见 decisions.md ADR-002）
- **状态管理**：TanStack Query + Zustand（详见 decisions.md ADR-003）
- **表单处理**：React Hook Form + Zod（详见 design.md "表单处理"）
- **测试框架**：Vitest + Testing Library + Playwright（详见 testing.md）

---

### 3️⃣ 项目信息（Project Information）

**定义**：架构、依赖、领域知识

| 信息类型     | 位置                 | 关键内容                               |
| :----------- | :------------------- | :------------------------------------- |
| **技术栈**   | AGENTS.md "技术栈"   | React 18+、TanStack 生态、Tailwind CSS |
| **架构设计** | design.md "技术设计" | 路由设计、组件设计、API 集成           |
| **依赖关系** | design.md "依赖关系" | 内部依赖、外部依赖、设计依赖           |
| **领域知识** | 各功能 design.md     | 功能特定的业务逻辑                     |

**技术栈概览**：

```
核心框架：
  - React 18+
  - TanStack Start（全栈框架）

TanStack 生态：
  - @tanstack/react-router（路由）
  - @tanstack/react-query（状态管理）
  - @tanstack/react-table（表格，可选）

表单处理：
  - react-hook-form（表单状态）
  - zod（验证）

样式：
  - Tailwind CSS（样式）

测试：
  - Vitest（测试框架）
  - @testing-library/react（组件测试）
  - Playwright（E2E 测试）
```

---

### 4️⃣ LLM 指令（LLM Directives）

**定义**：行为指令、输出格式要求

| 指令类型     | 位置                     | 关键内容                                   |
| :----------- | :----------------------- | :----------------------------------------- |
| **行为约束** | AGENTS.md "不要做"       | 不添加额外功能、不跳过测试、不使用内联样式 |
| **工作流程** | AGENTS.md "开发工作流程" | 遵循 workflow.md 标准流程                  |
| **代码规范** | AGENTS.md "代码模式"     | 使用指定的测试模式、Hook 模式              |
| **质量标准** | AGENTS.md "测试策略"     | 组件测试 >80%、E2E 100% 关键流程           |
| **响应格式** | prompts.md               | 各种场景的提示词模板                       |

**关键约束**：

```
✅ 必须做：
  - 阅读设计文档再开始开发
  - 遵循工作流程（用户故事 → UI/UX → 组件开发 → 测试）
  - 编写组件测试和 E2E 测试
  - 处理加载和错误状态
  - 遵循可访问性标准

❌ 禁止做：
  - 添加 design.md 之外的功能
  - 跳过可访问性检查
  - 使用内联样式（除非动态计算）
  - 忽略加载和错误状态
  - 使用 testid 查询（优先使用 accessible queries）
```

---

### 5️⃣ 示例（Examples）

**定义**：标准代码样例、输入输出示范

| 示例类型     | 位置                           | 关键内容                   |
| :----------- | :----------------------------- | :------------------------- |
| **完整流程** | workflow.md "完整工作流程示例" | 用户管理功能的完整实现     |
| **组件测试** | AGENTS.md、testing.md          | 组件测试模式示例           |
| **API Hook** | AGENTS.md、design.md           | TanStack Query 使用示例    |
| **表单处理** | AGENTS.md、design.md           | React Hook Form + Zod 示例 |
| **E2E 测试** | testing.md                     | Playwright 测试示例        |

**示例索引**：

#### 组件开发示例

```typescript
// 1. 创建路由（workflow.md Step 1）
export const Route = createFileRoute('/users')({
  component: UsersPage,
});

// 2. 实现页面组件（workflow.md Step 2）
export function UsersPage() {
  return (
    <div>
      <PageHeader title="用户管理" />
      <UserList />
    </div>
  );
}

// 3. 实现业务组件（workflow.md Step 3）
export function UserList() {
  const { data, isLoading } = useUsers();
  if (isLoading) return <Loading />;
  return <ListView data={data} />;
}
```

#### API Hook 示例

```typescript
// 查询 Hook（AGENTS.md "API Hook 模式"）
export function use{Resource}(id: string) {
  return useQuery({
    queryKey: ['{resource}', id],
    queryFn: () => apiClient.get{Resource}(id),
    enabled: !!id,
  });
}

// 变更 Hook（AGENTS.md "API Hook 模式"）
export function use{Action}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.{action},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{resource}'] });
    },
  });
}
```

#### 组件测试示例

```typescript
// AGENTS.md "组件测试模式"
describe('{Component}', () => {
  it('should render correctly', () => {
    render(<{Component} {...defaultProps} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should handle user click', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<{Component} onAction={onAction} />);
    await user.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

---

## 🔍 场景化查找

### 场景 1：开始开发新功能

**阅读顺序**：

1. **README.md**（5 分钟）：了解模版结构和使用方式
2. **design.md**（15 分钟）：阅读用户故事、UI/UX 设计、技术设计
3. **workflow.md**（10 分钟）：了解开发流程
4. **AGENTS.md**（5 分钟）：了解代码模式和约束

**总阅读时间**：约 35 分钟

### 场景 2：实现表单功能

**阅读顺序**：

1. **design.md "表单处理"**：了解表单处理模式
2. **AGENTS.md "表单处理模式"**：查看代码示例
3. **testing.md "表单测试"**：了解测试策略
4. **prompts.md "创建表单组件"**：获取提示词

**总阅读时间**：约 15 分钟

### 场景 3：集成后端 API

**阅读顺序**：

1. **design.md "API 集成"**：了解 API 集成策略
2. **AGENTS.md "API Hook 模式"**：查看代码示例
3. **decisions.md "状态管理方案"**：了解决策背景
4. **prompts.md "创建 API Hook"**：获取提示词

**总阅读时间**：约 15 分钟

### 场景 4：编写测试

**阅读顺序**：

1. **testing.md "组件测试"**：了解测试策略
2. **AGENTS.md "组件测试模式"**：查看代码示例
3. **testing.md "E2E 测试"**：了解 E2E 测试策略
4. **prompts.md "生成组件测试"**：获取提示词

**总阅读时间**：约 20 分钟

### 场景 5：遇到技术问题

**阅读顺序**：

1. **prompts.md "常见问题"**：查找类似问题
2. **decisions.md**：查找相关技术决策
3. **future-work.md "技术债"**：查看已知问题
4. **使用提示词**：`prompts.md` 中的相关提示词

**总阅读时间**：约 10 分钟

---

## 📚 外部资源引用

### 设计系统

- **位置**：`docs/design-system/`
- **内容**：组件库文档、设计规范、样式变量

### TanStack 文档

- **Router**：https://tanstack.com/router/latest
- **Query**：https://tanstack.com/query/latest
- **Table**：https://tanstack.com/table/latest

### 测试文档

- **Testing Library**：https://testing-library.com/docs/react-testing-library/intro/
- **Playwright**：https://playwright.dev/
- **Vitest**：https://vitest.dev/

### 可访问性

- **WCAG 2.1**：https://www.w3.org/WAI/WCAG21/quickref/
- **WAI-ARIA**：https://www.w3.org/WAI/ARIA/apg/

---

## 🎯 快速参考卡片

### 开发前必读（核心文档）

```
✅ README.md         - 模版使用指南
✅ design.md         - 功能设计（用户故事、UI/UX、技术设计）
✅ workflow.md       - 开发工作流程
✅ AGENTS.md         - AI 助手指令（代码模式、约束）
```

### 开发中参考（详细指南）

```
📋 decisions.md      - 技术决策记录
📋 testing.md        - 测试策略和示例
📋 prompts.md        - 提示词库
```

### 开发后文档（可选）

```
📄 docs/README.md    - 用户使用文档
📄 future-work.md    - 后续工作计划
```

---

**使用建议**：

- 🚀 **快速开始**：仅阅读核心文档（约 35 分钟）
- 📖 **深度学习**：阅读全部文档（约 2 小时）
- 🔍 **按需查找**：使用上下文地图快速定位
- 📝 **定期审查**：使用审计清单优化文档质量

**维护提示**：

- 更新内容时，同步更新上下文地图
- 添加新示例时，在示例索引中记录
- 修改技术栈时，更新技术栈概览
- 发现重复内容时，立即合并或引用

---

**参考来源**：Jiang & Nam (2025) - Empirical Study of Developer-Provided Context
