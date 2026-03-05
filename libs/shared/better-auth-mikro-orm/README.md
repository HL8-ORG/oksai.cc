# Better Auth MikroORM 适配器

> MikroORM 数据库适配器 for [Better Auth](https://www.better-auth.com/) - oksai.cc 定制版

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 概述

这个包为 Better Auth 提供了 MikroORM 数据库适配器，允许你在使用 MikroORM 作为 ORM 的项目中无缝集成 Better Auth 认证系统。

### 特性

- ✅ **完整的 DBAdapter 契约支持** - 实现所有 Better Auth DBAdapter 方法
- ✅ **真实事务支持** - 使用 MikroORM 的 `transactional()` 确保数据一致性
- ✅ **EntityManager 上下文隔离** - 使用 `em.fork()` 确保请求隔离
- ✅ **TypeScript 原生支持** - 完整的类型定义
- ✅ **JSON 支持** - 通过 MikroORM 的 `JsonType` 支持 JSON 序列化

## 功能支持矩阵

| 功能 | 状态 | 说明 |
|-----|------|------|
| **基础 CRUD** |||
| `create` | ✅ 完全支持 | 创建单个实体 |
| `findOne` | ✅ 完全支持 | 查询单个实体 |
| `findMany` | ✅ 完全支持 | 查询多个实体 |
| `update` | ✅ 完全支持 | 更新单个实体 |
| `updateMany` | ✅ 完全支持 | 批量更新 |
| `delete` | ✅ 完全支持 | 删除单个实体 |
| `deleteMany` | ✅ 完全支持 | 批量删除 |
| `count` | ✅ 完全支持 | 统计数量 |
| **高级功能** |||
| `transaction` | ✅ 完全支持 | 真实数据库事务 |
| `id` | ✅ 完全支持 | ID 生成（由工厂提供） |
| `options` | ✅ 完全支持 | 配置选项 |
| `createSchema` | ❌ 不支持 | MikroORM 已内置 SchemaGenerator |
| **查询操作符** |||
| `in` | ✅ 完全支持 | IN 操作符 |
| `not_in` | ✅ 完全支持 | NOT IN 操作符 ⭐ NEW |
| `contains` | ✅ 完全支持 | LIKE %value% |
| `starts_with` | ✅ 完全支持 | LIKE value% |
| `ends_with` | ✅ 完全支持 | LIKE %value |
| `gt`, `gte` | ✅ 完全支持 | 大于/大于等于 |
| `lt`, `lte` | ✅ 完全支持 | 小于/小于等于 |
| `ne` | ✅ 完全支持 | 不等于 |
| **数据库特性** |||
| JSON 支持 | ✅ 完全支持 | JsonType |
| 数组支持 | ✅ 完全支持 | PostgreSQL ArrayType ⭐ NEW |
| UUID 支持 | ✅ 完全支持 | PostgreSQL UUID ⭐ NEW |
| **关系模型** |||
| 1:1 关系 | ✅ 完全支持 | 一对一关系 |
| m:1 关系 | ✅ 完全支持 | 多对一关系 |
| 1:m 关系 | ⚠️ 部分支持 | 需要中间实体 |
| m:m 关系 | ⚠️ 部分支持 | 需要中间实体 |

**⭐ NEW** - v0.2.1 新增功能

## 安装

```bash
pnpm add @oksai/better-auth-mikro-orm
```

### 对等依赖

确保已安装以下对等依赖：

```bash
pnpm add @mikro-orm/core better-auth
```

## 快速开始

### 1. 定义 Entity

首先，定义 Better Auth 所需的 Entity：

```typescript
// entities/user.entity.ts
import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  email: string;

  @Property()
  emailVerified: boolean = false;

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true })
  image?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

```typescript
// entities/session.entity.ts
import { Entity, PrimaryKey, Property, Index } from "@mikro-orm/core";

@Entity()
export class Session {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  @Index()
  userId: string;

  @Property()
  expiresAt: Date;

  @Property()
  token: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

### 2. 初始化 MikroORM

```typescript
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User, Session } from "./entities";

const orm = await MikroORM.init({
  driver: PostgreSqlDriver,
  dbName: "your-database",
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  entities: [User, Session, Account, Verification],
});
```

### 3. 配置 Better Auth

```typescript
import { betterAuth } from "better-auth";
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { orm } from "./orm";

export const auth = betterAuth({
  database: mikroOrmAdapter(orm),
  // 其他 Better Auth 配置...
});
```

### 4. 在 NestJS 中使用（可选）

```typescript
// auth.module.ts
import { Module } from "@nestjs/common";
import { BetterAuthModule } from "@oksai/nestjs-better-auth";
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { orm } from "./orm";

@Module({
  imports: [
    BetterAuthModule.forRoot({
      database: mikroOrmAdapter(orm),
      // 其他配置...
    }),
  ],
})
export class AuthModule {}
```

## 配置选项

### mikroOrmAdapter 配置

```typescript
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";

const adapter = mikroOrmAdapter(orm, {
  // 启用调试日志
  debugLogs: true,

  // 指示数据库是否支持 JSON（默认 true）
  supportsJSON: true,
});
```

### 完整配置示例

```typescript
import { betterAuth } from "better-auth";
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { orm } from "./orm";

export const auth = betterAuth({
  database: mikroOrmAdapter(orm, {
    debugLogs: process.env.NODE_ENV === "development",
    supportsJSON: true,
  }),

  // 禁用 Better Auth 的 ID 生成（使用 MikroORM 的）
  advanced: {
    database: {
      generateId: false,
    },
  },

  // 其他 Better Auth 配置
  emailAndPassword: {
    enabled: true,
  },
});
```

## 高级用法

### 事务支持

适配器提供真实的事务支持，确保多写操作的数据一致性：

```typescript
// Better Auth 内部会自动使用事务
// 例如：用户注册时同时创建用户和会话
await auth.api.signUpEmail({
  body: {
    email: "user@example.com",
    password: "password123",
    name: "User Name",
  },
});
```

### 自定义 Entity

如果需要添加自定义字段，可以扩展 Better Auth 的 Entity：

```typescript
@Entity()
export class User {
  // Better Auth 核心字段
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  email: string;

  @Property()
  emailVerified: boolean = false;

  // 自定义字段
  @Property({ nullable: true })
  username?: string;

  @Property({ nullable: true })
  locale?: string = "zh-CN";

  @Property({ nullable: true })
  tenantId?: string;

  @Property()
  role: string = "user";
}
```

### 多租户支持

```typescript
@Entity()
export class User {
  // ... 其他字段

  @Property({ nullable: true })
  tenantId?: string;
}

// 在应用中使用
const user = await auth.api.getUser({
  headers: request.headers,
});

// 根据 tenantId 过滤数据
const tenantUsers = await orm.em.find(User, {
  tenantId: user.tenantId,
});
```

## 测试

### 单元测试

```bash
pnpm test
```

### 集成测试

```bash
# 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 运行集成测试
pnpm vitest run src/spec/integration/

# 停止测试数据库
docker-compose -f docker-compose.test.yml down
```

## 限制

请参阅 [LIMITATIONS.md](./LIMITATIONS.md) 了解当前的限制和规避方案。

## 迁移指南

如果你从其他数据库适配器（如 Drizzle）迁移到 MikroORM，请参阅 [MIGRATION.md](./MIGRATION.md)。

## API 文档

完整的 API 文档请参阅源代码中的 TSDoc 注释。

## 故障排除

### 常见问题

#### 1. Entity metadata 错误

**问题**：
```
Error: Please provide either 'type' or 'entity' attribute
```

**解决方案**：
确保 `tsconfig.json` 中启用了 `emitDecoratorMetadata`：

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

或者显式声明类型：

```typescript
@Property({ type: "string" })
email: string;
```

#### 2. 事务未生效

**问题**：多写操作在失败时未回滚。

**解决方案**：
确保使用 Better Auth 的高层 API（如 `auth.api.signUpEmail`），适配器会自动处理事务。

#### 3. EntityManager 上下文污染

**问题**：多个请求共享同一个 EntityManager。

**解决方案**：
适配器内部使用 `em.fork()` 创建隔离的上下文，无需手动处理。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT © oksai.cc

## 相关链接

- [Better Auth 官方文档](https://www.better-auth.com/)
- [MikroORM 官方文档](https://mikro-orm.io/)
- [oksai.cc 项目](https://github.com/oksai/oksai.cc)

---

**维护者**: oksai.cc 团队
**最后更新**: 2026-03-05
