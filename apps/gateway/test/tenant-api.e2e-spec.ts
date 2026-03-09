/**
 * 租户管理 API E2E 测试
 *
 * 使用 MockAuthGuard 绕过 Better Auth 认证
 */

import { type EntityManager, MikroORM } from "@mikro-orm/core";
import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { Tenant, User } from "@oksai/iam-identity";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TestAppModule } from "./test-app.module.js";
import { MockAuthGuard } from "./utils/mock-auth.guard.js";
import {
  cleanupTestData,
  createMockSession,
  createTestSuperAdmin,
  createTestTenant,
} from "./utils/test-helpers.js";

describe("租户管理 API E2E 测试", () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let mockAuthGuard: MockAuthGuard;
  let superAdmin: User;
  let superAdminSession: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule], // 使用 TestAppModule
    }).compile();

    app = moduleFixture.createNestApplication();

    // 配置全局前缀和管道
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    orm = app.get(MikroORM);
    em = orm.em.fork();
    mockAuthGuard = app.get<MockAuthGuard>(MockAuthGuard);

    await app.init();
    await app.listen(0); // 监听随机端口
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  beforeEach(async () => {
    // 清理数据库
    await cleanupTestData(em);

    // 创建超级管理员用户
    superAdmin = await createTestSuperAdmin(em);

    // 创建 mock session
    superAdminSession = createMockSession(superAdmin);

    // 设置 mock session
    mockAuthGuard.setMockSession(superAdminSession);
  });

  describe("POST /api/admin/tenants - 创建租户", () => {
    it("应该成功创建租户", async () => {
      const response = await request(app.getHttpServer()).post("/api/admin/tenants").send({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "owner-1",
        maxMembers: 100,
        maxOrganizations: 10,
      });

      console.log("Response:", {
        status: response.status,
        body: response.body,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("租户创建成功");
      expect(response.body.tenant).toHaveProperty("id");
      expect(response.body.tenant.name).toBe("企业A");
      expect(response.body.tenant.slug).toBe("enterprise-a");
      expect(response.body.tenant.plan).toBe("PRO");
      expect(response.body.tenant.status).toBe("PENDING");
      expect(response.body.tenant.quota.maxMembers).toBe(100);
      expect(response.body.tenant.quota.maxOrganizations).toBe(10);
    });

    it("应该在 slug 重复时返回 400", async () => {
    // 创建第一个租户
    await createTestTenant(em, { slug: "duplicate-slug" });

    // 尝试创建相同 slug 的租户
    const response = await request(app.getHttpServer()).post("/api/admin/tenants").send({
      name: "企业B",
      slug: "duplicate-slug",
      plan: "PRO",
      ownerId: "owner-2",
    });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/admin/tenants - 列出租户", () => {
  it("应该返回所有租户列表", async () => {
    // 创建测试租户
    await createTestTenant(em, { name: "租户1", slug: "tenant-1" });
    await createTestTenant(em, { name: "租户2", slug: "tenant-2" });

    const response = await request(app.getHttpServer()).get("/api/admin/tenants");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.total).toBe(2);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
  });

  it("应该支持分页", async () => {
    // 创建 25 个租户
    for (let i = 0; i < 25; i++) {
      await createTestTenant(em, { name: `租户${i}`, slug: `tenant-${i}` });
    }

    const response = await request(app.getHttpServer())
      .get("/api/admin/tenants")
      .query({ page: 2, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.total).toBe(25);
    expect(response.body.page).toBe(2);
    expect(response.body.limit).toBe(10);
  });
});

describe("GET /api/admin/tenants/:id - 获取租户详情", () => {
  it("应该返回租户详情", async () => {
    const tenant = await createTestTenant(em, {
      name: "测试租户",
      slug: "test-tenant",
    });

    const response = await request(app.getHttpServer()).get(`/api/admin/tenants/${tenant.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(tenant.id);
    expect(response.body.name).toBe("测试租户");
    expect(response.body.slug).toBe("test-tenant");
    expect(response.body).toHaveProperty("usage");
  });

  it("应该在租户不存在时返回 404", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/admin/tenants/00000000-0000-0000-0000-000000000000"
    );

    expect(response.status).toBe(404);
  });
});

describe("POST /api/admin/tenants/:id/activate - 激活租户", () => {
  it("应该成功激活待审核的租户", async () => {
    const tenant = await createTestTenant(em, {
      name: "待激活租户",
      slug: "pending-tenant",
      status: "PENDING",
    });

    const response = await request(app.getHttpServer())
      .post(`/api/admin/tenants/${tenant.id}/activate`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("租户激活成功");
    expect(response.body.tenant.status).toBe("ACTIVE");

    // 验证数据库状态
    await em.refresh(tenant);
    expect(tenant.status).toBe("ACTIVE");
  });

  it("应该在租户状态不允许激活时返回 400", async () => {
    const tenant = await createTestTenant(em, {
      name: "已激活租户",
      slug: "active-tenant",
      status: "ACTIVE",
    });

    const response = await request(app.getHttpServer())
      .post(`/api/admin/tenants/${tenant.id}/activate`)
      .send();

    expect(response.status).toBe(400);
  });
});

describe("POST /api/admin/tenants/:id/suspend - 停用租户", () => {
  it("应该成功停用租户", async () => {
    const tenant = await createTestTenant(em, {
      name: "活跃租户",
      slug: "active-tenant",
      status: "ACTIVE",
    });

    const response = await request(app.getHttpServer())
      .post(`/api/admin/tenants/${tenant.id}/suspend`)
      .send({ reason: "违反服务条款" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("租户停用成功");
    expect(response.body.tenant.status).toBe("SUSPENDED");

    // 验证数据库状态
    await em.refresh(tenant);
    expect(tenant.status).toBe("SUSPENDED");
  });
});

describe("PUT /api/admin/tenants/:id - 更新租户", () => {
  it("应该成功更新租户信息", async () => {
    const tenant = await createTestTenant(em);

    const response = await request(app.getHttpServer()).put(`/api/admin/tenants/${tenant.id}`).send({
      name: "更新后的租户",
      maxMembers: 200,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("租户更新成功");
    expect(response.body.tenant.name).toBe("更新后的租户");
    expect(response.body.tenant.quota.maxMembers).toBe(200);
  });
});

describe("GET /api/admin/tenants/:id/usage - 获取租户使用情况", () => {
  it("应该返回租户配额和使用情况", async () => {
    const tenant = await createTestTenant(em);

    const response = await request(app.getHttpServer()).get(`/api/admin/tenants/${tenant.id}/usage`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("quota");
    expect(response.body).toHaveProperty("usage");
    expect(response.body).toHaveProperty("available");
    expect(response.body.quota.maxOrganizations).toBe(10);
    expect(response.body.quota.maxMembers).toBe(100);
    expect(response.body.usage.organizations).toBe(0);
    expect(response.body.usage.members).toBe(0);
  });
});

});
