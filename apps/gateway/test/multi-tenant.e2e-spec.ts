/**
 * 多租户管理 E2E 测试
 *
 * 实现核心 BDD 场景的端到端测试
 */

import { type EntityManager, MikroORM } from "@mikro-orm/core";
import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { Tenant, User } from "@oksai/database";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";

describe("多租户管理 E2E 测试", () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    orm = app.get(MikroORM);
    em = orm.em.fork();

    await app.init();
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  beforeEach(async () => {
    // 清理数据库
    const connection = em.getConnection();
    await connection.execute('TRUNCATE tenant, "user" CASCADE');
  });

  describe("场景 1: 租户识别与数据隔离", () => {
    it("应该自动过滤并只返回当前租户的用户", async () => {
      // Given: 创建两个租户和用户
      const tenant1 = new Tenant("租户1", "PRO", "tenant-1", "owner-1");
      tenant1.status = "ACTIVE";
      tenant1.maxOrganizations = 10;
      tenant1.maxMembers = 100;
      tenant1.maxStorage = 10737418240;
      em.persist(tenant1);

      const tenant2 = new Tenant("租户2", "PRO", "tenant-2", "owner-2");
      tenant2.status = "ACTIVE";
      tenant2.maxOrganizations = 10;
      tenant2.maxMembers = 100;
      tenant2.maxStorage = 10737418240;
      em.persist(tenant2);

      await em.flush();

      // 创建租户1的5个用户
      for (let i = 0; i < 5; i++) {
        const user = new User(`user${i}@tenant1.com`);
        user.emailVerified = true;
        user.name = `用户${i}`;
        user.tenantId = tenant1.id;
        user.role = "user";
        user.locale = "zh-CN";
        user.timezone = "Asia/Shanghai";
        user.banned = false;
        user.twoFactorEnabled = false;
        user.allowConcurrentSessions = true;
        em.persist(user);
      }

      // 创建租户2的3个用户
      for (let i = 0; i < 3; i++) {
        const user = new User(`user${i}@tenant2.com`);
        user.emailVerified = true;
        user.name = `用户${i}`;
        user.tenantId = tenant2.id;
        user.role = "user";
        user.locale = "zh-CN";
        user.timezone = "Asia/Shanghai";
        user.banned = false;
        user.twoFactorEnabled = false;
        user.allowConcurrentSessions = true;
        em.persist(user);
      }

      await em.flush();

      // When: 租户1的用户请求用户列表
      const response = await request(app.getHttpServer())
        .get("/api/users")
        .set("Authorization", `Bearer test-token-tenant-${tenant1.id}`)
        .set("X-Tenant-ID", tenant1.id);

      // Then: 只返回租户1的用户
      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(5);
      expect(response.body.users.every((u: any) => u.tenantId === tenant1.id)).toBe(true);
    });
  });

  describe("场景 2: 创建租户并设置配额", () => {
    it("管理员应该能够创建租户并设置配额", async () => {
      // Given: 管理员已登录
      const adminToken = "test-admin-token";

      // When: 创建租户
      const response = await request(app.getHttpServer())
        .post("/api/admin/tenants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "企业A",
          slug: "enterprise-a",
          plan: "PRO",
          ownerId: "admin-user-1",
          maxMembers: 100,
          maxOrganizations: 10,
        });

      // Then: 租户创建成功
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("企业A");
      expect(response.body.slug).toBe("enterprise-a");
      expect(response.body.plan).toBe("PRO");
      expect(response.body.status).toBe("PENDING");
      expect(response.body.quota.maxMembers).toBe(100);
      expect(response.body.quota.maxOrganizations).toBe(10);
    });
  });

  describe("场景 3: 租户激活", () => {
    it("管理员应该能够激活待审核的租户", async () => {
      // Given: 创建待审核的租户
      const tenant = new Tenant("待激活租户", "PRO", "pending-tenant", "owner-1");
      // status 会自动设置为 "pending"
      tenant.maxOrganizations = 10;
      tenant.maxMembers = 100;
      tenant.maxStorage = 10737418240;
      em.persist(tenant);
      await em.flush();

      const adminToken = "test-admin-token";

      // When: 激活租户
      const response = await request(app.getHttpServer())
        .post(`/api/admin/tenants/${tenant.id}/activate`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Then: 租户状态变为 ACTIVE
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ACTIVE");

      // 验证数据库中的状态
      await em.refresh(tenant);
      expect(tenant.status).toBe("ACTIVE");
    });
  });

  describe("场景 5: 无效租户访问", () => {
    it("应该在缺少租户标识时返回 400", async () => {
      // When: 请求不带租户标识
      const response = await request(app.getHttpServer()).get("/api/users");

      // Then: 返回 400
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("缺少租户标识");
    });
  });

  describe("场景 6: 租户已停用", () => {
    it("应该在租户停用时拒绝访问", async () => {
      // Given: 创建已停用的租户
      const tenant = new Tenant("已停用租户", "PRO", "suspended-tenant", "owner-1");
      // 先激活，再停用
      tenant.status = "active";
      tenant.suspend("测试停用");
      tenant.maxOrganizations = 10;
      tenant.maxMembers = 100;
      tenant.maxStorage = 10737418240;
      em.persist(tenant);
      await em.flush();

      // When: 用户请求
      const response = await request(app.getHttpServer())
        .get("/api/users")
        .set("Authorization", `Bearer test-token-tenant-${tenant.id}`)
        .set("X-Tenant-ID", tenant.id);

      // Then: 返回 403
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("租户已被停用");
    });
  });

  describe("场景 7: 跨租户访问资源", () => {
    it("应该阻止跨租户访问资源", async () => {
      // Given: 创建两个租户和资源
      const tenant1 = new Tenant("租户1", "PRO", "tenant-1", "owner-1");
      tenant1.status = "ACTIVE";
      tenant1.maxOrganizations = 10;
      tenant1.maxMembers = 100;
      tenant1.maxStorage = 10737418240;
      em.persist(tenant1);

      const tenant2 = new Tenant("租户2", "PRO", "tenant-2", "owner-2");
      tenant2.status = "ACTIVE";
      tenant2.maxOrganizations = 10;
      tenant2.maxMembers = 100;
      tenant2.maxStorage = 10737418240;
      em.persist(tenant2);

      const resource = new User("resource@tenant2.com");
      resource.emailVerified = true;
      resource.name = "资源";
      resource.tenantId = tenant2.id;
      resource.role = "user";
      resource.locale = "zh-CN";
      resource.timezone = "Asia/Shanghai";
      resource.banned = false;
      resource.twoFactorEnabled = false;
      resource.allowConcurrentSessions = true;
      em.persist(resource);

      await em.flush();

      // When: 租户1的用户尝试访问租户2的资源
      const response = await request(app.getHttpServer())
        .get(`/api/users/${resource.id}`)
        .set("Authorization", `Bearer test-token-tenant-${tenant1.id}`)
        .set("X-Tenant-ID", tenant1.id);

      // Then: 返回 403
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("无权访问其他租户的资源");
    });
  });

  describe("场景 4: 检查租户配额", () => {
    it("应该在配额范围内允许邀请成员", async () => {
      // Given: 创建租户（配额 100，当前 99）
      const tenant = new Tenant("测试租户", "PRO", "test-tenant", "owner-1");
      tenant.status = "ACTIVE";
      tenant.maxOrganizations = 10;
      tenant.maxMembers = 100;
      tenant.maxStorage = 10737418240;
      em.persist(tenant);
      await em.flush();

      // 创建 99 个成员
      for (let i = 0; i < 99; i++) {
        const user = new User(`member${i}@test.com`);
        user.emailVerified = true;
        user.name = `成员${i}`;
        user.tenantId = tenant.id;
        user.role = "user";
        user.locale = "zh-CN";
        user.timezone = "Asia/Shanghai";
        user.banned = false;
        user.twoFactorEnabled = false;
        user.allowConcurrentSessions = true;
        em.persist(user);
      }
      await em.flush();

      // When: 邀请新成员
      const response = await request(app.getHttpServer())
        .post("/api/organizations/org-1/invite")
        .set("Authorization", `Bearer test-token-tenant-${tenant.id}`)
        .set("X-Tenant-ID", tenant.id)
        .send({
          email: "new-member@test.com",
          name: "新成员",
        });

      // Then: 邀请成功
      expect(response.status).toBe(201);
    });
  });

  describe("场景 8: 超过配额限制", () => {
    it("应该在超过配额时拒绝邀请成员", async () => {
      // Given: 创建租户（配额 100，当前 100）
      const tenant = new Tenant("测试租户", "PRO", "test-tenant-8", "owner-1");
      tenant.status = "ACTIVE";
      tenant.maxOrganizations = 10;
      tenant.maxMembers = 100;
      tenant.maxStorage = 10737418240;
      em.persist(tenant);
      await em.flush();

      // 创建 100 个成员
      for (let i = 0; i < 100; i++) {
        const user = new User(`member${i}@test8.com`);
        user.emailVerified = true;
        user.name = `成员${i}`;
        user.tenantId = tenant.id;
        user.role = "user";
        user.locale = "zh-CN";
        user.timezone = "Asia/Shanghai";
        user.banned = false;
        user.twoFactorEnabled = false;
        user.allowConcurrentSessions = true;
        em.persist(user);
      }
      await em.flush();

      // When: 邀请新成员
      const response = await request(app.getHttpServer())
        .post("/api/organizations/org-1/invite")
        .set("Authorization", `Bearer test-token-tenant-${tenant.id}`)
        .set("X-Tenant-ID", tenant.id)
        .send({
          email: "new-member@test.com",
          name: "新成员",
        });

      // Then: 返回 403
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("已达到配额限制");
    });
  });

  describe("场景 9: 租户 ID 不一致", () => {
    it("应该在租户ID不一致时使用 JWT Token 中的 tenantId", async () => {
      // Given: 创建租户
      const tenant1 = new Tenant("租户1", "PRO", "tenant-1-id-test", "owner-1");
      tenant1.status = "ACTIVE";
      tenant1.maxOrganizations = 10;
      tenant1.maxMembers = 100;
      tenant1.maxStorage = 10737418240;
      em.persist(tenant1);

      const tenant2 = new Tenant("租户2", "PRO", "tenant-2-id-test", "owner-2");
      tenant2.status = "ACTIVE";
      tenant2.maxOrganizations = 10;
      tenant2.maxMembers = 100;
      tenant2.maxStorage = 10737418240;
      em.persist(tenant2);

      // 租户1的用户
      const user = new User("user@tenant1-id-test.com");
      user.emailVerified = true;
      user.name = "用户1";
      user.tenantId = tenant1.id;
      user.role = "user";
      user.locale = "zh-CN";
      user.timezone = "Asia/Shanghai";
      user.banned = false;
      user.twoFactorEnabled = false;
      user.allowConcurrentSessions = true;
      em.persist(user);

      await em.flush();

      // When: JWT Token 中是 tenant1，Header 中是 tenant2
      const response = await request(app.getHttpServer())
        .get("/api/users")
        .set("Authorization", `Bearer test-token-tenant-${tenant1.id}`)
        .set("X-Tenant-ID", tenant2.id); // 不一致的租户ID

      // Then: 使用 JWT Token 中的 tenant1
      expect(response.status).toBe(200);
      // 应该返回租户1的用户（而不是租户2）
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].tenantId).toBe(tenant1.id);
    });
  });

  describe("场景 10: 租户配额为零", () => {
    it("应该在配额为零时拒绝邀请成员", async () => {
      // Given: 创建配额为零的租户
      const tenant = new Tenant("测试租户", "FREE", "test-tenant-zero", "owner-1");
      tenant.status = "ACTIVE";
      tenant.maxOrganizations = 0;
      tenant.maxMembers = 0;
      tenant.maxStorage = 0;
      em.persist(tenant);
      await em.flush();

      // When: 邀请新成员
      const response = await request(app.getHttpServer())
        .post("/api/organizations/org-1/invite")
        .set("Authorization", `Bearer test-token-tenant-${tenant.id}`)
        .set("X-Tenant-ID", tenant.id)
        .send({
          email: "new-member@test.com",
          name: "新成员",
        });

      // Then: 返回 403
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("租户配额为零");
    });
  });

  describe("场景 11: 租户切换组织", () => {
    it("应该在切换组织时保持租户上下文不变", async () => {
      // Given: 创建租户和两个组织
      const tenant = new Tenant("测试租户", "PRO", "test-tenant-org", "owner-1");
      tenant.status = "ACTIVE";
      tenant.maxOrganizations = 10;
      tenant.maxMembers = 100;
      tenant.maxStorage = 10737418240;
      em.persist(tenant);
      await em.flush();

      // 注意：Organization 是通过 Better Auth 管理的，这里模拟切换
      // When: 切换组织
      const response = await request(app.getHttpServer())
        .post("/api/organizations/switch")
        .set("Authorization", `Bearer test-token-tenant-${tenant.id}-org-1`)
        .set("X-Tenant-ID", tenant.id)
        .send({
          organizationId: "org-2",
        });

      // Then: 切换成功，租户上下文不变
      expect(response.status).toBe(200);
      expect(response.body.activeOrganizationId).toBe("org-2");
      // 注意：租户上下文仍然是最初的 tenantId
      expect(response.body.tenantId).toBe(tenant.id);
    });
  });
});
