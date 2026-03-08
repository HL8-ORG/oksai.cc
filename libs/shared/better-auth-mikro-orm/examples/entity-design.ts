/**
 * Better Auth MikroORM 适配器 - Entity 设计最佳实践
 *
 * 本示例展示如何设计 Better Auth 兼容的 MikroORM Entity
 */

import {
  BeforeCreate,
  BeforeUpdate,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  Unique,
  Version,
} from "@mikro-orm/core";

// ============================================
// 1. 基础 User Entity（Better Auth 核心）
// ============================================

/**
 * 用户实体
 *
 * Better Auth 要求的核心字段：
 * - id: 用户唯一标识
 * - email: 用户邮箱（唯一）
 * - emailVerified: 邮箱是否验证
 * - name: 用户名称（可选）
 * - image: 用户头像（可选）
 * - createdAt: 创建时间
 * - updatedAt: 更新时间
 */
@Entity()
@Unique({ properties: ["email"] })
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "string", nullable: true })
  image?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  // 自定义字段
  @Property({ type: "string", nullable: true })
  @Unique()
  username?: string;

  @Property({ type: "string", nullable: true })
  locale?: string = "zh-CN";

  @Property({ type: "string", nullable: true })
  timezone?: string = "Asia/Shanghai";

  @Version()
  version: number = 1;

  constructor(email: string) {
    this.email = email;
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}

// ============================================
// 2. Session Entity（会话管理）
// ============================================

/**
 * 会话实体
 *
 * Better Auth 要求的核心字段：
 * - id: 会话唯一标识
 * - userId: 用户 ID
 * - expiresAt: 过期时间
 * - token: 会话令牌（唯一）
 * - ipAddress: IP 地址（可选）
 * - userAgent: 用户代理（可选）
 * - createdAt: 创建时间
 * - updatedAt: 更新时间
 */
@Entity()
@Unique({ properties: ["token"] })
export class Session {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  @Index()
  userId: string;

  @Property({ type: "Date" })
  expiresAt: Date;

  @Property({ type: "string" })
  token: string;

  @Property({ type: "string", nullable: true })
  ipAddress?: string;

  @Property({ type: "string", nullable: true })
  userAgent?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(userId: string, token: string, expiresAt: Date) {
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  extend(durationSeconds: number): void {
    this.expiresAt = new Date(Date.now() + durationSeconds * 1000);
  }
}

// ============================================
// 3. Account Entity（第三方登录）
// ============================================

/**
 * 账户实体（用于第三方登录）
 *
 * Better Auth 要求的核心字段：
 * - id: 账户唯一标识
 * - userId: 用户 ID
 * - accountId: 第三方账户 ID
 * - providerId: 提供商 ID（如 google, github）
 * - accessToken: 访问令牌（可选）
 * - refreshToken: 刷新令牌（可选）
 * - expiresAt: 过期时间（可选）
 * - createdAt: 创建时间
 * - updatedAt: 更新时间
 */
@Entity()
@Unique({ properties: ["providerId", "accountId"] })
export class Account {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  @Index()
  userId: string;

  @Property({ type: "string" })
  accountId: string;

  @Property({ type: "string" })
  providerId: string;

  @Property({ type: "string", nullable: true })
  accessToken?: string;

  @Property({ type: "string", nullable: true })
  refreshToken?: string;

  @Property({ type: "Date", nullable: true })
  expiresAt?: Date;

  @Property({ type: "string", nullable: true })
  scope?: string;

  @Property({ type: "string", nullable: true })
  idToken?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(userId: string, accountId: string, providerId: string) {
    this.userId = userId;
    this.accountId = accountId;
    this.providerId = providerId;
  }
}

// ============================================
// 4. Verification Entity（邮箱验证、密码重置）
// ============================================

/**
 * 验证实体
 *
 * 用于 Magic Link、邮箱验证、密码重置等场景
 */
@Entity()
@Unique({ properties: ["value"] })
export class Verification {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  @Index()
  identifier: string;

  @Property({ type: "string" })
  value: string;

