# 规格文档模版对比

本文档对比后端模版（`_templates`）和前端模版（`_templates-frontend`）的区别，帮助选择合适的模版。

## 📊 快速选择

| 项目类型 | 推荐模版 | 典型场景 |
|:---|:---|:---|
| **后端 API** | `_templates` | `apps/gateway`、NestJS 服务 |
| **前端应用** | `_templates-frontend` | `apps/web-admin`、React 应用 |
| **共享库（后端）** | `_templates` | `libs/` 下的 NestJS 库 |
| **共享库（前端）** | `_templates-frontend` | `libs/` 下的 React 组件库 |

## 🔍 详细对比

### 1. 设计重点

| 维度 | 后端模版 | 前端模版 |
|:---|:---|:---|
| **架构模式** | 领域驱动设计（DDD） | 组件驱动开发（CDD） |
| **关注点** | 业务逻辑、数据模型 | 用户体验、交互设计 |
| **核心概念** | 聚合根、实体、值对象 | 组件、Props、状态 |
| **设计输出** | API 契约、数据库 Schema | Wireframe、交互设计 |

### 2. design.md 对比

#### 后端 design.md

**核心内容**：
- ✅ 用户故事（INVEST 原则）
- ✅ BDD 场景设计
- ✅ **领域层设计**（聚合根、实体、值对象、领域事件）
- ✅ **应用层设计**（Command、Query、Handler）
- ✅ **基础设施层设计**（Repository、Adapter）
- ✅ 数据库变更（Schema、迁移）
- ✅ API 变更（端点、请求/响应结构）
- ✅ UI 变更（页面、组件）
- ✅ 测试策略（领域层 >90%，应用层 >85%）

**典型结构**：
```markdown
## 技术设计

### 领域层
- Entity: {职责}
- ValueObject: {职责}
- DomainEvent: {事件}

### 应用层
- Command: {命令}
- Query: {查询}
- Handler: {处理逻辑}

### 基础设施层
- Repository: {存储实现}
- Adapter: {外部服务适配}
```

#### 前端 design.md

**核心内容**：
- ✅ 用户故事（INVEST 原则）
- ✅ **用户流程设计**（用户旅程、关键流程）
- ✅ **UI/UX 设计**（Wireframe、交互设计、响应式设计）
- ✅ **组件设计**（页面组件、业务组件、通用组件）
- ✅ **路由设计**（路由路径、页面组件、访问权限）
- ✅ **状态管理**（全局状态、本地状态）
- ✅ **API 集成**（TanStack Query、数据获取、数据变更）
- ✅ **表单处理**（React Hook Form + Zod）
- ✅ **错误处理**（错误边界、全局错误处理）
- ✅ **加载状态**（页面加载、列表加载、按钮操作）
- ✅ **性能优化**（代码分割、列表虚拟化、图片优化）
- ✅ **可访问性设计**（WCAG 2.1 AA 标准、键盘导航、ARIA 标签）
- ✅ 测试策略（组件测试 >80%，E2E 100% 关键流程）

**典型结构**：
```markdown
## UI/UX 设计

### Wireframe / 设计稿
{页面布局、组件结构}

### 交互设计
{交互元素、触发方式、反馈效果}

### 响应式设计
{断点、布局变化、特殊处理}

## 技术设计

### 路由设计
{路由路径、页面组件、访问权限}

### 组件设计
{页面组件、业务组件、通用组件}

### API 集成
{TanStack Query hooks、数据获取、数据变更}

### 状态管理
{全局状态、本地状态}
```

### 3. workflow.md 对比

#### 后端 workflow.md

**流程**：
```
用户故事 → BDD 场景 → TDD 循环 → 代码实现
```

**阶段**：
1. **用户故事**：明确业务需求
2. **BDD 场景**：定义验收标准（Gherkin 语法）
3. **TDD 循环**：
   - 🔴 Red: 编写失败的单元测试
   - 🟢 Green: 最简实现
   - 🔵 Refactor: 优化代码
4. **代码实现**：按照 DDD 分层实现

**示例**：
```typescript
// 🔴 Red: 领域层测试
describe('{Entity}', () => {
  it('should create entity with valid props', () => {
    const result = Entity.create({ name: 'Test' });
    expect(result.isOk()).toBe(true);
  });
});

// 🟢 Green: 领域层实现
export class Entity extends AggregateRoot<Props> {
  static create(props: CreateProps): Result<Entity> {
    return Result.ok(new Entity({ ...props }));
  }
}

// 🔵 Refactor: 优化代码
```

#### 前端 workflow.md

**流程**：
```
用户故事 → UI/UX 设计 → 组件开发 → 测试验证
```

**阶段**：
1. **用户故事**：明确用户需求
2. **UI/UX 设计**：
   - 用户流程图
   - Wireframe
   - 交互设计
   - 响应式设计
3. **组件开发**（CDD）：
   - 创建路由
   - 实现页面组件
   - 实现业务组件
   - 集成 API
4. **测试验证**：
   - 组件测试
   - E2E 测试
   - 可访问性测试

