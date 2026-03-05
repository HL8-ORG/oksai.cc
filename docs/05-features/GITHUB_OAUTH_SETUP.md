# GitHub OAuth 设置指南

## 📋 准备工作

在开始之前，确保你有一个 GitHub 账号。

## 🔧 步骤 1: 创建 GitHub OAuth App

### 1.1 访问 GitHub 开发者设置

1. 登录 GitHub
2. 点击右上角头像 → **Settings**
3. 左侧菜单最下方 → **Developer settings**
4. 点击 **OAuth Apps** → **New OAuth App**

或者直接访问：https://github.com/settings/developers

### 1.2 填写应用信息

| 字段                           | 值                                               |
| ------------------------------ | ------------------------------------------------ |
| **Application name**           | `Oksai Development` （或你的应用名）             |
| **Homepage URL**               | `http://localhost:3000`                          |
| **Application description**    | （可选）`Oksai 本地开发环境`                     |
| **Authorization callback URL** | `http://localhost:3000/api/auth/callback/github` |

⚠️ **重要**：回调 URL 必须完全匹配，包括 `/api/auth/callback/github` 路径

### 1.3 获取凭据

创建完成后，你将看到：

- **Client ID**：类似 `Iv1.abc123def456`
- **Client secrets**：点击 "Generate a new client secret" 生成

## 🔐 步骤 2: 配置环境变量

### 2.1 更新 `.env` 文件

```env
# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 2.2 重启应用

```bash
# 停止当前服务（Ctrl+C）
# 重新启动
pnpm dev
```

## 🎯 步骤 3: 测试 OAuth 登录

### 方式 1: 使用登录页面（推荐）

1. 访问：http://localhost:3000/login.html
2. 点击 **"使用 GitHub 登录"** 按钮
3. 授权应用访问你的 GitHub 账号
4. 自动跳转回应用并登录成功

### 方式 2: 直接调用 API

```bash
# 发起 GitHub OAuth 登录
curl -X POST http://localhost:3000/api/auth/sign-in/social \
  -H "Content-Type: application/json" \
  -d '{"provider":"github"}'

# 响应会包含一个 URL，访问该 URL 进行授权
# {"url":"https://github.com/login/oauth/authorize?..."}
```

### 方式 3: 使用测试脚本

```bash
tsx apps/gateway/test-oauth.ts
```

## 📊 OAuth 流程说明

```
用户点击登录
    ↓
前端调用 POST /api/auth/sign-in/social
    ↓
Better Auth 生成授权 URL
    ↓
用户跳转到 GitHub 授权页面
    ↓
用户同意授权
    ↓
GitHub 回调 /api/auth/callback/github?code=xxx
    ↓
Better Auth 使用 code 换取 access_token
    ↓
Better Auth 获取用户信息
    ↓
创建/更新用户和会话
    ↓
设置会话 Cookie
    ↓
重定向回应用首页
```

## 🗄️ 数据库存储

OAuth 登录成功后，数据会存储在以下表中：

### `users` 表

- 存储用户基本信息（email, name, image）
- `emailVerified` 会自动设置为当前时间

### `accounts` 表

- 存储第三方账号关联信息
- `provider`: "github"
- `providerAccountId`: GitHub 用户 ID
- `accessToken`: GitHub 访问令牌
- `refreshToken`: null（GitHub 不提供 refresh token）

### `sessions` 表

- 存储会话信息
- 用于保持用户登录状态

## 🔍 常见问题

### Q1: 提示 "email_not_found" 错误

**原因**：GitHub OAuth App 没有权限读取用户邮箱

**解决方案**：

1. 如果使用 **OAuth Apps**：无需特殊配置
2. 如果使用 **GitHub Apps**：
   - 进入应用设置 → Permissions and Events
   - Account Permissions → Email Addresses
   - 选择 "Read-Only"
   - Save changes

### Q2: 回调 URL 不匹配

**错误信息**：`redirect_uri_mismatch`

**解决方案**：

1. 检查 GitHub OAuth App 中的回调 URL
2. 确保与 `.env` 中的 `BETTER_AUTH_URL` 一致
3. 回调 URL 格式：`{BETTER_AUTH_URL}/api/auth/callback/github`

### Q3: Client ID 或 Secret 无效

**错误信息**：`invalid_client`

**解决方案**：

1. 复制 Client ID 和 Secret 时注意不要有空格
2. 重新生成 Client Secret
3. 重启应用使环境变量生效

### Q4: 跨域 (CORS) 错误

**解决方案**：

1. 确保 `.env` 中 `CORS_ORIGIN` 设置正确
2. 不要在 `main.ts` 中手动配置 CORS
3. Better Auth 会自动处理 CORS

## 🔒 安全最佳实践

### 开发环境

- ✅ 使用 `http://localhost:3000`
- ✅ 回调 URL 使用 localhost
- ✅ 不要提交 `.env` 文件到 Git

### 生产环境

创建新的 OAuth App 用于生产：

| 字段         | 值                                                |
| ------------ | ------------------------------------------------- |
| Homepage URL | `https://yourdomain.com`                          |
| Callback URL | `https://yourdomain.com/api/auth/callback/github` |

环境变量：

```env
BETTER_AUTH_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
GITHUB_CLIENT_ID=<生产环境 Client ID>
GITHUB_CLIENT_SECRET=<生产环境 Client Secret>
```

## 🎨 自定义 OAuth 登录

### 自定义授权范围

默认情况下，Better Auth 请求以下权限：

- `user:email` - 读取用户邮箱

如需更多权限，可以在 `auth.config.ts` 中配置：

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    // 自定义授权范围
    scope: ['user:email', 'read:user', 'repo'],
  },
}
```

### 多账号关联

Better Auth 自动处理多账号关联：

- 如果邮箱已存在，自动关联到现有账号
- 支持一个用户多个 OAuth 提供商

## 📚 相关资源

- [Better Auth GitHub 文档](https://better-auth.com/docs/authentication/github)
- [GitHub OAuth Apps 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub Apps vs OAuth Apps](https://docs.github.com/en/developers/apps/differences-between-apps)

## ✅ 验证清单

完成以下步骤后，GitHub OAuth 应该可以正常工作：

- [ ] 创建 GitHub OAuth App
- [ ] 配置正确的回调 URL
- [ ] 复制 Client ID 和 Secret 到 `.env`
- [ ] 重启应用
- [ ] 访问登录页面
- [ ] 点击 GitHub 登录按钮
- [ ] 完成 GitHub 授权
- [ ] 成功跳转回应用并显示用户信息

## 🚀 下一步

- [配置 Google OAuth](./GOOGLE_OAUTH_SETUP.md)
- [添加更多 OAuth 提供商](https://better-auth.com/docs/authentication/social)
- [自定义登录页面样式](../apps/gateway/public/login.html)
- [实现用户资料管理](../docs/USER_PROFILE.md)
