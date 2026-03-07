# 前端规格文档模版

专为前端开发设计的规格文档模版，适用于组件化开发、用户体验设计和视觉交互。

## 📋 模版结构

```
specs/_templates-frontend/
├── README.md              # 本文件 - 模版使用指南
├── design.md              # 功能设计文档（用户故事、UI/UX、技术设计）
├── implementation.md      # 实现进度跟踪
├── testing.md             # 测试策略和计划
├── workflow.md            # 开发工作流程
├── decisions.md           # 技术决策记录
├── prompts.md             # AI 助手提示词
├── future-work.md         # 后续工作计划
├── AGENTS.md              # AI 助手指令文件
└── docs/
    ├── README.md          # 用户使用文档模版
    └── screenshots/       # 截图目录
```

## 🎯 与后端模版的区别

### 设计重点不同

| 维度       | 后端模版            | 前端模版            |
| :--------- | :------------------ | :------------------ |
| **架构**   | 领域驱动设计（DDD） | 组件驱动开发（CDD） |
| **关注点** | 业务逻辑、数据模型  | 用户体验、交互设计  |
| **测试**   | 单元测试 + 集成测试 | 组件测试 + E2E 测试 |
| **文档**   | API 文档、技术设计  | 用户文档、交互说明  |

### 关键差异

#### 1. design.md

**后端**：

- 领域层设计（聚合根、实体、值对象）
- 应用层设计（Command、Query、Handler）
- 基础设施层设计（Repository、Adapter）

**前端**：

- 用户流程设计
- UI/UX 设计（Wireframe、交互设计）
- 组件设计（页面组件、业务组件）
- API 集成设计
- 响应式设计
- 可访问性设计

#### 2. testing.md

**后端**：

- 单元测试（70%）：领域层、应用层
- 集成测试（20%）：基础设施层
- E2E 测试（10%）：API 端到端

**前端**：

- 组件测试（60%）：渲染、交互、状态
- E2E 测试（30%）：用户流程
- 视觉测试（10%）：截图对比

#### 3. workflow.md

**后端**：

- 用户故事 → BDD 场景 → TDD 循环 → 代码实现

**前端**：

- 用户故事 → UI/UX 设计 → 组件开发 → 测试验证

## 🚀 使用方式

### 创建新功能

1. **复制模版**：

```bash
# 创建新功能目录
mkdir -p specs/{feature-name}/docs/screenshots

# 复制模版文件
cp specs/_templates-frontend/*.md specs/{feature-name}/
cp specs/_templates-frontend/docs/README.md specs/{feature-name}/docs/
```

2. **填写设计文档**：

编辑 `specs/{feature-name}/design.md`：

- 定义用户故事
- 设计用户流程
- 绘制 Wireframe
- 规划组件结构
- 定义 API 集成方案

3. **开始开发**：

AI 助手会自动：

- 读取设计文档
- 按照工作流程开发
- 更新实现进度
- 生成测试和文档

### 模版文件说明

#### 📄 design.md - 功能设计

**必填部分**：

- [ ] 概述和问题陈述
- [ ] 用户故事（INVEST 原则）
- [ ] 用户流程设计
- [ ] UI/UX 设计（Wireframe、交互）
- [ ] 技术设计（路由、组件、API）
- [ ] 测试策略

**可选部分**：

- 响应式设计详细方案
- 可访问性设计详细方案
- 性能优化方案

#### 📄 implementation.md - 实现进度

**跟踪内容**：

- UI 实现进度（页面、组件）
- API 集成进度
- 测试进度（组件、E2E）
- 响应式适配进度
- 可访问性检查

**使用方式**：

- 在每个开发阶段更新状态（⏳ → 🟢）
- 记录已完成、进行中、阻塞项
- 更新测试覆盖率数据

#### 📄 testing.md - 测试计划

**包含内容**：

- 组件测试策略（60%）
- E2E 测试策略（30%）
- 视觉测试策略（10%）
- 可访问性测试
- Mock 策略
- 测试命令和最佳实践

#### 📄 workflow.md - 开发工作流程

**标准流程**：

1. 用户故事 → 定义需求
2. UI/UX 设计 → 设计交互
3. 组件开发 → 实现功能
4. 测试验证 → 确保质量

