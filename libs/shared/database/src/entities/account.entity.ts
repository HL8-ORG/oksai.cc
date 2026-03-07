import { Entity, Index, Property } from "@mikro-orm/core";
import { BaseEntity } from "./base.entity.js";

/**
 * Account 实体
 *
 * @description
 * 存储用户的账户信息，支持多种认证方式：
 * - 邮箱/密码登录
 * - OAuth 社交登录（GitHub、Google 等）
 *
 * Better Auth 要求的字段：
 * - userId: 关联的用户 ID
 * - accountId: 账户标识（通常是邮箱或 OAuth provider 的用户 ID）
 * - providerId: 认证提供者（credential、github、google 等）
 * - accessToken: OAuth access token（可选）
 * - refreshToken: OAuth refresh token（可选）
 * - expiresAt: Token 过期时间（可选）
 *
 * @see https://better-auth.com/docs/concepts/database#account-table
 */
@Entity()
export class Account extends BaseEntity {
  /**
   * 用户 ID（索引字段，用于快速查询）
   */
  @Property()
  @Index()
  userId: string;

  /**
   * 账户标识
   * - 邮箱登录：邮箱地址
   * - OAuth：Provider 的用户 ID
   */
  @Property()
  accountId: string;

  /**
   * 认证提供者
   * - credential: 邮箱/密码
   * - github: GitHub OAuth
   * - google: Google OAuth
   */
  @Property()
  @Index()
  providerId: string;

  /**
   * OAuth Access Token（可选）
   */
  @Property({ nullable: true })
  accessToken?: string;

  /**
   * OAuth Refresh Token（可选）
   */
  @Property({ nullable: true })
  refreshToken?: string;

  /**
   * Access Token 过期时间（可选）
   */
  @Property({ nullable: true })
  expiresAt?: Date;

  /**
   * 密码（仅用于 credential 登录）
   * Better Auth 会自动加密
   */
  @Property({ nullable: true })
  password?: string;

  constructor(userId: string, accountId: string, providerId: string) {
    super();
    this.userId = userId;
    this.accountId = accountId;
    this.providerId = providerId;
  }
}
