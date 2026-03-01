# Google OAuth 设置指南

## 📋 准备工作

在开始之前，你需要：

1. 一个 Google 账号
2. 访问 Google Cloud Console

## 🔧 步骤 1: 创建 Google Cloud 项目

### 1.1 访问 Google Cloud Console

访问：https://console.cloud.google.com/

### 1.2 创建新项目

1. 点击顶部导航栏的项目选择器
2. 点击 **"新建项目"**
3. 填写项目信息：
   - **项目名称**：`Oksai Development`
   - **组织**：（可选）
4. 点击 **"创建"**

## 🔐 步骤 2: 配置 OAuth 同意屏幕

### 2.1 导航到 OAuth 配置

1. 在左侧菜单中，选择 **"API 和服务"** → **"OAuth 同意屏幕"**
2. 选择用户类型：
   - **外部**（适合测试，任何人都可以登录）
   - **内部**（仅限组织内部，需要 G Suite 账号）
3. 点击 **"创建"**

### 2.2 填写应用信息

#### 第 1 步：OAuth 同意屏幕

| 字段                     | 值          |
| ------------------------ | ----------- |
| **应用名称**             | `Oksai`     |
| **用户支持电子邮件地址** | 你的邮箱    |
| **应用徽标**             | （可选）    |
| **应用网域**             | （可选）    |
| **已授权网域**           | `localhost` |
| **开发者联系信息**       | 你的邮箱    |

#### 第 2 步：作用域

1. 点击 **"添加或移除作用域"**
2. 添加以下作用域：
   - `.../auth/userinfo.email` - 查看你的电子邮件地址
   - `.../auth/userinfo.profile` - 查看你的个人资料信息
3. 点击 **"更新"**
4. 点击 **"保存并继续"**

#### 第 3 步：测试用户（仅限外部模式）

1. 点击 **"添加用户"**
2. 添加你的 Gmail 地址
3. 点击 **"添加"**
4. 点击 **"保存并继续"**

#### 第 4 步：摘要

检查信息，点击 **"返回信息中心"**

## 🎯 步骤 3: 创建 OAuth 2.0 凭据

### 3.1 创建凭据

1. 在左侧菜单中，选择 **"API 和服务"** → **"凭据"**
2. 点击顶部的 **"创建凭据"** → **"OAuth 客户端 ID"**

### 3.2 配置 OAuth 客户端

| 字段         | 值                 |
| ------------ | ------------------ |
| **应用类型** | `Web 应用`         |
| **名称**     | `Oksai Web Client` |

#### 已授权的 JavaScript 来源

```
http://localhost:3000
```

#### 已授权的重定向 URI

```
http://localhost:3000/api/auth/callback/google
```

⚠️ **重要**：URI 必须完全匹配，包括协议和路径

### 3.3 获取凭据

创建完成后，你会看到：

- **您的客户端 ID**：类似 `123456789-abcdefg.apps.googleusercontent.com`
- **您的客户端密钥**：类似 `GOCSPX-xxxxxxxxxxxxx`

## ⚙️ 步骤 4: 配置环境变量

### 4.1 更新 `.env` 文件

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

### 4.2 重启应用

```bash
# 停止当前服务（Ctrl+C）
# 重新启动
pnpm dev
```

## 🧪 步骤 5: 测试 Google OAuth

### 方式 1: 使用登录页面

1. 访问：http://localhost:3000/login.html
2. 点击 **"使用 Google 登录"** 按钮
3. 选择你的 Google 账号
4. 授权应用访问你的信息
5. 自动跳转回应用并登录成功

### 方式 2: 直接调用 API

```bash
# 发起 Google OAuth 登录
curl -X POST http://localhost:3000/api/auth/sign-in/social \
  -H "Content-Type: application/json" \
  -d '{"provider":"google"}'

# 响应会包含一个 URL，访问该 URL 进行授权
# {"url":"https://accounts.google.com/o/oauth2/v2/auth?..."}
```