#### 📄 decisions.md - 技术决策

**通用决策**（已包含）：

- 优先使用共享组件库
- 使用 TanStack 生态
- 样式方案（Tailwind CSS）
- 文档管理规范

**功能特定决策**：

- 组件库选择
- 状态管理方案
- 特殊交互实现

#### 📄 prompts.md - AI 提示词

**常用提示词**：

- 开发流程相关
- 组件开发相关
- API 集成相关
- 测试相关
- 样式相关
- 可访问性相关

#### 📄 future-work.md - 后续工作

**规划内容**：

- UI/UX 增强项
- 技术债
- 性能优化
- 可访问性优化
- 未来功能
- 用户反馈

#### 📄 docs/README.md - 用户文档

**文档内容**：

- 功能概述
- 使用方式（带截图）
- 功能说明
- 配置选项
- 常见用例
- 常见问题
- 故障排除
- 最佳实践

#### 📄 AGENTS.md - AI 助手指令

**AI 助手会自动**：

- 阅读设计文档
- 遵循工作流程
- 使用正确的代码模式
- 进行测试验证
- 生成用户文档

## 🎨 最佳实践

### 设计阶段

1. **用户故事**：
   - 使用标准模板：作为...我想要...以便于...
   - 符合 INVEST 原则
   - 与产品经理确认需求

2. **UI/UX 设计**：
   - 绘制用户流程图
   - 设计 Wireframe
   - 定义交互细节
   - 考虑响应式方案

3. **组件设计**：
   - 单一职责原则
   - Props 类型完整
   - 状态管理合理
   - 可访问性支持

### 开发阶段

1. **组件开发**：
   - 先写测试（TDD）
   - 使用共享组件库
   - 遵循代码规范
   - 完善错误处理

2. **API 集成**：
   - 使用 TanStack Query
   - 处理加载和错误状态
   - 实现乐观更新（如需要）

3. **样式实现**：
   - 优先使用 Tailwind classes
   - 响应式适配
   - 暗色模式支持（如需要）

### 测试阶段

1. **组件测试**：
   - 测试用户行为，而非实现细节
   - 使用 accessible queries
   - Mock 外部依赖

2. **E2E 测试**：
   - 覆盖关键用户流程
   - 测试真实浏览器环境

3. **可访问性测试**：
   - 使用 jest-axe
   - 键盘导航测试
   - 屏幕阅读器测试

### 文档阶段

1. **用户文档**：
   - 添加关键截图
   - 编写分步说明
   - 包含常见问题

2. **代码注释**：
   - 公共组件必须有 TSDoc
   - 复杂逻辑添加注释
   - 使用中文注释

## 📚 参考资源

### 项目文档

- [前端开发工作流程](./workflow.md)
- [组件测试指南](./testing.md)
- [设计系统文档](../../docs/design-system/README.md)

### 外部资源

- [TanStack Router 文档](https://tanstack.com/router/latest)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文档](https://playwright.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)

## 🔧 工具和命令

```bash
# 开发服务器
pnpm dev:web

# 运行组件测试
pnpm vitest run

# 运行 E2E 测试
pnpm playwright test

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build
```

## ❓ 常见问题

### Q: 何时使用前端模版 vs 后端模版？

**A:**

- **前端模版**：开发 `apps/web-admin` 或其他前端应用
- **后端模版**：开发 `apps/gateway` 或其他后端服务

### Q: 如何处理前后端协作？

**A:**

1. 后端先完成 API 开发和测试
2. 前端根据 API 文档设计 UI
3. 前端使用 Mock 数据开发
4. 集成测试前后端联调

### Q: 如何保证设计一致性？

**A:**

- 使用共享组件库
- 遵循设计系统规范
- 使用统一的样式变量
- 定期进行设计 Review

### Q: 如何处理技术债？

**A:**

1. 在 `future-work.md` 记录技术债
2. 评估优先级和影响
3. 安排到后续迭代
4. 定期回顾和清理

## 🤝 贡献

如果您发现模版可以改进的地方，欢迎：

1. 提出建议
2. 修改模版
3. 分享最佳实践

---

**最后更新**：2024-03-07
**维护者**：前端团队