  @Property({ type: "Date" })
  expiresAt: Date;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(identifier: string, value: string, expiresAt: Date) {
    this.identifier = identifier;
    this.value = value;
    this.expiresAt = expiresAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

// ============================================
// 5. 自定义字段扩展（多租户示例）
// ============================================

/**
 * 租户实体
 *
 * 多租户系统中的租户实体
 */
@Entity()
@Unique({ properties: ["slug"] })
export class Tenant {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  name: string;

  @Property({ type: "string" })
  slug: string;

  @Property({ type: "string", nullable: true })
  logo?: string;

  @Property({ type: "string", default: "FREE" })
  plan: string = "FREE";

  @Property({ type: "boolean", default: true })
  active: boolean = true;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(name: string, slug: string) {
    this.name = name;
    this.slug = slug;
  }
}

/**
 * 扩展用户实体（支持多租户）
 */
@Entity()
@Unique({ properties: ["email"] })
export class TenantUser {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "string", nullable: true })
  image?: string;

  // 多租户字段
  @Property({ type: "string", nullable: true })
  @Index()
  tenantId?: string;

  @Property({ type: "string", default: "user" })
  role: string = "user";

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string) {
    this.email = email;
  }
}

// ============================================
// 6. 关系模型设计（中间实体方案）
// ============================================

/**
 * 组织实体
 *
 * Better Auth Organization 插件支持
 */
@Entity()
@Unique({ properties: ["slug"] })
export class Organization {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  name: string;

  @Property({ type: "string" })
  slug: string;

  @Property({ type: "string", nullable: true })
  logo?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(name: string, slug: string) {
    this.name = name;
    this.slug = slug;
  }
}

/**
 * 组织成员中间实体
 *
 * 规避 m:m 关系限制，使用中间实体实现
 */
@Entity()
@Unique({ properties: ["organizationId", "userId"] })
export class OrganizationMember {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  @Index()
  organizationId: string;

  @Property({ type: "string" })
  @Index()
  userId: string;

  @Property({ type: "string", default: "member" })
  role: string = "member"; // owner, admin, member

  @Property({ type: "Date" })
  joinedAt: Date = new Date();

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(organizationId: string, userId: string, role: string = "member") {
    this.organizationId = organizationId;
    this.userId = userId;
    this.role = role;
  }
}

// ============================================
// 7. 最佳实践示例
// ============================================

/**
 * 最佳实践 1: 使用显式类型声明
 *
 * ✅ 推荐：显式声明类型
 */
@Entity()
export class GoodUser {
  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean;
}

/**
 * 最佳实践 2: 使用索引优化查询
 *
 * ✅ 推荐：为常用查询字段添加索引
 */
@Entity()
export class IndexedSession {
  @Property({ type: "string" })
  @Index() // 为 userId 添加索引
  userId: string;

  @Property({ type: "string" })
  @Index() // 为 token 添加索引
  token: string;
}

/**
 * 最佳实践 3: 使用唯一约束
 *
 * ✅ 推荐：使用 @Unique 装饰器
 */
@Entity()
@Unique({ properties: ["email"] })
export class UniqueUser {
  @Property({ type: "string" })
  email: string;
}

/**
 * 最佳实践 4: 使用构造函数
 *
 * ✅ 推荐：使用构造函数初始化必填字段
 */
@Entity()
export class ConstructorUser {
  @Property({ type: "string" })
  email: string;

  @Property({ type: "string", nullable: true })
  name?: string;

  constructor(email: string, name?: string) {
    this.email = email;
    this.name = name;
  }
}

/**
 * 最佳实践 5: 使用生命周期钩子
 *
 * ✅ 推荐：使用 @BeforeCreate 和 @BeforeUpdate
 */
@Entity()
export class LifecycleUser {
  @Property({ type: "string" })
  email: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date" })
  updatedAt: Date = new Date();

  @BeforeCreate()
  beforeCreate() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }

  constructor(email: string) {
    this.email = email;
  }
}

/**
 * 最佳实践 6: 使用乐观锁
 *
 * ✅ 推荐：使用 @Version 装饰器处理并发
 */
@Entity()
export class VersionedUser {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Version()
  version: number = 1;

  constructor(email: string) {
    this.email = email;
  }
}

