# 认证系统重构计划 - 使用 Better Auth 插件生态

> **目标**：移除重复的自定义 API，尽可能使用 Better Auth 插件生态

## 一、当前架构分析

### 1.1 Better Auth 已配置的插件

```typescript
// apps/gateway/src/auth/auth.config.ts
plugins: [
  apiKey(), // ✅ API Key 认证
  admin(), // ✅ 用户管理、角色权限
  organization(), // ✅ 组织/团队管理
  twoFactor(), // ✅ 双因素认证
];
```

### 1.2 当前控制器清单

| 控制器                   | 路由前缀         | 状态          | 分析                                     |
| ------------------------ | ---------------- | ------------- | ---------------------------------------- |
| `AuthController`         | `/auth`          | ❌ 已禁用     | ✅ 正确：与 Better Auth 原生 API 冲突    |
| `AdminController`        | `/admin`         | 🟡 保留       | Better Auth Admin 插件包装器             |
| `ApiKeyController`       | `/api-keys`      | 🟡 保留       | Better Auth API Key 插件包装器           |
| `OrganizationController` | `/organizations` | 🟡 保留       | Better Auth Organization 插件包装器      |
| `SessionController`      | `/sessions`      | 🔴 **应移除** | Better Auth 原生支持会话管理             |
| `UserController`         | `/users`         | 🔴 **应移除** | Better Auth 原生支持用户信息             |
| `WebhookController`      | `/webhooks`      | 🟢 业务特定   | 需要保留：自定义 Webhook 功能            |
| `OAuthController`        | `/auth/oauth`    | 🔴 **应移除** | Better Auth 原生支持 OAuth               |
| `OAuthV2Controller`      | `/oauth`         | 🔴 **应移除** | Better Auth 提供 OAuth 2.1 Provider 插件 |
| `OAuthClientController`  | `/oauth/clients` | 🟢 业务特定   | 需要保留：OAuth 客户端管理               |

## 二、Better Auth 插件能力对照

### 2.1 完全由 Better Auth 提供的功能（应移除自定义实现）

#### ✅ 会话管理

**Better Auth 原生支持**：

```typescript
// 前端直接调用
const session = await authClient.getSession();
await authClient.signOut();

// 后端 API（已自动提供）
GET / api / auth / session; // 获取当前会话
POST / api / auth / sign - out; // 登出
```

**建议**：移除 `SessionController`

---

#### ✅ 用户信息

**Better Auth 原生支持**：

```typescript
// 前端直接调用
const { user } = await authClient.useSession();

// 后端 API（已自动提供）
GET / api / auth / session; // 返回用户信息
```

**建议**：移除 `UserController`，如需公开用户信息，使用 Better Auth 的 `user` 字段

---

#### ✅ OAuth 社交登录

**Better Auth 原生支持**：

```typescript
// 前端直接调用
await authClient.signIn.social({
  provider: 'github',
  callbackURL: '/dashboard'
});

// 后端配置（auth.config.ts）
socialProviders: {
  github: { clientId, clientSecret },
  google: { clientId, clientSecret },
}
```

**建议**：移除 `OAuthController`，使用 Better Auth 原生 OAuth

---

### 2.2 Better Auth 插件提供的功能（保留包装器）

#### ✅ Admin 插件

**Better Auth 提供**：`admin()` 插件

**功能**：

- 用户管理（列表、创建、更新、删除）
- 角色权限（user/admin）
- 用户封禁/解封
- 会话管理
- 用户模拟（impersonate）

**当前实现**：`AdminController` 是 Better Auth API 的包装器

**建议**：

- 🟡 **保留** `AdminController`，但**简化**实现
- 确保所有功能都直接调用 Better Auth API
- 移除重复的业务逻辑

---

#### ✅ Organization 插件

**Better Auth 提供**：`organization()` 插件

**功能**：

- 组织创建/更新/删除
- 成员邀请/移除
- 角色管理（owner/admin/member/viewer）
- 设置活跃组织

**当前实现**：`OrganizationController` 是 Better Auth API 的包装器

**建议**：

- 🟡 **保留** `OrganizationController`，但**简化**实现
- 确保所有功能都直接调用 Better Auth API
- 移除重复的业务逻辑

---

#### ✅ API Key 插件

