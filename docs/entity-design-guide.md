# Entity 设计规范

**版本**: 1.0  
**更新日期**: 2026-03-05  
**适用于**: oksai.cc 项目

---

## 📋 目录

1. [设计原则](#设计原则)
2. [命名规范](#命名规范)
3. [字段设计](#字段设计)
4. [关系设计](#关系设计)
5. [业务逻辑](#业务逻辑)
6. [生命周期钩子](#生命周期钩子)
7. [示例模板](#示例模板)

---

## 设计原则

### 1. 单一职责

每个 Entity 应该只负责一个业务概念：

✅ **推荐**:
```typescript
@Entity()
export class User extends BaseEntity {
  // 只负责用户相关
}

@Entity()
export class Session extends BaseEntity {
  // 只负责会话相关
}
```

❌ **不推荐**:
```typescript
@Entity()
export class UserSession extends BaseEntity {
  // 混合了两个概念
}
```

### 2. 富领域模型

将业务逻辑封装在 Entity 中，而不是散落在 Service 层：

✅ **推荐**:
```typescript
@Entity()
export class User extends BaseEntity {
  @Property()
  status: string = 'pending';

  // 业务逻辑在 Entity 中
  activate(): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending users can be activated');
    }
    this.status = 'active';
  }
}
```

### 3. 不可变性

创建后不应改变的字段应该标记为 `readonly`：

```typescript
@Entity()
export class Payment extends BaseEntity {
  @Property()
  readonly amount: number; // 创建后不可修改

  constructor(amount: number) {
    super();
    this.amount = amount;
  }
}
```

---

## 命名规范

### Entity 命名

- **单数形式**: `User`, `Session`, `OAuthClient`
- **PascalCase**: `OAuthAccessToken`, `WebhookDelivery`
- **业务含义明确**: 避免缩写

### 字段命名

- **camelCase**: `createdAt`, `expiresAt`, `isActive`
- **布尔字段**: 使用 `is`, `has`, `can` 前缀
  - `isActive`, `hasPermission`, `canEdit`
- **时间字段**: 使用 `At` 后缀
  - `createdAt`, `updatedAt`, `expiresAt`
- **ID 字段**: 使用 `Id` 后缀
  - `userId`, `tenantId`, `organizationId`

### 方法命名

- **动词开头**: `activate`, `deactivate`, `revoke`
- **布尔返回**: `is`, `has`, `can`, `should`
  - `isValid()`, `hasExpired()`, `canRetry()`
- ** getters**: `get fullName()`

---

## 字段设计

### 基础字段

```typescript
@Entity()
export class User extends BaseEntity {
  // 字符串
  @Property()
  email: string;

  // 可选字段
  @Property({ nullable: true })
  bio?: string;

  // 默认值
  @Property()
  role: string = 'user';

  // 布尔值
  @Property()
  isActive: boolean = true;

  // 数字
  @Property({ type: 'integer' })
  loginCount: number = 0;

  // 日期
  @Property()
  expiresAt: Date;

  // JSON
  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  // 数组
  @Property({ type: 'text[]' })
  roles: string[] = [];
}
```

### 索引字段

```typescript
@Entity()
export class User extends BaseEntity {
  @Property()
  @Index()
  email: string;

  @Property()
  @Unique()
  username: string;

  // 复合索引
  @Index({ properties: ['tenantId', 'status'] })
  tenantId?: string;
  
  @Property()
  status: string;
}
```

### 枚举字段

```typescript
export type UserStatus = 'pending' | 'active' | 'suspended' | 'deleted';

@Entity()
export class User extends BaseEntity {
  @Property()
  status: UserStatus = 'pending';
}
```

---

## 关系设计

### ManyToOne (多对一)

```typescript
@Entity()
export class Session extends BaseEntity {
  @ManyToOne(() => User)
  @Index()
  user: User;
}
```

### OneToMany (一对多)

```typescript
@Entity()
export class User extends BaseEntity {
  @OneToMany(() => Session, session => session.user)
  sessions = new Collection<Session>(this);
}
```

### ManyToMany (多对多)

```typescript
@Entity()
export class User extends BaseEntity {
  @ManyToMany(() => Role)
  roles = new Collection<Role>(this);
}
```

---

## 业务逻辑

### 状态验证

```typescript
@Entity()
export class User extends BaseEntity {
  @Property()
  status: UserStatus = 'pending';

  activate(): void {
    // 状态转换验证
    if (this.status !== 'pending') {
      throw new Error('Only pending users can be activated');
    }
    this.status = 'active';
  }

  suspend(reason: string): void {
    if (this.status !== 'active') {
      throw new Error('Only active users can be suspended');
    }
    this.status = 'suspended';
    this.suspensionReason = reason;
  }
}
```

### 计算属性

```typescript
@Entity()
export class Session extends BaseEntity {
  @Property()
  expiresAt: Date;

  // 计算属性（不存储）
  @Property({ persist: false })
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  @Property({ persist: false })
  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }
}
```

### 业务规则

```typescript
@Entity()
export class OAuthClient extends BaseEntity {
  @Property()
  clientType: 'confidential' | 'public' = 'confidential';

  @Property({ nullable: true })
  clientSecret?: string;

  validateRedirectUri(uri: string): boolean {
    return this.redirectUris.includes(uri);
  }

  validateScope(scope: string): boolean {
    const requested = scope.split(' ');
    return requested.every(s => this.allowedScopes.includes(s));
  }
}
```

---

## 生命周期钩子

### 验证钩子

```typescript
@Entity()
export class User extends BaseEntity {
  @Property()
  email: string;

  @BeforeCreate()
  beforeCreate() {
    // 创建前验证
    if (!this.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    this.email = this.email.toLowerCase();
  }

  @BeforeUpdate()
  beforeUpdate() {
    // 更新前验证
    if (this.status === 'deleted') {
      throw new Error('Cannot update deleted user');
    }
  }
}
```

### 事件收集钩子

```typescript
@Entity()
export class Tenant extends BaseEntity {
  private _domainEvents: any[] = [];

  @BeforeCreate()
  beforeCreate() {
    this.addDomainEvent(new TenantCreatedEvent(this));
  }

  @AfterUpdate()
  afterUpdate() {
    this.addDomainEvent(new TenantUpdatedEvent(this));
  }

  protected addDomainEvent(event: any): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
```

---

## 示例模板

### 完整 Entity 模板

```typescript
import {
  AfterUpdate,
  BeforeCreate,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Collection } from '@mikro-orm/core';

export type EntityStatus = 'pending' | 'active' | 'suspended' | 'deleted';

/**
 * Entity 说明
 * 
 * 业务含义：xxx
 * 主要功能：xxx
 */
@Entity()
@Unique({ properties: ['uniqueField'] })
export class ExampleEntity extends BaseEntity {
  // 基础字段
  @Property()
  name: string;

  @Property({ nullable: true })
  description?: string;

  // 索引字段
  @Property()
  @Index()
  email: string;

  // 枚举字段
  @Property()
  status: EntityStatus = 'pending';

  // JSON 字段
  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  // 数组字段
  @Property({ type: 'text[]' })
  tags: string[] = [];

  // 关系字段
  @ManyToOne(() => User)
  @Index()
  createdBy: User;

  @OneToMany(() => Child, child => child.parent)
  children = new Collection<Child>(this);

  // 计算属性
  @Property({ persist: false })
  get isActive(): boolean {
    return this.status === 'active';
  }

  // 生命周期钩子
  @BeforeCreate()
  beforeCreate() {
    this.validate();
  }

  @AfterUpdate()
  afterUpdate() {
    // 清理缓存、发送通知等
  }

  // 业务方法
  activate(): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending entities can be activated');
    }
    this.status = 'active';
  }

  private validate(): void {
    if (!this.name || this.name.length < 3) {
      throw new Error('Name must be at least 3 characters');
    }
  }

  // 构造函数
  constructor(name: string, email: string, createdBy: User) {
    super();
    this.name = name;
    this.email = email;
    this.createdBy = createdBy;
  }
}
```

---

## 检查清单

创建新 Entity 时，请检查：

- [ ] 继承 `BaseEntity`
- [ ] 使用合适的装饰器 (`@Entity`, `@Property`, `@Index`)
- [ ] 添加索引到查询字段
- [ ] 添加唯一约束到唯一字段
- [ ] 实现必要的业务方法
- [ ] 添加生命周期钩子（如需）
- [ ] 编写单元测试
- [ ] 添加 TSDoc 注释
- [ ] 导出到 `entities/index.ts`

---

**文档版本**: 1.0  
**维护者**: Team Lead
