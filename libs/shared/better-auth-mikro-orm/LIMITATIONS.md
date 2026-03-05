# Better Auth MikroORM 适配器 - 限制说明

本文档详细说明了 Better Auth MikroORM 适配器的当前限制，以及推荐的规避方案。

## 目录

- [关系模型限制](#关系模型限制)
- [性能限制](#性能限制)
- [功能限制](#功能限制)
- [数据库限制](#数据库限制)

---

## 关系模型限制

### 1. 多对多（m:m）关系不支持

**问题描述**：

Better Auth 的 DBAdapter 接口不支持直接处理 MikroORM 的多对多关系。如果尝试在 Entity 中使用 `@ManyToMany` 装饰器，适配器可能无法正确处理。

**受影响场景**：

- 组织成员管理（Organization ↔ User）
- 角色权限系统（User ↔ Role）
- 标签系统（User ↔ Tag）

**规避方案：使用中间实体**

```typescript
// ❌ 不推荐：直接使用 @ManyToMany
@Entity()
class Organization {
  @ManyToMany(() => User)
  members = new Collection<User>(this);
}

// ✅ 推荐：使用中间实体
@Entity()
class OrganizationMember {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToOne(() => User)
  member: User;

  @Property()
  role: string = "member"; // owner, admin, member

  @Property()
  joinedAt: Date = new Date();
}

// 使用示例
const orgMember = orm.em.create(OrganizationMember, {
  organization: org,
  member: user,
  role: "admin",
});
await orm.em.persistAndFlush(orgMember);

// 查询组织的所有成员
const members = await orm.em.find(OrganizationMember, {
  organization: org.id,
});
```

### 2. 一对多（1:m）关系部分支持

**问题描述**：

虽然 MikroORM 支持 `@OneToMany`，但 Better Auth 的 DBAdapter 接口设计主要针对单实体操作，不支持复杂的关联查询和加载。

**受影响场景**：

- 用户的所有会话（User → Session[]）
- 用户的所有账户（User → Account[]）
- 组织的所有项目（Organization → Project[]）

**规避方案：手动查询关联实体**

```typescript
// ✅ 推荐：手动查询关联实体
const sessions = await orm.em.find(Session, {
  userId: user.id,
});

// ✅ 推荐：使用 populate（如果需要）
const userWithSessions = await orm.em.findOne(User, { id: user.id }, {
  populate: ["sessions"],
});

// ⚠️ 注意：Better Auth 的 DBAdapter 不会自动处理这些关系
// 需要在应用层手动管理
```

### 3. 嵌入式引用不支持

**问题描述**：

MikroORM 的 `@Embeddable` 和 `@Embedded` 装饰器不被 Better Auth DBAdapter 支持。

**规避方案：使用 JSON 字段**

```typescript
// ❌ 不推荐：使用 @Embedded
@Embeddable()
class Address {
  @Property()
  street: string;

  @Property()
  city: string;
}

@Entity()
class User {
  @Embedded(() => Address)
  address: Address;
}

// ✅ 推荐：使用 JSON 字段
@Entity()
class User {
  @Property({ type: "json", nullable: true })
  address?: {
    street: string;
    city: string;
    country: string;
  };
}

// 注意：Better Auth 支持 JSON 字段，适配器会正确处理
```

---

## 性能限制

### 1. 批量操作性能

**问题描述**：

对于大批量操作（1000+ 条记录），适配器的性能可能不如原生 MikroORM API。

**受影响场景**：

- 批量导入用户
- 批量创建会话
- 批量删除过期数据

**规避方案：使用原生 MikroORM API**

```typescript
// ❌ 通过 Better Auth 适配器（性能较差）
for (const userData of users) {
  await auth.api.createUser({ body: userData });
}

// ✅ 直接使用 MikroORM（性能更好）
await orm.em.nativeInsert(User, users);
await orm.em.nativeDelete(Session, { expiresAt: { $lt: new Date() } });
```

### 2. 查询优化

**问题描述**：

Better Auth 的查询接口有限，不支持 MikroORM 的高级查询特性（如 `populate`、`fields`、`orderBy` 等）。

**规避方案：混合使用**

```typescript
// 使用 Better Auth 处理认证相关操作
const session = await auth.api.getSession({
  headers: request.headers,
});

// 使用 MikroORM 处理复杂查询
const users = await orm.em.find(User, {}, {
  populate: ["tenant"],
  fields: ["id", "email", "name"],
  orderBy: { createdAt: "DESC" },
  limit: 100,
});
```

### 3. 连接池限制

**问题描述**：

适配器内部使用 `em.fork()` 创建隔离的 EntityManager，可能导致连接池压力。

**规避方案：配置连接池**

```typescript
// 配置 MikroORM 连接池
const orm = await MikroORM.init({
  // ...其他配置
  pool: {
    min: 5,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
});
```

---

## 功能限制

### 1. createSchema 不支持

**问题描述**：

适配器未实现 Better Auth 的 `createSchema` 方法，因为 MikroORM 已有完善的 `SchemaGenerator`。

**规避方案：使用 MikroORM SchemaGenerator**

```bash
# 生成迁移
pnpm mikro-orm migration:create

# 运行迁移
pnpm mikro-orm migration:up

# 直接更新 Schema（仅开发环境）
pnpm mikro-orm schema:update --run
```

```typescript
// 或通过代码
const generator = orm.schema;
await generator.createSchema();
await generator.dropSchema();
await generator.updateSchema();
```

### 2. 复杂主键不支持

**问题描述**：

Better Auth 假设所有实体都有单列主键（通常是 `id`），不支持复合主键。

**规避方案：使用单列主键 + 唯一索引**

```typescript
// ❌ 不推荐：使用复合主键
@Entity()
class UserOrganization {
  @PrimaryKey()
  userId: string;

  @PrimaryKey()
  organizationId: string;
}

// ✅ 推荐：使用单列主键 + 唯一索引
@Entity()
@Unique({ properties: ["userId", "organizationId"] })
class UserOrganization {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  userId: string;

  @Property()
  organizationId: string;
}
```

### 3. 数据库特定功能受限

**问题描述**：

Better Auth 的 DBAdapter 接口是数据库无关的，无法使用 PostgreSQL 特有的功能（如 `RETURNING`、`ON CONFLICT` 等）。

**规避方案：使用原生 SQL**

```typescript
// 使用 MikroORM 的原生 SQL
const result = await orm.em.getConnection().execute(`
  INSERT INTO users (email, name)
  VALUES (?, ?)
  ON CONFLICT (email)
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id
`, [email, name]);
```

---

## 数据库限制

### 1. 支持的数据库

**已测试**：

- ✅ PostgreSQL 12+
- ✅ PostgreSQL 16（推荐）

**未测试但可能支持**：

- ⚠️ MySQL 8+
- ⚠️ MariaDB 10+
- ⚠️ SQLite 3+

**不支持**：

- ❌ MongoDB（Better Auth 不支持 NoSQL）
- ❌ Redis（不适用于认证数据库）

### 2. 字符集和排序规则

**建议**：

- PostgreSQL: 使用 `UTF8` 编码
- 排序规则: 使用 `en_US.UTF-8` 或 `zh_CN.UTF-8`

```sql
CREATE DATABASE better_auth
  ENCODING 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8';
```

### 3. 时区处理

**建议**：

- 数据库时区: UTC
- 应用时区: 根据用户偏好处理

```typescript
@Entity()
class User {
  // ...其他字段

  @Property({ nullable: true })
  timezone?: string = "UTC";

  @Property({ type: "Date" })
  createdAt: Date = new Date(); // 存储为 UTC
}
```

---

## 最佳实践

### 1. Entity 设计

- ✅ 使用单列 UUID 主键
- ✅ 为常用查询字段添加索引
- ✅ 使用 `@Unique` 约束唯一性
- ✅ 为 JSON 字段显式声明类型 `{ type: "json" }`

### 2. 查询优化

- ✅ 使用 `em.fork()` 隔离请求上下文
- ✅ 批量操作使用 `nativeInsert/nativeUpdate/nativeDelete`
- ✅ 合理使用 `populate` 预加载关联
- ✅ 使用 `fields` 限制查询字段

### 3. 事务管理

- ✅ 信任 Better Auth 的事务管理
- ✅ 不要手动管理 EntityManager 事务
- ✅ 使用 Better Auth 的高层 API（`auth.api.*`）

---

## 已知问题

### 1. Entity Metadata 自动推断

**问题**: 在某些情况下，TypeScript 的装饰器元数据可能无法正确推断类型。

**解决方案**: 显式声明类型

```typescript
@Property({ type: "string" })
email: string;

@Property({ type: "Date" })
createdAt: Date;

@Property({ type: "boolean" })
emailVerified: boolean;
```

### 2. 并发事务冲突

**问题**: 高并发场景下可能出现乐观锁冲突。

**解决方案**: 启用乐观锁并处理冲突

```typescript
@Entity()
class User {
  @PrimaryKey()
  id: string;

  @Version()
  version: number;

  // ...其他字段
}

// 处理并发冲突
try {
  await orm.em.flush();
} catch (error) {
  if (error instanceof OptimisticLockError) {
    // 重试或返回错误
  }
}
```

---

## 未来改进

计划在未来版本中改进：

- [ ] 支持 1:m 关系的自动查询
- [ ] 优化批量操作性能
- [ ] 支持更多数据库（MySQL, SQLite）
- [ ] 改进并发场景的处理

---

**维护者**: oksai.cc 团队
**最后更新**: 2026-03-05

如有问题或建议，请在 [GitHub Issues](https://github.com/oksai/oksai.cc/issues) 反馈。
