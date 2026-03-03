# 认证系统测试计划

## 测试策略

遵循测试金字塔：单元测试 70% | 集成测试 20% | E2E 测试 10%

---

## 单元测试（70%）

### 领域层

| 组件 | 测试文件 | 测试用例 | 状态 |
|:---|:---|:---|:---:|
| AuthService | `auth.service.spec.ts` | 注册、登录、登出、邮箱验证 | ✅ |
| EmailService | `email.service.spec.ts` | 发送验证邮件、密码重置邮件 | ✅ |
| ApiKeyService | `api-key.service.spec.ts` | 创建、验证、撤销 API Key | ✅ |
| SessionService | `session.service.spec.ts` | Session 管理、超时配置 | ✅ |
| TwoFactorService | `two-factor.service.spec.ts` | 启用、验证、禁用 2FA | ✅ |
| OrganizationService | `organization.service.spec.ts` | 组织 CRUD、成员管理、邀请 | ⏳ |

### 应用层

| 组件 | 测试文件 | 测试用例 | 状态 |
|:---|:---|:---|:---:|
| AuthController | `auth.controller.spec.ts` | API 端点、参数验证 | ⏳ |
| ApiKeyController | `api-key.controller.spec.ts` | CRUD 操作 | ⏳ |
| SessionController | `session.controller.spec.ts` | Session 管理 API | ⏳ |
| TwoFactorController | `two-factor.controller.spec.ts` | 2FA 管理 API | ⏳ |

### 测试模式

```typescript
// AAA 模式
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
```

---

## 集成测试（20%）

| 组件 | 测试文件 | 测试内容 | 状态 |
|:---|:---|:---|:---:|
| AuthModule | `auth.integration.spec.ts` | 完整认证流程 | ✅ |
| Better Auth 集成 | `nestjs-better-auth.spec.ts` | NestJS + Better Auth | ✅ |
| OAuth 流程 | `oauth.integration.spec.ts` | Google/GitHub OAuth | ✅ |
| Magic Link 流程 | `magic-link.integration.spec.ts` | Magic Link 完整流程 | ✅ |
| 2FA 流程 | `two-factor.integration.spec.ts` | 2FA 启用/验证流程 | ⏳ |
| API Key 流程 | `api-key.integration.spec.ts` | API Key 创建/使用/撤销 | ✅ |
| Session 管理 | `session.integration.spec.ts` | Session 超时和撤销 | ⏳ |

---

## E2E 测试（10%）

| 场景 | 测试文件 | 测试内容 | 状态 |
|:---|:---|:---|:---:|
| 用户注册到登录 | `auth.e2e-spec.ts` | 完整认证流程 | ⏳ |
| 2FA 启用到验证 | `two-factor.e2e-spec.ts` | 2FA 完整流程 | ⏳ |
| API Key 使用流程 | `api-key.e2e-spec.ts` | API Key 认证流程 | ⏳ |
| 密码重置流程 | `password-reset.e2e-spec.ts` | 密码重置完整流程 | ⏳ |

---

## BDD 场景

| 场景类型 | Feature 文件 | 步骤定义 | 状态 |
|:---|:---|:---|:---:|
| Happy Path | `features/auth.feature` | `auth.steps.ts` | ⏳ |
| Error Cases | 同上 | 同上 | ⏳ |
| Edge Cases | 同上 | 同上 | ⏳ |

**BDD 场景示例：**
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

---

## 测试覆盖率目标

| 层级 | 目标 | 实际 | 状态 |
|:---|:---:|:---:|:---:|
| 领域层 | >90% | 67.5% | ⏳ |
| 应用层 | >85% | 60% | ⏳ |
| 总体 | >80% | 67.5% | ⏳ |

**Phase 1 完成状态：**
- ✅ 核心认证流程测试通过（18/18）
- ✅ API Key 认证测试通过
- ⏳ Session 管理测试待完善
- ⏳ 2FA 测试待完善

---

## 测试命令

```bash
# 运行单元测试
pnpm vitest run libs/auth/src/**/*.spec.ts

# 运行集成测试
pnpm vitest run apps/gateway/src/**/*.integration.spec.ts

# 运行 E2E 测试
pnpm vitest run e2e/**/*.spec.ts

# 运行覆盖率
pnpm vitest run --coverage

# 监听模式
pnpm vitest watch

# 运行所有测试
pnpm test
```

---

## 测试数据 Fixtures

创建测试数据工厂：

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

// api-key.fixture.ts
export class ApiKeyFixture {
  static createDefault(overrides?: Partial<ApiKeyProps>): ApiKey {
    return {
      id: 'test-api-key-id',
      name: 'Test API Key',
      prefix: 'oks_test',
      userId: 'test-user-id',
      ...overrides,
    };
  }
}
```

---

## Mock 策略

| 依赖 | Mock 方式 | 说明 |
|:---|:---|:---|
| Better Auth Client | `vi.fn()` | Mock Better Auth API 调用 |
| EmailService | `MockEmailService` | 内存实现，记录发送的邮件 |
| Database | 测试数据库 | 使用独立的测试数据库 |
| OAuth Provider | Mock OAuth | 模拟 OAuth 授权流程 |

```typescript
// Mock Better Auth 示例
const mockAuthClient = {
  signIn: {
    email: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
};

// Mock EmailService 示例
class MockEmailService {
  sentEmails: Email[] = [];

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.sentEmails.push({ to, token, type: 'verification' });
  }
}
```

---

## 测试环境配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

---

## 测试场景覆盖清单

### 认证流程

- [x] 邮箱密码注册
- [x] 邮箱密码登录
- [x] 邮箱验证
- [x] 密码重置
- [x] Magic Link 登录
- [x] Google OAuth 登录
- [x] GitHub OAuth 登录
- [x] 登出

### 2FA 流程

- [ ] 启用 2FA
- [ ] 验证 2FA 验证码
- [ ] 使用备用码
- [ ] 禁用 2FA

### API Key 流程

- [x] 创建 API Key
- [x] 使用 API Key 认证
- [x] 撤销 API Key
- [x] 列出 API Keys

### Session 管理

- [x] 获取活跃 Session 列表
- [x] 撤销指定 Session
- [x] 撤销其他 Session
- [x] 更新 Session 超时配置

### 边界情况

- [x] 邮箱已存在
- [x] 密码错误
- [x] 邮箱未验证
- [ ] 2FA 验证码错误
- [x] API Key 过期
- [ ] Session 过期

---

## 参考资料

- [测试指南](../../specs-testing/README.md)
- [单元测试最佳实践](../../specs-testing/02-unit-testing.md)
- [Mock 与 Stub 指南](../../specs-testing/07-mocking-guide.md)
- [BDD 测试方法](../../specs-testing/03-bdd-testing.md)