**Better Auth 提供**：`apiKey()` 插件

**功能**：

- API Key 创建/列表/删除
- 权限范围（scopes）
- 过期时间

**当前实现**：`ApiKeyController` 是 Better Auth API 的包装器

**建议**：

- 🟡 **保留** `ApiKeyController`，但**简化**实现
- 确保所有功能都直接调用 Better Auth API
- 移除重复的业务逻辑

---

### 2.3 业务特定功能（需要保留）

#### 🟢 Webhook 系统

**Better Auth 不提供**：需要自定义实现

**功能**：

- Webhook 创建/更新/删除
- 事件订阅
- 投递记录
- 重试机制

**建议**：

- ✅ **保留** `WebhookController`
- 使用 Better Auth 的 `hooks` 触发 Webhook

---

#### 🟢 OAuth 客户端管理

**Better Auth 提供**：`OAuth 2.1 Provider` 插件，但不包含客户端管理

**功能**：

- OAuth 客户端注册
- 客户端凭证管理
- 重定向 URI 配置

**建议**：

- ✅ **保留** `OAuthClientController`
- 使用 Better Auth 的 OAuth Provider 插件处理认证流程

---

## 三、重构计划

### Phase 1: 移除重复的控制器（优先级：高）

#### 1.1 移除 SessionController

```bash
# 文件
apps/gateway/src/auth/session.controller.ts
apps/gateway/src/auth/session.service.ts
apps/gateway/src/auth/dto/*session*.ts

# 使用 Better Auth 原生 API
GET /api/auth/session
POST /api/auth/sign-out
```

#### 1.2 移除 UserController

```bash
# 文件
apps/gateway/src/auth/user.controller.ts
apps/gateway/src/auth/dto/*user*.ts

# 使用 Better Auth 原生 API
GET /api/auth/session  # 返回用户信息
```

#### 1.3 移除 OAuthController

```bash
# 文件
apps/gateway/src/auth/oauth.controller.ts
apps/gateway/src/auth/oauth.service.ts

# 使用 Better Auth 原生 OAuth
POST /api/auth/sign-in/social
```

#### 1.4 移除 OAuthV2Controller

```bash
# 文件
apps/gateway/src/auth/oauth-v2.controller.ts

# 使用 Better Auth OAuth 2.1 Provider 插件
```

---

### Phase 2: 简化保留的控制器（优先级：中）

#### 2.1 简化 AdminController

**原则**：

- 直接调用 Better Auth API
- 移除重复的业务逻辑
- 只保留必要的验证和转换

```typescript
// ✅ 正确示例
@Get('users')
async listUsers(@Session() session: UserSession) {
  // 直接调用 Better Auth API
  return this.betterAuthApi.admin.listUsers({
    userId: session.user.id,
  });
}
```

#### 2.2 简化 OrganizationController

**原则**：

- 直接调用 Better Auth API
- 移除重复的业务逻辑

#### 2.3 简化 ApiKeyController

**原则**：

- 直接调用 Better Auth API
- 移除重复的业务逻辑

---

### Phase 3: 配置 Better Auth OAuth 2.1 Provider（优先级：中）

#### 3.1 启用 OAuth Provider 插件

```typescript
// apps/gateway/src/auth/auth.config.ts
import { oAuthProvider } from 'better-auth/plugins';

plugins: [
  // ... 其他插件
  oAuthProvider({
    // 配置 OAuth 2.1 Provider
  }),
];
```

#### 3.2 保留 OAuthClientController

- 用于管理 OAuth 客户端
- 与 Better Auth OAuth Provider 配合使用

---

## 四、重构后的架构

### 4.1 Better Auth 提供的功能（前端直接调用）

```typescript
// 前端使用 Better Auth 客户端
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
});

// ✅ 认证（原生）
await authClient.signUp.email({ email, password, name });
await authClient.signIn.email({ email, password });
await authClient.signIn.social({ provider: 'github' });
await authClient.signOut();

// ✅ 会话（原生）
const { data: session } = await authClient.useSession();

// ✅ OAuth（原生）
await authClient.signIn.social({ provider: 'github' });

// ✅ 2FA（twoFactor 插件）
await authClient.twoFactor.enable();
await authClient.twoFactor.verify();
```

