/**
 * E2E 测试辅助工具
 *
 * 提供测试会话创建、数据库清理等功能
 */

import type { EntityManager } from "@mikro-orm/core";
import { Tenant, User } from "@oksai/iam-identity";

/**
 * 创建测试超级管理员用户
 */
export async function createTestSuperAdmin(
  em: EntityManager,
  options: {
    email?: string;
    name?: string;
    tenantId?: string;
  } = {}
): Promise<User> {
  const email = options.email ?? "superadmin@test.com";
  const name = options.name ?? "超级管理员";

  const user = new User(email);
  user.emailVerified = true;
  user.name = name;
  user.role = "superadmin"; // 超级管理员角色
  user.tenantId = options.tenantId ?? "system";
  user.locale = "zh-CN";
  user.timezone = "Asia/Shanghai";
  user.banned = false;
  user.twoFactorEnabled = false;
  user.allowConcurrentSessions = true;

  em.persist(user);
  await em.flush();

  return user;
}

/**
 * 创建测试租户
 */
export async function createTestTenant(
  em: EntityManager,
  options: {
    name?: string;
    slug?: string;
    plan?: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
    status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";
    ownerId?: string;
  } = {}
): Promise<Tenant> {
  const tenant = new Tenant(
    options.name ?? "测试租户",
    options.plan ?? "PRO",
    options.slug ?? `test-tenant-${Date.now()}`,
    options.ownerId ?? "test-owner"
  );

  if (options.status) {
    tenant.status = options.status;
  }

  tenant.maxOrganizations = 10;
  tenant.maxMembers = 100;
  tenant.maxStorage = 1073741824; // 1GB

  em.persist(tenant);
  await em.flush();

  return tenant;
}

/**
 * 创建模拟的 Better Auth Session
 *
 * 用于测试环境，绕过真实的 Better Auth 认证
 */
export function createMockSession(user: User): any {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    session: {
      id: `session-${user.id}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 天后过期
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(em: EntityManager): Promise<void> {
  const connection = em.getConnection();
  await connection.execute('TRUNCATE tenant, "user" CASCADE');
}
