# oksai.cc 项目远景

## 一、项目愿景

**oksai.cc** 是一个开源的日程调度与预约管理平台，目标是实现 [Cal.com](https://cal.com) 的完整功能，同时采用更现代、更灵活的技术栈。

我们的使命是：**打造一个高性能、可扩展、开发者友好的调度平台，让每个人都能轻松管理时间和预约。**

---

## 二、参考项目：Cal.com

**Cal.com项目源码**位于：`/home/arligle/forks/cal.com/`

### 2.1 Cal.com 简介

Cal.com 是一个开源的日程调度基础设施，提供：

- **多类型日程管理**：一对一、团队协作、集体预约、轮询调度
- **日历集成**：Google Calendar、Outlook、Apple Calendar、CalDAV
- **视频会议集成**：Zoom、Google Meet、Microsoft Teams、Jitsi
- **支付集成**：Stripe 支付预约
- **团队功能**：团队日程、轮询分配、可用性管理
- **工作流自动化**：预约确认、提醒、后续跟进
- **白标/嵌入**：可嵌入网站、自定义品牌
- **API 平台**：完整的 REST API 和 Webhook

### 2.2 Cal.com 技术架构

| 层级 | 技术选型 |
|:---|:---|
| 框架 | Next.js (App Router) |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| API | tRPC |
| 认证 | NextAuth.js |
| UI | Tailwind CSS, Radix UI |
| 状态管理 | React Context, Jotai |
| Monorepo | Turborepo |

---

## 三、技术栈迁移策略

### 3.1 核心技术栈对比

| 功能领域 | Cal.com | oksai.cc | 迁移理由 |
|:---|:---|:---|:---|
| **全栈框架** | Next.js | TanStack Start | 更灵活的服务端渲染、更好的类型安全 |
| **ORM** | Prisma | Drizzle ORM | 更轻量、SQL 友好、更好的 TypeScript 支持 |
| **API 层** | tRPC | NestJS + tRPC | 更结构化的后端架构、模块化设计 |
| **认证** | NextAuth.js | Better Auth | 更灵活的 Provider 支持、NestJS 集成 |
| **Monorepo** | Turborepo | Nx | 更强大的任务编排、依赖图可视化 |
| **前端框架** | Next.js Pages | TanStack Router | 更好的类型安全路由 |
| **状态管理** | Jotai/Context | TanStack Query + Zustand | 服务端状态与客户端状态分离 |

### 3.2 技术选型详解

#### 3.2.1 TanStack Start vs Next.js

**选择 TanStack Start 的理由：**

1. **框架无关性**：不绑定特定托管平台，可部署到任何 Node.js 环境
2. **类型安全路由**：TanStack Router 提供完整的类型推断
3. **灵活的数据加载**：更好的服务端数据管理策略
4. **React Server Components 替代**：通过 route loaders 实现类似效果

#### 3.2.2 Drizzle ORM vs Prisma

**选择 Drizzle ORM 的理由：**

1. **更轻量**：零运行时依赖，构建产物更小
2. **SQL 友好**：支持原生 SQL，学习曲线低
3. **类型安全**：完整的 TypeScript 支持，类型推断更精准
4. **迁移简单**：drizzle-kit 提供简单的迁移工具
5. **性能优越**：无额外抽象层，查询性能更好

#### 3.2.3 NestJS 后端架构

**选择 NestJS 的理由：**

1. **模块化设计**：清晰的模块边界，易于维护和扩展
2. **依赖注入**：内置 IoC 容器，代码解耦
3. **装饰器模式**：类似 Angular 的开发体验
4. **生态系统**：丰富的官方模块（GraphQL、WebSocket、Microservices）
5. **企业级**：适合构建大型复杂应用

---

## 四、项目架构

### 4.1 Monorepo 结构

```
oksai.cc/
├── apps/
│   ├── gateway/              # NestJS API 网关
│   ├── web-admin/            # TanStack Start 管理后台
│   ├── web-booking/          # TanStack Start 预约前端
│   └── api/                  # 独立 API 服务（可选）
├── libs/
│   ├── auth/                 # 认证模块 (Better Auth + NestJS)
│   ├── database/             # 数据库层 (Drizzle ORM)
│   ├── shared/               # 共享工具和类型
│   ├── calendar/             # 日历集成
│   ├── video/                # 视频会议集成
│   ├── payment/              # 支付集成
│   ├── notification/         # 通知服务
│   └── scheduling/           # 调度核心逻辑
├── packages/
│   ├── ui/                   # 共享 UI 组件库
│   ├── embed/                # 嵌入式预约组件
│   └── sdk/                  # JavaScript/TypeScript SDK
├── specs/                    # 功能设计文档
├── docs/                     # 项目文档
└── docker/                   # Docker 配置
```

### 4.2 应用职责划分

| 应用 | 职责 | 技术栈 |
|:---|:---|:---|
| `gateway` | API 网关、业务逻辑、认证 | NestJS + Better Auth |
| `web-admin` | 管理后台、用户设置、团队管理 | TanStack Start + React |
| `web-booking` | 公开预约页面、嵌入组件 | TanStack Start + React |
| `api` | 独立 API 服务（可选） | NestJS + Fastify |

### 4.3 库模块划分

| 模块 | 职责 | 状态 |
|:---|:---|:---|
| `auth/nestjs-better-auth` | Better Auth NestJS 集成 | ✅ 已完成 |
| `database` | Drizzle ORM Schema 和迁移 | ✅ 基础完成 |
| `shared/types` | 共享类型定义 | ✅ 基础完成 |
| `shared/utils` | 共享工具函数 | ✅ 基础完成 |
| `calendar` | 日历 Provider 集成 | 📋 规划中 |
| `video` | 视频会议 Provider 集成 | 📋 规划中 |
| `payment` | Stripe 支付集成 | 📋 规划中 |
| `notification` | 邮件/短信/WebSocket 通知 | 📋 规划中 |
| `scheduling` | 核心调度算法 | 📋 规划中 |

---

## 五、功能路线图

### 5.1 Phase 1: 基础设施 (当前)

**目标：** 建立稳定的项目基础设施

- [x] Nx Monorepo 配置
- [x] Biome Lint + Format 配置
- [x] Husky Pre-commit 钩子
- [x] Better Auth + NestJS 集成
- [x] Drizzle ORM 数据库层
- [x] TanStack Start 管理后台骨架
- [ ] CI/CD 配置 (GitHub Actions)
- [ ] Docker 容器化

### 5.2 Phase 2: 核心功能

**目标：** 实现基本的日程调度功能

- [ ] 用户注册/登录/资料管理
- [ ] 日历连接 (Google Calendar)
- [ ] 可用性设置
- [ ] 预约类型管理
- [ ] 一对一预约流程
- [ ] 预约确认/取消/重新安排
- [ ] 邮件通知

### 5.3 Phase 3: 团队功能

**目标：** 支持团队协作调度

- [ ] 团队创建和管理
- [ ] 团队成员角色
- [ ] 团队日程
- [ ] 轮询调度
- [ ] 集体预约

### 5.4 Phase 4: 集成扩展

**目标：** 提供丰富的第三方集成

- [ ] 视频会议集成 (Zoom, Google Meet)
- [ ] 支付集成 (Stripe)
- [ ] 更多日历支持 (Outlook, Apple Calendar)
- [ ] Webhook API
- [ ] REST API

### 5.5 Phase 5: 高级功能

**目标：** 提供企业级功能

- [ ] 工作流自动化
- [ ] 自定义品牌/白标
- [ ] 嵌入式预约组件
- [ ] 分析和报告
- [ ] 多语言支持
- [ ] 移动端适配

---

## 六、与 Cal.com 的差异点

### 6.1 架构优势

| 方面 | Cal.com | oksai.cc |
|:---|:---|:---|
| **后端架构** | Next.js API Routes | NestJS 模块化架构 |
| **可部署性** | 依赖 Vercel 特性 | 可部署到任何平台 |
| **ORM 灵活性** | Prisma 抽象层 | Drizzle SQL 友好 |
| **类型安全** | 部分类型推断 | 端到端类型安全 |
| **性能** | RSC 优化 | 灵活的渲染策略 |

### 6.2 开发体验

- **更清晰的项目结构**：Nx 提供更好的依赖管理和任务编排
- **更好的工具链**：Biome 提供更快的 Lint 和格式化
- **更灵活的后端**：NestJS 模块化设计便于扩展
- **更小的依赖**：Drizzle 比 Prisma 轻量很多

### 6.3 功能对齐计划

| 功能 | Cal.com | oksai.cc 计划 |
|:---|:---|:---|
| 一对一预约 | ✅ | Phase 2 |
| 团队预约 | ✅ | Phase 3 |
| 集体预约 | ✅ | Phase 3 |
| 轮询调度 | ✅ | Phase 3 |
| 付费预约 | ✅ | Phase 4 |
| 视频会议 | ✅ | Phase 4 |
| 工作流 | ✅ | Phase 5 |
| 白标 | ✅ | Phase 5 |
| API | ✅ | Phase 4 |
| 嵌入组件 | ✅ | Phase 5 |

---

## 七、技术债务与风险

### 7.1 潜在风险

1. **TanStack Start 成熟度**：相比 Next.js 生态较小
   - 缓解：关注官方进展，必要时可回退到 Next.js

2. **Better Auth vs NextAuth**：功能可能有差异
   - 缓解：Better Auth 更灵活，可自定义实现缺失功能

3. **迁移复杂度**：Cal.com 代码量大
   - 缓解：渐进式迁移，优先核心功能

### 7.2 技术债务管理

- 保持与 Cal.com 的功能对齐
- 定期评估技术选型的合理性
- 保持代码质量和测试覆盖率

---

## 八、贡献指南

### 8.1 开发环境

```bash
# 克隆项目
git clone https://github.com/oksai/oksai.cc.git

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 启动数据库
pnpm docker:up

# 数据库迁移
pnpm db:migrate
```

### 8.2 代码规范

- 遵循 `AGENTS.md` 中的项目规范
- 使用 `/code-review-checklist` 进行代码审查
- 使用 `/git-cz` 生成规范的提交信息

### 8.3 功能开发流程

1. 创建 Spec 文档：`/spec new {feature-name}`
2. 实现功能：遵循 `design.md` 设计
3. 代码审查：`/code-review-checklist`
4. 提交代码：`/git-cz`
5. 创建 PR：`/create-pr`

---

## 九、参考资源

- [Cal.com GitHub](https://github.com/calcom/cal.com)
- [TanStack Start 文档](https://tanstack.com/start)
- [Drizzle ORM 文档](https://orm.drizzle.team)
- [NestJS 文档](https://docs.nestjs.com)
- [Better Auth 文档](https://www.better-auth.com)
- [Nx 文档](https://nx.dev)

---

## 十、版本历史

| 版本 | 日期 | 说明 |
|:---|:---|:---|
| 0.1.0 | 2026-03 | 项目初始化，基础架构搭建 |
| 0.2.0 | TBD | 核心调度功能 |
| 1.0.0 | TBD | 功能对齐 Cal.com 核心功能 |

---

*最后更新：2026年3月2日*
