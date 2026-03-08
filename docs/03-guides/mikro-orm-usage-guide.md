# MikroORM 使用指南

**版本**: 6.6.8  
**更新日期**: 2026-03-05  
**适用于**: oksai.cc 项目

---

## 📚 目录

1. [快速开始](#快速开始)
2. [Entity 定义](#entity-定义)
3. [EntityManager 使用](#entitymanager-使用)
4. [Repository 模式](#repository-模式)
5. [查询构建器](#查询构建器)
6. [事务管理](#事务管理)
7. [生命周期钩子](#生命周期钩子)
8. [最佳实践](#最佳实践)

---

## 快速开始

### 1. 导入 Entity

```typescript
import { User, Session, OAuthClient, OAuthAccessToken } from '@oksai/database';
```

### 2. 使用 EntityManager

```typescript
import { EntityManager } from '@mikro-orm/core';

class UserService {
  constructor(private em: EntityManager) {}

  async createUser(email: string) {
    const user = this.em.create(User, { email });
    await this.em.flush();
    return user;
  }
}
```

### 3. 使用 Repository

```typescript
import { OAuthClient } from '@oksai/database';
import { EntityManager } from '@mikro-orm/core';

class OAuthService {
  constructor(private em: EntityManager) {}

  async findClient(clientId: string) {
    return this.em.findOne(OAuthClient, { clientId });
  }
}
```

---

## Entity 定义

### 基础 Entity

所有 Entity 都继承自 `BaseEntity`：

```typescript
import { BaseEntity } from '@oksai/database';

@Entity()
export class MyEntity extends BaseEntity {
  @Property()
  name: string;
}
```

**BaseEntity 包含**:

- `id: string` - UUID 主键
- `createdAt: Date` - 创建时间
- `updatedAt: Date` - 更新时间

### 完整 Entity 示例

```typescript
import {
  Entity,
  Property,
  Index,
  Unique,
  BeforeCreate,
  AfterUpdate,
} from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity()
@Unique({ properties: ['email'] })
export class User extends BaseEntity {
  @Property()
  email: string;

  @Property()
  @Index()
  username: string;

  @Property({ nullable: true })
  bio?: string;

  @Property({ type: 'text[]' })
  roles: string[] = [];

  // 生命周期钩子
  @BeforeCreate()
  beforeCreate() {
    if (!this.email.includes('@')) {
      throw new Error('Invalid email');
    }
  }

  // 业务方法
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  constructor(email: string, username: string) {
    super();
    this.email = email;
    this.username = username;
  }
}
```

### 常用装饰器

| 装饰器          | 说明       | 示例                                 |
| :-------------- | :--------- | :----------------------------------- |
| `@Entity()`     | 标记为实体 | `@Entity()`                          |
| `@Property()`   | 普通属性   | `@Property()`                        |
| `@PrimaryKey()` | 主键       | `@PrimaryKey()`                      |
| `@Index()`      | 索引       | `@Property() @Index()`               |
| `@Unique()`     | 唯一约束   | `@Unique({ properties: ['email'] })` |
| `@ManyToOne()`  | 多对一关系 | `@ManyToOne(() => User)`             |
| `@OneToMany()`  | 一对多关系 | `@OneToMany(() => Post)`             |
| `@ManyToMany()` | 多对多关系 | `@ManyToMany(() => Tag)`             |

---

## EntityManager 使用

### 创建实体

```typescript
// 方式 1: create + flush
const user = em.create(User, {
  email: 'test@example.com',
  username: 'testuser',
});
await em.flush();

// 方式 2: 直接构造 + persist
const user = new User('test@example.com', 'testuser');
em.persist(user);
await em.flush();
```

### 查询实体

```typescript
// 根据主键查询
const user = await em.findOne(User, { id: 'user-123' });

// 根据条件查询
const user = await em.findOne(User, { email: 'test@example.com' });

// 查询多个
const users = await em.find(User, { isActive: true });

// 查询并计数
const [users, total] = await em.findAndCount(
  User,
  { role: 'admin' },
  { limit: 10, offset: 0 },
);
```

### 更新实体

```typescript
const user = await em.findOne(User, { id: 'user-123' });
if (user) {
  user.username = 'newusername';
  await em.flush();
}
```

### 删除实体

```typescript
const user = await em.findOne(User, { id: 'user-123' });
if (user) {
  await em.remove(user).flush();
}

// 批量删除
await em.nativeDelete(User, { isActive: false });
```

---

## Repository 模式

### 自定义 Repository

```typescript
import { EntityManager } from '@mikro-orm/core';
import { EventSourcedRepository } from '@oksai/repository';

export class UserRepository extends EventSourcedRepository<User> {
  constructor(em: EntityManager, eventStore: EventStore) {
    super(em, eventStore, User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.em.find(
      User,
      {
        isActive: true,
      },
      {
        orderBy: { createdAt: 'DESC' },
      },
    );
  }

  async findByRole(role: string): Promise<User[]> {
    return this.em.find(User, {
      roles: { $contains: [role] },
    });
  }
}
```

### 使用 Repository

```typescript
const user = await userRepo.findByEmail('test@example.com');
const admins = await userRepo.findByRole('admin');
```

---

## 查询构建器

### 基础查询

```typescript
const qb = em.createQueryBuilder(User, 'u');

const users = await qb
  .select('*')
  .where({ isActive: true })
  .orderBy({ createdAt: 'DESC' })
  .limit(10)
  .getResult();
```

### 复杂条件

```typescript
// AND 条件
const users = await em.find(User, {
  isActive: true,
  role: 'admin',
});

// OR 条件
const users = await em.find(User, {
  $or: [{ role: 'admin' }, { role: 'moderator' }],
});

// IN 条件
const users = await em.find(User, {
  role: { $in: ['admin', 'moderator'] },
});

// LIKE 查询
const users = await em.find(User, {
  email: { $like: '%@example.com' },
});

// 比较运算
const users = await em.find(User, {
  createdAt: { $gte: new Date('2024-01-01') },
});
```

### 关联查询

```typescript
// 预加载关联
const posts = await em.find(
  Post,
  {},
  {
    populate: ['author', 'comments'],
  },
);

// 过滤关联
const posts = await em.find(
  Post,
  {
    author: { isActive: true },
  },
  {
    populate: ['author'],
  },
);
```

---

## 事务管理

### 自动事务 (Unit of Work)

```typescript
// MikroORM 自动管理事务
const user = em.create(User, { email: 'test@example.com' });
const session = em.create(Session, { userId: user.id });

await em.flush(); // 自动提交事务
```

### 显式事务

```typescript
await em.transactional(async (em) => {
  const user = em.create(User, { email: 'test@example.com' });
  const profile = em.create(Profile, { userId: user.id });

  // 如果任何操作失败，整个事务回滚
  return user;
});
```

### 嵌套事务

```typescript
await em.transactional(async (em) => {
  // 外层事务
  const user = await em.findOne(User, { id: 'user-123' });

  await em.transactional(async (em2) => {
    // 内层事务（使用 savepoint）
    const session = em2.create(Session, { userId: user.id });
  });
});
```

---

## 生命周期钩子

### 可用钩子

| 钩子              | 触发时机 | 用途         |
| :---------------- | :------- | :----------- |
| `@BeforeCreate()` | 创建前   | 验证、初始化 |
| `@AfterCreate()`  | 创建后   | 日志、事件   |
| `@BeforeUpdate()` | 更新前   | 验证         |
| `@AfterUpdate()`  | 更新后   | 日志、事件   |
| `@BeforeDelete()` | 删除前   | 级联清理     |
| `@AfterDelete()`  | 删除后   | 日志         |

### 使用示例

```typescript
@Entity()
export class User extends BaseEntity {
  @Property()
  email: string;

  @Property()
  status: string = 'pending';

  @BeforeCreate()
  beforeCreate() {
    // 验证邮箱格式
    if (!this.email.includes('@')) {
      throw new Error('Invalid email format');
    }

    // 设置默认值
    this.status = 'pending';
  }

  @AfterCreate()
  afterCreate() {
    // 发送欢迎邮件
    console.log(`New user created: ${this.email}`);
  }

  @BeforeUpdate()
  beforeUpdate() {
    // 验证状态转换
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted user');
    }
  }
}
```

---

## 最佳实践

### 1. Entity 设计

✅ **推荐**:

```typescript
@Entity()
export class User extends BaseEntity {
  // 使用构造函数确保必填字段
  constructor(email: string) {
    super();
    this.email = email;
  }

  // 业务逻辑封装在 Entity 中
  activate(): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending users can be activated');
    }
    this.status = 'active';
  }
}
```

❌ **不推荐**:

```typescript
// 贫血模型，业务逻辑散落在 Service 中
const user = new User();
user.email = email; // 可能为空
user.status = 'active'; // 不验证状态转换
```

### 2. 查询优化

✅ **推荐**:

```typescript
// 使用索引字段查询
const user = await em.findOne(User, { email: 'test@example.com' });

// 预加载关联
const posts = await em.find(
  Post,
  {},
  {
    populate: ['author', 'comments'],
  },
);
```

❌ **不推荐**:

```typescript
// 不使用索引字段
const users = await em.find(User, {
  bio: { $like: '%something%' }, // bio 没有索引
});

// N+1 查询问题
const posts = await em.find(Post, {});
for (const post of posts) {
  const author = await em.findOne(User, { id: post.authorId }); // N 次查询
}
```

### 3. 事务管理

✅ **推荐**:

```typescript
// 使用 Unit of Work
const user = em.create(User, { email });
const session = em.create(Session, { userId: user.id });
await em.flush(); // 自动事务
```

❌ **不推荐**:

```typescript
// 手动管理事务
await em.beginTransaction();
try {
  const user = em.create(User, { email });
  await em.flush();
  await em.commit();
} catch (error) {
  await em.rollback();
  throw error;
}
```

### 4. 错误处理

✅ **推荐**:

```typescript
try {
  const user = await em.findOneOrFail(User, { id: 'user-123' });
  return user;
} catch (error) {
  if (error instanceof NotFoundError) {
    throw new NotFoundException('User not found');
  }
  throw error;
}
```

### 5. 测试友好

✅ **推荐**:

```typescript
// Entity 独立可测试
describe('User', () => {
  it('should activate pending user', () => {
    const user = new User('test@example.com');
    user.status = 'pending';

    user.activate();

    expect(user.status).toBe('active');
  });
});
```

---

## 常见问题

### 1. 如何处理关联？

```typescript
// 一对多
@Entity()
export class User extends BaseEntity {
  @OneToMany(() => Post, (post) => post.author)
  posts = new Collection<Post>(this);
}

@Entity()
export class Post extends BaseEntity {
  @ManyToOne(() => User)
  author: User;
}

// 使用
const user = await em.findOne(
  User,
  { id: 'user-123' },
  {
    populate: ['posts'],
  },
);
```

### 2. 如何使用 JSON 字段？

```typescript
@Entity()
export class User extends BaseEntity {
  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;
}

// 查询 JSON 字段
const users = await em.find(User, {
  metadata: { $contains: { role: 'admin' } },
});
```

### 3. 如何使用数组字段？

```typescript
@Entity()
export class User extends BaseEntity {
  @Property({ type: 'text[]' })
  roles: string[] = [];
}

// 查询数组字段
const admins = await em.find(User, {
  roles: { $contains: ['admin'] },
});
```

---

## 📚 参考资源

- [MikroORM 官方文档](https://mikro-orm.io/)
- [MikroORM GitHub](https://github.com/mikro-orm/mikro-orm)
- [NestJS 集成](https://mikro-orm.io/docs/nestjs)
- [Entity 定义](https://mikro-orm.io/docs/defining-entities)
- [查询构建器](https://mikro-orm.io/docs/query-builder)
- [生命周期钩子](https://mikro-orm.io/docs/lifecycle-hooks)

---

**文档版本**: 1.0  
**维护者**: Team Lead  
**下次更新**: Phase 4 完成后
