# 认证系统提示词

---

## 开发流程

### 同步实现状态

审查 `authentication` 已实现内容，并更新 `specs/authentication/implementation.md`。

**检查要点：**
- 已完成的认证功能（邮箱密码、OAuth、Magic Link 等）
- 数据库 Schema 创建情况
- API 路由实现情况
- 前端页面完成情况
- 测试覆盖率
- BDD 场景进度
- TDD 循环进度

---

### 开始开发新功能

按照工作流程开发 `authentication`：

1. **用户故事**：在 `specs/authentication/design.md` 中定义用户故事（使用 INVEST 原则）
2. **BDD 场景**：在 `features/authentication.feature` 中编写验收场景
3. **TDD 循环**：
   - 🔴 Red: 编写失败的单元测试
   - 🟢 Green: 用最简代码让测试通过
   - 🔵 Refactor: 优化代码结构
4. **代码实现**：按照 DDD 分层实现功能

详见 `specs/_templates/workflow.md`。

---

### 继续开发功能

继续处理 `authentication`。请先阅读 `specs/authentication/implementation.md` 了解当前状态。

**当前状态：** Phase 2 任务 3 完成（95%），准备开始组织/团队管理

**下一步任务：**
- 完善测试覆盖率（提升到 80%+）
- 实现组织/团队管理
- Session 配置的单元测试和集成测试

---

## 测试相关

### 生成测试

为认证系统的 `{component}` 编写测试，遵循现有测试模式（使用 Vitest）。

**测试模式：**
```bash
# 单元测试
pnpm vitest run libs/auth/src/**/*.spec.ts

# 集成测试
pnpm vitest run apps/gateway/src/**/*.integration.spec.ts

# E2E 测试
pnpm vitest run e2e/**/*.spec.ts
```

**测试覆盖：**
- 正常流程（Happy Path）
- 异常流程（Error Cases）
- 边界条件（Edge Cases）

### 生成测试 Fixture

为认证系统创建测试数据工厂：

1. 创建 `auth.fixture.ts`
2. 实现 `createDefaultUser()` 方法
3. 实现 `createInvalidUser()` 方法
4. 实现 `createUserWithOverrides()` 方法

**示例：**
```typescript
// auth.fixture.ts
export class AuthFixture {
  static createDefaultUser(overrides?: Partial<UserProps>): User {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      role: 'user',
      ...overrides,
    };
  }

  static createInvalidUser(): CreateUserProps {
    return {
      email: 'invalid-email',
      password: '123', // 故意设置为无效值
    };
  }
}
```

### 生成 Mock 对象

为认证系统依赖创建 Mock 实现：

| 依赖 | Mock 方式 | 说明 |
|:---|:---|:---|
| Better Auth Client | `vi.fn()` | Mock Better Auth API 调用 |
| EmailService | `MockEmailService` | 内存实现，记录发送的邮件 |
| Database | 测试数据库 | 使用独立的测试数据库 |
| OAuth Provider | Mock OAuth | 模拟 OAuth 授权流程 |

**示例：**
```typescript
// Mock Better Auth
const mockAuthClient = {
  signIn: {
    email: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
};
```

### 运行测试检查

检查 `authentication` 的测试状态：

1. 运行单元测试：`pnpm vitest run`
2. 检查覆盖率：`pnpm vitest run --coverage`
3. 更新 `implementation.md` 中的覆盖率数据
4. 更新 BDD 场景和 TDD 循环进度

### TDD 开发

使用 TDD 方式开发认证系统组件：

1. 🔴 **Red**: 先编写失败的单元测试
2. 🟢 **Green**: 用最简单的方式让测试通过
3. 🔵 **Refactor**: 优化代码，保持测试通过

**示例：**
```typescript
// 🔴 Red
describe('AuthService', () => {
  describe('signIn', () => {
    it('should authenticate user with valid credentials', async () => {
      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'SecurePass123',
      });
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
    });
  });
});

// 🟢 Green
async signIn(dto: SignInDto) {
  // 最简实现
  return this.authClient.signIn.email(dto);
}

// 🔵 Refactor
// 优化错误处理、添加日志、提取验证逻辑
```

