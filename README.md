# Oksai - 企业级多租户 SaaS 平台

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

## 项目愿景

**Oksai** 是一个面向现代企业的多租户 SaaS 平台，为中小企业提供：

- 🔐 **统一认证中心** - 多租户、多登录方式、RBAC 权限管理
- 🤖 **AI 集成** - LLM 对话、向量搜索、AI Agent 编排
- 📢 **消息通知基础设施** - 邮件、短信、WebSocket、Webhook
- 📊 **数据治理和分析** - 日志、指标、审计追踪

## 技术栈

| 层级     | 技术选型                                      |
| -------- | --------------------------------------------- |
| 前端     | React 18 + TanStack Router/Query + Ant Design |
| 后端     | NestJS 10 + TypeScript                        |
| 数据库   | PostgreSQL + Prisma ORM + pgvector            |
| 缓存     | Redis                                         |
| 消息队列 | RabbitMQ                                      |
| 对象存储 | MinIO                                         |
| 认证     | Better Auth                                   |
| 部署     | Docker Compose                                |

## 项目结构

```
oksai.cc/
├── apps/                    # 应用
│   ├── gateway/             # API 网关
│   ├── auth-service/        # 认证服务
│   ├── ai-service/          # AI 服务
│   ├── notification-service/# 通知服务
│   ├── web-admin/           # 管理后台
│   ├── web-auth/            # 认证中心 UI
│   └── web-marketing/       # 营销官网
├── libs/                    # 共享库
│   ├── shared/              # 共享类型、工具
│   ├── database/            # Prisma Schema
│   ├── infra/               # 基础设施客户端
│   ├── auth/                # 认证逻辑
│   ├── ai/                  # AI 集成
│   ├── notification/        # 通知服务
│   └── ui/                  # UI 组件库
├── docs/                    # 文档
├── docker/                  # Docker 配置
└── tools/                   # 工具脚本
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动基础设施 (PostgreSQL, Redis)
docker-compose -f docker/docker-compose.dev.yml up -d

# 运行数据库迁移
pnpm nx run @oksai/database:migrate

# 启动开发服务器
pnpm nx serve gateway
```

## 常用命令

```bash
# 查看所有项目
pnpm nx show projects

# 构建所有项目
pnpm nx run-many -t build

# 运行测试
pnpm nx run-many -t test

# 代码检查
pnpm nx run-many -t lint

# 查看依赖图
pnpm nx graph
```

## 文档

- [架构规划文档](./docs/ARCHITECTURE.md) - 完整的架构设计、模块规划、实施路线图
- [API 设计规范](./docs/API_DESIGN.md) (待创建)
- [部署指南](./docs/DEPLOYMENT.md) (待创建)

## 开发状态

🚧 **PoC 阶段** - 当前正在验证核心技术可行性

## License

MIT