/**
 * 最佳实践 7: JSON 字段使用
 *
 * ✅ 推荐：使用 json 类型并定义类型
 */
@Entity()
export class JsonUser {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "json", nullable: true })
  metadata?: {
    preferences?: {
      theme: "light" | "dark";
      language: string;
    };
    social?: {
      twitter?: string;
      github?: string;
    };
  };

  constructor(email: string) {
    this.email = email;
  }
}

/**
 * 最佳实践 8: 枚举类型使用
 *
 * ✅ 推荐：使用 TypeScript 枚举
 */
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  OWNER = "owner",
}

@Entity()
export class EnumUser {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "string", default: UserRole.USER })
  role: UserRole = UserRole.USER;

  constructor(email: string) {
    this.email = email;
  }
}

// ============================================
// 8. 完整示例：博客系统用户
// ============================================

/**
 * 博客用户实体（完整示例）
 */
@Entity()
@Unique({ properties: ["email"] })
@Unique({ properties: ["username"] })
export class BlogUser {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  // Better Auth 核心字段
  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "string", nullable: true })
  image?: string;

  // 自定义字段
  @Property({ type: "string" })
  username: string;

  @Property({ type: "string", nullable: true })
  bio?: string;

  @Property({ type: "string", nullable: true })
  website?: string;

  @Property({ type: "json", nullable: true })
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };

  @Property({ type: "string", default: "zh-CN" })
  locale: string = "zh-CN";

  @Property({ type: "string", default: "Asia/Shanghai" })
  timezone: string = "Asia/Shanghai";

  // 权限和状态
  @Property({ type: "string", default: UserRole.USER })
  role: UserRole = UserRole.USER;

  @Property({ type: "boolean", default: false })
  banned: boolean = false;

  @Property({ type: "string", nullable: true })
  banReason?: string;

  @Property({ type: "Date", nullable: true })
  bannedAt?: Date;

  // 时间戳
  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Version()
  version: number = 1;

  constructor(email: string, username: string) {
    this.email = email;
    this.username = username;
  }

  @BeforeCreate()
  beforeCreate() {
    if (!this.username) {
      throw new Error("用户名不能为空");
    }
  }

  ban(reason: string): void {
    this.banned = true;
    this.banReason = reason;
    this.bannedAt = new Date();
  }

  unban(): void {
    this.banned = false;
    this.banReason = undefined;
    this.bannedAt = undefined;
  }

  isBanned(): boolean {
    return this.banned;
  }
}

// ============================================
// 9. Entity 注册
// ============================================

/**
 * 导出所有 Entity
 *
 * 在 MikroORM 配置中注册：
 * ```typescript
 * const orm = await MikroORM.init({
 *   entities: [
 *     User,
 *     Session,
 *     Account,
 *     Verification,
 *     Tenant,
 *     TenantUser,
 *     Organization,
 *     OrganizationMember,
 *   ],
 * });
 * ```
 */
export {
  User,
  Session,
  Account,
  Verification,
  Tenant,
  TenantUser,
  Organization,
  OrganizationMember,
  UserRole,
};

// ============================================
// 10. 使用示例
// ============================================

/**
 * 使用示例（伪代码）
 *
 * ```typescript
 * import { orm } from "./orm.js";
 * import { User, Organization, OrganizationMember } from "./entities.js";
 *
 * async function example() {
 *   const em = orm.em.fork();
 *
 *   // 创建用户
 *   const user = em.create(User, {
 *     email: "user@example.com",
 *     name: "John Doe",
 *   });
 *
 *   // 创建组织
 *   const org = em.create(Organization, {
 *     name: "Example Org",
 *     slug: "example-org",
 *   });
 *
 *   // 添加用户到组织（使用中间实体）
 *   const member = em.create(OrganizationMember, {
 *     organizationId: org.id,
 *     userId: user.id,
 *     role: "owner",
 *   });
 *
 *   await em.flush();
 *
 *   // 查询组织的所有成员
 *   const members = await em.find(OrganizationMember, {
 *     organizationId: org.id,
 *   });
 *
 *   console.log("组织成员:", members);
 * }
 * ```
 */