### 4.2 Better Auth 插件提供的功能（包装器控制器）

```typescript
// ✅ Admin 功能（admin 插件）
AdminController -> Better Auth Admin API
- 用户管理
- 角色权限
- 用户封禁
- 会话管理

// ✅ Organization 功能（organization 插件）
OrganizationController -> Better Auth Organization API
- 组织管理
- 成员管理
- 角色管理

// ✅ API Key 功能（apiKey 插件）
ApiKeyController -> Better Auth API Key API
- API Key 管理
```

### 4.3 自定义业务功能（保留）

```typescript
// 🟢 Webhook 系统
WebhookController -> 自定义实现
- Webhook 管理
- 事件订阅

// 🟢 OAuth 客户端管理
OAuthClientController -> 自定义实现
- OAuth 客户端注册
- 凭证管理
```

---

## 五、前端迁移指南

### 5.1 认证功能

#### ❌ 旧方式（调用自定义 API）

```typescript
// ❌ 不要这样
await fetch('/api/auth/sign-in/email', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

#### ✅ 新方式（使用 Better Auth 客户端）

```typescript
// ✅ 应该这样
import { authClient } from '@/lib/auth-client';

const result = await authClient.signIn.email({
  email,
  password,
});

if (result.error) {
  console.error(result.error);
} else {
  // 登录成功
  console.log(result.data);
}
```

### 5.2 会话管理

#### ❌ 旧方式

```typescript
// ❌ 不要这样
const response = await fetch('/api/sessions');
const sessions = await response.json();
```

#### ✅ 新方式

```typescript
// ✅ 应该这样
import { authClient } from '@/lib/auth-client';

// 获取当前会话
const { data: session } = await authClient.useSession();

// 登出
await authClient.signOut();
```

### 5.3 OAuth 登录

#### ❌ 旧方式

```typescript
// ❌ 不要这样
window.location.href = '/api/auth/oauth/github';
```

#### ✅ 新方式

```typescript
// ✅ 应该这样
import { authClient } from '@/lib/auth-client';

await authClient.signIn.social({
  provider: 'github',
  callbackURL: '/dashboard',
});
```

---

## 六、实施步骤

### Step 1: 标记废弃的控制器（本周）

- [ ] 在 `auth.module.ts` 中注释掉要移除的控制器
- [ ] 添加 `@deprecated` 标记
- [ ] 更新文档

### Step 2: 更新前端代码（下周）

- [ ] 移除对废弃 API 的调用
- [ ] 改用 Better Auth 客户端
- [ ] 测试所有认证流程

### Step 3: 移除废弃代码（下下周）

- [ ] 删除废弃的控制器文件
- [ ] 删除相关的 Service 和 DTO
- [ ] 清理依赖

### Step 4: 简化保留的控制器（下下周）

- [ ] 简化 AdminController
- [ ] 简化 OrganizationController
- [ ] 简化 ApiKeyController

---

## 七、预期收益

### 7.1 代码质量

- ✅ 减少重复代码
- ✅ 降低维护成本
- ✅ 减少潜在 bug

### 7.2 功能完整性

- ✅ 自动获得 Better Auth 更新
- ✅ 更完整的错误处理
- ✅ 更好的类型支持

### 7.3 开发效率

- ✅ 前端开发更简单（直接使用 Better Auth 客户端）
- ✅ 后端开发更简单（直接调用 Better Auth API）
- ✅ 测试更简单（Better Auth 提供测试工具）

---

## 八、风险评估

### 8.1 潜在问题

- ⚠️ 前端需要迁移到 Better Auth 客户端
- ⚠️ 需要确保 Better Auth 插件满足所有需求
- ⚠️ 可能需要调整业务逻辑

### 8.2 缓解措施

- ✅ 逐步迁移，保持向后兼容
- ✅ 详细测试每个功能
- ✅ 保留必要的自定义功能

---

## 九、总结

**核心原则**：

1. **Better Auth 原生支持的，直接使用原生 API**
2. **Better Auth 插件提供的，使用插件 + 简单包装器**
3. **业务特定的，保留自定义实现**

**预期结果**：

- 移除 4 个重复的控制器
- 简化 3 个包装器控制器
- 保留 2 个业务特定的控制器
- 前端统一使用 Better Auth 客户端