---

## BDD 相关

### 生成 BDD 场景

为 `authentication` 编写 BDD 场景：

1. 分析 `specs/authentication/design.md` 中的用户故事
2. 识别正常流程（Happy Path）
3. 识别异常流程（Error Cases）
4. 识别边界条件（Edge Cases）
5. 编写 `features/authentication.feature` 文件

**场景示例：**
```gherkin
Feature: 用户认证

  @happy-path
  Scenario: 用户通过邮箱密码登录
    Given 用户已注册且邮箱已验证
    When 用户输入邮箱 "test@example.com" 和密码 "SecurePass123"
    Then 系统验证凭据成功
    And 用户获得 Session Token

  @validation
  Scenario: 邮箱未验证登录失败
    Given 用户已注册但邮箱未验证
    When 用户尝试登录
    Then 系统拒绝登录
    And 用户看到"请先验证邮箱"错误提示
```

### 实现 BDD 步骤定义

为 `authentication.feature` 实现步骤定义：

1. 创建 `features/step-definitions/auth.steps.ts`
2. 实现 Given 步骤
3. 实现 When 步骤
4. 实现 Then 步骤

---

## 代码审查

### 代码审查

从以下角度审查认证系统改动：

1. **类型安全**：所有 API 都有完整的 TypeScript 类型定义
2. **错误处理**：认证失败有明确的错误提示
3. **安全性**：密码、API Key 等敏感信息加密存储
4. **边界情况**：处理邮箱未验证、账户锁定、2FA 错误等场景

**审查清单：**
- [ ] 敏感信息是否加密存储
- [ ] 是否有输入验证
- [ ] 错误信息是否清晰
- [ ] 是否有足够的日志记录
- [ ] 是否有相应的测试

### 测试审查

审查 `authentication` 的测试质量：

- [ ] 测试命名清晰（`should {behavior} when {condition}`）
- [ ] 使用 AAA 模式（Arrange-Act-Assert）
- [ ] 覆盖正常流程、异常流程、边界条件
- [ ] Mock 使用正确
- [ ] 测试独立、可重复执行
- [ ] 测试覆盖率达标（领域层 >90%，总体 >80%）

---

## 特定功能实现

### 实现 OAuth Provider

实现新的 OAuth Provider（如 Microsoft、Apple）：

**实现步骤：**
1. 在 `libs/auth/config/providers/oauth.providers.ts` 添加配置
2. 在 Better Auth 配置中注册 Provider
3. 创建回调路由（Better Auth 自动处理）
4. 测试 OAuth 流程

**参考实现：**
- Google OAuth: `libs/auth/config/src/auth.config.ts`
- Cal.com 参考: `/home/arligle/forks/cal.com/packages/features/auth/lib/next-auth-options.ts`

### 实现 2FA 功能

实现双因素认证（2FA/TOTP）功能：

**实现步骤：**
1. 启用 Better Auth Two-Factor Plugin
2. 创建 2FA 设置 API (`/api/auth/2fa/enable`)
3. 创建 2FA 验证 API (`/api/auth/2fa/verify`)
4. 生成 QR Code（qrcode 库）
5. 实现备用码生成和使用
6. 编写单元测试和集成测试

**参考实现：**
- Cal.com: `/home/arligle/forks/cal.com/apps/web/app/api/auth/two-factor/totp/`

### 实现 API Key 认证

实现 API Key 认证功能：

**实现步骤：**
1. 创建 API Key Schema（api_keys 表）
2. 实现 API Key Strategy（passport-headerapikey）
3. 实现 API Key Guard（NestJS）
4. 创建 API Key 管理 API（创建、撤销、列表）
5. 编写单元测试和集成测试

**参考实现：**
- Cal.com: `/home/arligle/forks/cal.com/apps/api/v2/src/modules/auth/strategies/api-auth/`

---

## 文档相关

