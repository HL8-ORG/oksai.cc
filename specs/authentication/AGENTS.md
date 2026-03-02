# AGENTS.md — 认证系统

## 项目背景

基于 Better Auth 实现完整的认证系统，对齐 Cal.com 的认证功能，支持多种认证方式（邮箱密码、Magic Link、OAuth）、双因素认证（2FA/TOTP）、API Key 认证、SAML SSO 等企业级特性。

## 开始前

1. **阅读设计文档**
   - 阅读 `specs/authentication/design.md` 了解完整的技术设计、用户故事和 BDD 场景
   - 阅读 `specs/authentication/implementation.md` 了解当前实现进度
   - 阅读 `specs/authentication/decisions.md` 了解架构决策

2. **了解现有实现**
   - 查看 `libs/auth/nestjs-better-auth/src/` 了解 NestJS 集成
   - 查看 `libs/database/src/schema/` 了解数据库 Schema
   - 参考 Cal.com 认证实现：`/home/arligle/forks/cal.com/packages/features/auth/`

3. **学习 Better Auth**
   - [Better Auth 官方文档](https://www.better-auth.com)
   - [Better Auth GitHub](https://github.com/better-auth/better-auth)
   - 重点了解：Credentials Provider、Email Provider、OAuth Provider、Two-Factor Plugin

4. **准备开发环境**
   - 确保数据库已启动（`pnpm docker:up`）
   - 确保环境变量已配置（`.env`）
   - 确保依赖已安装（`pnpm install`）

## 开发工作流程

遵循 `specs/_templates/workflow.md` 中的标准流程：

1. **用户故事**：在 `design.md` 中定义用户故事（符合 INVEST 原则）
2. **BDD 场景**：编写验收场景（Given-When-Then）
3. **TDD 循环**：
   - 🔴 Red: 编写失败的测试
   - 🟢 Green: 最简实现
   - 🔵 Refactor: 优化代码
4. **代码实现**：按照 DDD 分层实现

### Phase 1: 核心认证（P0） - 已完成 ✅

**完成时间：** 2026-03-02

- ✅ Better Auth 核心配置
- ✅ 数据库 Schema 创建
- ✅ 邮件服务集成
- ✅ 邮箱密码注册/登录
- ✅ 邮箱验证
- ✅ 密码重置
- ✅ Magic Link 登录
- ✅ Google/GitHub OAuth 登录
- ✅ 前端登录/注册页面
- ✅ 集成测试（18 个测试用例，100% 通过）

### Phase 2: 高级特性（P1） - 进行中

**预计时间：** 2-3 周

**任务：**
1. 完善 2FA/TOTP 认证
2. 实现 API Key 认证
3. 实现自定义 Session 超时
4. 实现组织/团队管理

### Phase 3-4: 企业级功能和 Platform OAuth（P2-P3） - 计划中

详见 `design.md` 实现计划

## 代码模式

### Better Auth 配置模式

```typescript
// libs/auth/config/auth.config.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@oksai/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  // ... 其他配置
});
```

### NestJS 集成模式

```typescript
// apps/gateway/src/app.module.ts
import { AuthModule } from "@oksai/nestjs-better-auth";
import { auth } from "@oksai/auth/config";

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    // ...
  ],
})
export class AppModule {}
```

### Drizzle Schema 扩展模式

```typescript
// libs/database/src/schema/auth.schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  // Better Auth 核心字段
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // 自定义扩展字段
  username: text("username").unique(),
  locale: text("locale").default("zh-CN"),
  timezone: text("timezone").default("Asia/Shanghai"),
  role: text("role").default("user").notNull(),
  locked: boolean("locked").default(false),
});
```

### API 路由模式

```typescript
// apps/gateway/src/modules/auth/auth.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AllowAnonymous } from "@oksai/nestjs-better-auth";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in/email")
  @AllowAnonymous()
  async signInWithEmail(@Body() body: SignInDto) {
    return this.authService.signInWithEmail(body);
  }
}
```

### 前端集成模式

```typescript
// apps/web-admin/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

### 领域层测试模式

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  describe('signIn', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange - 准备测试数据
      const dto = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };
      
      // Act - 执行操作
      const result = await authService.signIn(dto);
      
      // Assert - 验证结果
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
    });
  });
});
```

### 应用层测试模式

```typescript
// auth.integration.spec.ts
describe('Auth Integration', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = module.createNestApplication();
    authService = module.get(AuthService);
    await app.init();
  });

  it('should complete full auth flow', async () => {
    // 注册
    await authService.signUp({ email, password, name });
    
    // 验证邮箱
    await authService.verifyEmail({ token });
    
    // 登录
    const result = await authService.signIn({ email, password });
    
    expect(result.user.email).toBe(email);
  });
});
```

## 不要做

### 不要偏离技术规格

- ❌ 不要添加 `design.md` 之外的功能
- ❌ 不要使用 NextAuth.js（我们使用 Better Auth）
- ❌ 不要使用 Prisma（我们使用 Drizzle ORM）
- ❌ 不要跳过单元测试和集成测试

### 不要破坏现有集成

- ❌ 不要修改 `libs/auth/nestjs-better-auth/` 的核心逻辑
- ❌ 不要破坏与 Better Auth 插件的兼容性
- ❌ 不要引入与现有 Schema 冲突的表结构

### 不要忽视安全性

- ❌ 不要明文存储密码或 API Key
- ❌ 不要在日志中输出敏感信息
- ❌ 不要跳过输入验证
- ❌ 不要使用弱加密算法

### 不要跳过文档

- ❌ 不要省略 TSDoc 注释（公共 API 必须有文档）
- ❌ 不要忘记更新 `implementation.md` 的进度
- ❌ 不要忘记在 `decisions.md` 记录重要决策

## 测试策略

### 单元测试（70%）
- 领域层：聚合根、实体、值对象
- 应用层：Command Handler、Query Handler
- 测试命名：`should {behavior} when {condition}`

**重点测试：**
- Email 值对象验证
- Password 值对象加密验证
- User 实体创建和验证
- Auth Service 方法

### 集成测试（20%）
- 基础设施层：Repository 实现
- 应用层：多个组件协作

**重点测试：**
- 完整登录流程
- OAuth 登录流程
- Magic Link 流程
- 2FA 启用/验证流程
- API Key 创建/使用/撤销

### E2E 测试（10%）
- 关键业务流程
- API 端到端验证

**重点测试：**
- 用户注册到登录完整流程
- 2FA 启用到验证流程
- API Key 使用流程

**测试命令：**
```bash
# 运行单元测试
pnpm vitest run libs/auth/src/**/*.spec.ts

# 运行集成测试
pnpm vitest run apps/gateway/src/**/*.integration.spec.ts

# 运行所有测试
pnpm test

# 运行测试并生成覆盖率
pnpm vitest run --coverage
```

## 常见问题

### Q: 如何确定何时编写测试？

**A:** 遵循 TDD 原则，先写失败的测试（Red），再写最简代码（Green），最后优化（Refactor）。

### Q: 测试应该覆盖哪些场景？

**A:** 参考 BDD 场景文件（`design.md` 中的场景设计），至少覆盖：
- 正常流程（Happy Path）
- 异常流程（Error Cases）
- 边界条件（Edge Cases）

### Q: 如何保证代码质量？

**A:** 
1. 所有公共 API 都有 TSDoc 注释
2. 测试覆盖率 > 80%
3. 遵循项目代码规范（Biome）
4. 代码 Review 通过

### Q: 如何添加新的 OAuth Provider？

**A:** 参考 Google OAuth 的实现：

1. 在 `libs/auth/config/providers/oauth.providers.ts` 添加配置
2. 在 Better Auth 配置中注册 Provider
3. 创建回调路由
4. 测试 OAuth 流程

### Q: 如何自定义用户字段？

**A:** 在 `libs/database/src/schema/auth.schema.ts` 扩展 `users` 表：

```typescript
export const users = pgTable("user", {
  // ... Better Auth 核心字段
  customField: text("custom_field"),
});
```

然后生成迁移：

```bash
pnpm db:generate
pnpm db:migrate
```

### Q: 如何集成 2FA？

**A:** 使用 Better Auth Two-Factor Plugin：

1. 在 `auth.config.ts` 中启用插件
2. 创建 2FA 相关 API
3. 前端集成 2FA UI

### Q: 如何调试认证问题？

**A:**

1. 启用 Better Auth 日志（设置 `logger.level: "debug"`）
2. 检查数据库中的 session 和 user 表
3. 使用浏览器开发者工具查看 Cookie 和 Network 请求
4. 参考 Cal.com 的实现进行对比

## 参考资源

- [Better Auth 官方文档](https://www.better-auth.com)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Cal.com 认证实现](/home/arligle/forks/cal.com/packages/features/auth/)
- [NestJS 认证文档](https://docs.nestjs.com/security/authentication)
- [Drizzle ORM 文档](https://orm.drizzle.team)
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [开发工作流程](../_templates/workflow.md)