**示例**：
```typescript
// Step 1: 创建路由
export const Route = createFileRoute('/users')({
  component: UsersPage,
});

// Step 2: 实现页面组件
export function UsersPage() {
  return (
    <div>
      <PageHeader title="用户管理" />
      <UserList />
    </div>
  );
}

// Step 3: 实现业务组件
export function UserList() {
  const { data, isLoading } = useUsers();
  
  if (isLoading) return <Loading />;
  return <ListView data={data} />;
}

// Step 4: 测试
describe('UserList', () => {
  it('should render user list', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByText('张三')).toBeInTheDocument();
  });
});
```

### 4. testing.md 对比

#### 后端 testing.md

**测试金字塔**：
```
E2E 测试（10%）
   ↑
集成测试（20%）
   ↑
单元测试（70%）
```

**测试重点**：
- **单元测试（70%）**：
  - 领域层：聚合根、实体、值对象
  - 应用层：Command Handler、Query Handler
- **集成测试（20%）**：
  - 基础设施层：Repository 实现
  - 多组件协作测试
- **E2E 测试（10%）**：
  - 关键业务流程
  - API 端到端验证

**测试命令**：
```bash
pnpm vitest run                    # 单元测试
pnpm vitest run **/*.int-spec.ts   # 集成测试
pnpm vitest run **/*.e2e-spec.ts   # E2E 测试
```

#### 前端 testing.md

**测试金字塔**：
```
视觉测试（10%）
   ↑
E2E 测试（30%）
   ↑
组件测试（60%）
```

**测试重点**：
- **组件测试（60%）**：
  - 组件渲染正确性
  - 用户交互行为
  - Props 变化响应
  - 状态管理
- **E2E 测试（30%）**：
  - 关键用户流程
  - 多组件协作
  - 真实浏览器环境
- **视觉测试（10%）**：
  - 关键页面截图对比
  - 组件视觉一致性
  - 响应式布局验证

**测试命令**：
```bash
pnpm vitest run                    # 组件测试
pnpm playwright test               # E2E 测试
pnpm playwright test --grep "Visual"  # 视觉测试
```

### 5. decisions.md 对比

#### 后端 decisions.md

**通用决策**：
- ✅ 优先使用共享模块（Logger、Exceptions、Constants、Config、Context）
- ✅ 文档管理规范（`docs/` 目录）

**典型决策**：
- ORM 选择（MikroORM vs Drizzle）
- 缓存策略（Redis vs Two-Layer）
- 消息队列选择
- 认证方案（Better Auth）

#### 前端 decisions.md

**通用决策**：
- ✅ 优先使用共享组件库
- ✅ 使用 TanStack 生态（Router、Query、Table）
- ✅ 样式方案（Tailwind CSS）
- ✅ 文档管理规范

**典型决策**：
- 组件库选择（Shadcn/ui vs Ant Design）
- 状态管理方案（TanStack Query + Zustand）
- 表单方案（React Hook Form vs TanStack Form）
- 动画方案（Framer Motion vs React Spring）

### 6. 实现进度跟踪对比

#### 后端 implementation.md

**跟踪内容**：
- BDD 场景进度（Feature 文件、测试状态）
- TDD 循环进度（Red、Green、Refactor）
- 测试覆盖率（领域层 >90%、应用层 >85%）

#### 前端 implementation.md

**跟踪内容**：
- UI 实现进度（页面、组件、API 集成、响应式）
- API 集成进度（Hook、缓存、错误处理、加载状态）
- 组件测试进度（渲染、交互、Props、状态）
- 响应式适配进度（Mobile、Tablet、Desktop）
- 可访问性检查（键盘导航、ARIA 标签、对比度）
- 性能指标（FCP、LCP、TTI、CLS）

### 7. 文档类型对比

#### 后端文档

**主要文档**：
- API 文档（Swagger/Scalar 自动生成）
- 技术设计文档
- 架构决策记录
- 运维文档

**文档受众**：
- 后端开发者
- 前端开发者（API 文档）
- 运维人员

#### 前端文档

**主要文档**：
- 用户使用文档（带截图）
- 组件使用文档
- 设计系统文档
- 可访问性指南

**文档受众**：
- 最终用户
- 前端开发者
- 设计师

## 🎯 使用建议

### 混合项目

如果项目同时包含前后端开发（如全栈功能）：

1. **后端优先**：先完成后端 API 开发和测试
2. **前端跟进**：前端根据 API 文档开发 UI
3. **分离文档**：
   - `specs/{feature}/` - 后端设计
   - `specs/{feature}-ui/` - 前端设计

### API 驱动开发

**推荐流程**：
1. 后端使用 `_templates` 设计 API
2. 前端使用 `_templates-frontend` 设计 UI
3. 前端使用 Mock 数据开发
4. 后端完成 API 后集成测试

### 设计协作

**协作流程**：
1. 产品经理定义用户故事
2. 设计师绘制 Wireframe
3. 前端实现 UI 组件
4. 后端实现 API 接口
5. 集成测试和优化

## 📚 参考资源

### 后端相关
- [后端模版](./_templates/README.md)
- [DDD 架构指南](./docs/architecture/README.md)
- [测试指南](./specs-testing/README.md)

### 前端相关
- [前端模版](./_templates-frontend/README.md)
- [设计系统文档](./docs/design-system/README.md)
- [组件开发指南](./docs/frontend/component-development.md)

---

**最后更新**：2024-03-07
**维护者**：技术团队