### 生成带截图的文档

为 `authentication` 生成带截图的文档：

1. 启动应用（`pnpm dev`）
2. 打开浏览器到登录页面（http://localhost:3000/login）
3. 对关键 UI 状态截图：
   - 登录页面
   - 注册页面
   - 邮箱验证页面
   - 密码重置页面
   - 2FA 设置页面
   - API Key 管理页面
4. 将截图保存到 `specs/authentication/docs/screenshots/`
5. 创建/更新 `specs/authentication/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

### 提升文档为公开版本

将内部文档提升为公开的 Mintlify 文档：

1. 审阅 `specs/authentication/docs/README.md`
2. 复制/改写内容到 `docs/authentication.mdx`
3. 将截图移动到 `docs/images/authentication/`
4. 更新 `docs/mint.json` 导航
5. 确保文案适合客户阅读（不含内部细节）

---

## 检查清单

### 验证工作流程完成度

检查 `authentication` 是否完成所有开发步骤：

- [x] 用户故事已定义（符合 INVEST 原则）
- [x] BDD 场景已编写
- [x] TDD 循环已完成（Red-Green-Refactor）
- [x] 单元测试覆盖率 > 80%（Phase 1）
- [x] 集成测试已编写
- [ ] 代码已 Review（待 Phase 2）
- [ ] 文档已生成（待完成）

### 发布前检查

检查 `authentication` 是否可以发布：

- [x] 所有测试通过
- [ ] 覆盖率达标（领域层 >90%，总体 >80%）
- [ ] 无 TypeScript 错误
- [ ] 无 Lint 错误
- [ ] 文档已更新
- [ ] CHANGELOG 已更新

---

## 特定场景提示词

### 对比 Cal.com 认证实现

对比 oksai.cc 和 Cal.com 的认证实现，找出差异和改进点：

**对比要点：**
1. 认证框架：Better Auth vs NextAuth.js
2. Session 管理：JWT vs Database
3. 2FA 实现：Better Auth Plugin vs 自定义实现
4. SAML SSO：BoxyHQ Jackson（两者一致）
5. API Key：Passport Strategy vs 自定义 Guard

**参考路径：**
- Cal.com: `/home/arligle/forks/cal.com/packages/features/auth/`
- oksai.cc: `specs/authentication/design.md`

### 安全审计

对认证系统进行安全审计：

**审计要点：**
1. 密码存储：是否使用 bcryptjs 加密
2. Session 安全：JWT 签名验证、HttpOnly Cookie
3. 2FA 安全：TOTP Secret 加密存储
4. API Key 安全：SHA256 hash、前缀识别
5. CORS 和 CSRF：严格的 CORS 配置
6. 输入验证：所有输入都有验证
7. 日志记录：不记录敏感信息

**参考：**
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### 性能优化

优化认证系统性能：

**优化要点：**
1. Session 缓存：使用 LRU Cache 缓存 Session
2. 数据库查询：优化查询，添加索引
3. API Key 查询：使用 prefix 快速定位
4. JWT 验证：缓存公钥验证结果
5. 并发登录控制：使用 Redis 存储 Session 状态

### 故障排除

认证系统常见问题排查：

#### 问题 1：登录失败，提示"邮箱或密码错误"

**排查步骤：**
1. 检查数据库中是否存在该用户
2. 检查用户邮箱是否已验证
3. 检查密码加密是否正确
4. 查看 Better Auth 日志（设置 `logger.level: "debug"`）

#### 问题 2：OAuth 登录失败

**排查步骤：**
1. 检查 OAuth Provider 配置（Client ID、Secret）
2. 检查回调 URL 是否正确
3. 查看 OAuth Provider 的错误响应
4. 检查环境变量配置

#### 问题 3：Session 过期过快

**排查步骤：**
1. 检查 Session 配置（expiresIn）
2. 检查 Cookie 配置（maxAge）
3. 检查时区设置
4. 查看数据库中的 session 表

---

**文档版本：** 3.0.0  
**最后更新：** 2026年3月3日
