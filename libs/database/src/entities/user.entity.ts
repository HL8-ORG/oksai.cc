import { BeforeCreate, Entity, Index, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./base.entity.js";

export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" | "user" | "admin";

@Entity()
@Unique({ properties: ["email"] })
export class User extends BaseEntity {
  @Property()
  email: string;

  @Property()
  emailVerified: boolean = false;

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true })
  image?: string;

  @Property({ nullable: true })
  @Unique()
  username?: string;

  @Property({ nullable: true })
  locale: string = "zh-CN";

  @Property({ nullable: true })
  timezone: string = "Asia/Shanghai";

  @Property({ nullable: true })
  @Index()
  tenantId?: string;

  @Property()
  role: UserRole = "user";

  @Property()
  banned: boolean = false;

  @Property({ nullable: true })
  banReason?: string;

  @Property({ nullable: true })
  bannedAt?: Date;

  @Property({ nullable: true })
  banExpires?: Date;

  @Property()
  twoFactorEnabled: boolean = false;

  @Property({ nullable: true })
  sessionTimeout?: number = 604800; // 7 天（秒）

  @Property()
  allowConcurrentSessions: boolean = true;

  @BeforeCreate()
  beforeCreate() {
    if (!this.email) {
      throw new Error("邮箱不能为空");
    }
  }

  isBanned(): boolean {
    if (!this.banned) return false;
    if (this.banExpires && new Date() > this.banExpires) {
      this.banned = false;
      this.bannedAt = undefined;
      this.banExpires = undefined;
      return false;
    }
    return true;
  }

  ban(reason: string, expiresAt?: Date): void {
    this.banned = true;
    this.banReason = reason;
    this.bannedAt = new Date();
    this.banExpires = expiresAt;
  }

  unban(): void {
    this.banned = false;
    this.banReason = undefined;
    this.bannedAt = undefined;
    this.banExpires = undefined;
  }

  verifyEmail(): void {
    this.emailVerified = true;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === "ADMIN" || this.role === "OWNER" || this.role === "admin";
  }

  constructor(email: string) {
    super();
    this.email = email;
  }
}