## 📊 OAuth 流程说明

```
用户点击登录
    ↓
前端调用 POST /api/auth/sign-in/social
    ↓
Better Auth 生成 Google 授权 URL
    ↓
用户跳转到 Google 登录页面
    ↓
用户选择账号并授权
    ↓
Google 回调 /api/auth/callback/google?code=xxx
    ↓
Better Auth 使用 code 换取 tokens
    ↓
Better Auth 获取用户信息（通过 Google People API）
    ↓
创建/更新用户和会话
    ↓
设置会话 Cookie
    ↓
重定向回应用首页
```

## 🔍 常见问题

### Q1: "Error 403: access_denied"

**原因**：应用未发布或用户不在测试用户列表中

**解决方案**：

1. 确保你的 Gmail 地址已添加到测试用户列表
2. 或者发布应用（OAuth 同意屏幕 → 发布应用）

### Q2: "redirect_uri_mismatch" 错误

**解决方案**：

1. 检查 Google Console 中的重定向 URI
2. 确保完全匹配：`http://localhost:3000/api/auth/callback/google`
3. 注意不要有尾部斜杠

### Q3: "invalid_client" 错误

**解决方案**：

1. 复制 Client ID 和 Secret 时不要有空格
2. 确保 Client ID 以 `.apps.googleusercontent.com` 结尾
3. 重启应用使环境变量生效

### Q4: 无法获取用户邮箱

**解决方案**：

1. 确保在 OAuth 同意屏幕中添加了 `userinfo.email` 作用域
2. 检查用户是否授权了邮箱访问权限

## 🔒 生产环境配置

### 1. 发布应用

当准备好生产环境时：

1. 在 OAuth 同意屏幕中，点击 **"发布应用"**
2. 选择发布状态

### 2. 添加生产域名

1. 在 **"已授权网域"** 中添加你的域名
2. 在 OAuth 客户端中添加：
   - JavaScript 来源：`https://yourdomain.com`
   - 重定向 URI：`https://yourdomain.com/api/auth/callback/google`

### 3. 更新环境变量

```env
BETTER_AUTH_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
GOOGLE_CLIENT_ID=<生产环境 Client ID>
GOOGLE_CLIENT_SECRET=<生产环境 Client Secret>
```

## 🎨 高级配置

### 自定义授权范围

```typescript
// apps/gateway/src/auth/auth.config.ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    // 自定义授权范围
    scope: [
      'openid',
      'email',
      'profile',
      // 'https://www.googleapis.com/auth/calendar', // 示例：日历访问
    ],
  },
}
```

### 启用 Refresh Token

Google OAuth 支持 refresh token，用于长期访问：

```typescript
// Better Auth 自动管理 refresh token
// 存储在 accounts 表的 refresh_token 字段
```

## 📚 相关资源

- [Better Auth Google 文档](https://better-auth.com/docs/authentication/google)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

## ✅ 验证清单

完成以下步骤后，Google OAuth 应该可以正常工作：

- [ ] 创建 Google Cloud 项目
- [ ] 配置 OAuth 同意屏幕
- [ ] 添加测试用户（外部模式）
- [ ] 创建 OAuth 2.0 凭据
- [ ] 配置正确的重定向 URI
- [ ] 复制 Client ID 和 Secret 到 `.env`
- [ ] 重启应用
- [ ] 访问登录页面
- [ ] 点击 Google 登录按钮
- [ ] 完成 Google 授权
- [ ] 成功跳转回应用并显示用户信息

## 🚀 下一步

- [配置 GitHub OAuth](./GITHUB_OAUTH_SETUP.md)
- [添加更多 OAuth 提供商](https://better-auth.com/docs/authentication/social)
- [自定义登录页面](../apps/gateway/public/login.html)
- [实现权限管理](../docs/RBAC.md)
