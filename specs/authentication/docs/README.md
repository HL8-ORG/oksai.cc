# 认证系统

## 概述

oksai.cc 认证系统基于 Better Auth 实现，提供完整的用户认证功能，支持多种认证方式（邮箱密码、OAuth、Magic Link）、双因素认证（2FA/TOTP）、API Key 认证等企业级特性。

## 使用方式

### 第 1 步：用户注册

访问注册页面，输入邮箱和密码创建账号。

**注册方式：**
1. 邮箱密码注册
2. Google OAuth 注册
3. GitHub OAuth 注册

**注册流程：**
1. 用户访问注册页面 `/register`
2. 选择注册方式：
   - 邮箱密码：输入邮箱、密码、姓名
   - OAuth：点击 Google/GitHub 按钮
3. 系统创建用户账号
4. 发送邮箱验证邮件（邮箱密码注册）
5. 用户点击验证链接完成邮箱验证

![注册页面](./screenshots/register.png)

### 第 2 步：用户登录

访问登录页面，使用已注册的凭据登录。

**登录方式：**
1. 邮箱密码登录
2. Google OAuth 登录
3. GitHub OAuth 登录
4. Magic Link 登录

**登录流程：**
1. 用户访问登录页面 `/login`
2. 选择登录方式：
   - 邮箱密码：输入邮箱和密码
   - OAuth：点击 Google/GitHub 按钮
   - Magic Link：输入邮箱，点击"发送 Magic Link"
3. 系统验证用户身份
4. 如果启用了 2FA，输入 2FA 验证码
5. 登录成功，重定向到首页

![登录页面](./screenshots/login.png)

### 第 3 步：邮箱验证

如果使用邮箱密码注册，需要验证邮箱。

**邮箱验证流程：**
1. 注册后，系统自动发送验证邮件
2. 用户收到邮件，点击验证链接
3. 系统验证 Token 有效性
4. 邮箱验证成功，可以正常使用应用

**重新发送验证邮件：**
- 如果未收到邮件，可以点击"重新发送验证邮件"
- 验证邮件有效期 1 小时

![邮箱验证页面](./screenshots/verify-email.png)

### 第 4 步：密码重置

如果忘记密码，可以通过邮箱重置密码。

**密码重置流程：**
1. 用户访问忘记密码页面 `/forgot-password`
2. 输入注册邮箱
3. 系统发送密码重置邮件
4. 用户点击邮件中的重置链接
5. 在重置密码页面 `/reset-password` 输入新密码
6. 密码重置成功，可以使用新密码登录

**注意事项：**
- 密码重置链接有效期 1 小时
- 新密码长度至少 8 位

![忘记密码页面](./screenshots/forgot-password.png)

### 第 5 步：启用 2FA（可选）

为提升账户安全性，可以启用双因素认证（2FA）。

**2FA 启用流程：**
1. 用户访问安全设置页面
2. 点击"启用 2FA"
3. 使用 Authenticator App（如 Google Authenticator）扫描二维码
4. 输入 Authenticator App 显示的 6 位验证码
5. 2FA 启用成功，系统生成 10 个备用码

**2FA 登录流程：**
1. 输入邮箱密码登录
2. 系统要求输入 2FA 验证码
3. 打开 Authenticator App，获取 6 位验证码
4. 输入验证码完成登录

**备用码：**
- 如果无法使用 Authenticator App，可以使用备用码
- 每个备用码只能使用一次
- 建议妥善保管备用码

![2FA 设置页面](./screenshots/2fa-settings.png)

### 第 6 步：管理 API Key（开发者）

开发者可以创建 API Key 用于 API 访问。

**API Key 创建流程：**
1. 用户访问 API Key 管理页面
2. 点击"创建 API Key"
3. 输入 Key 名称（可选）
4. 设置过期时间（可选）
5. 系统生成 API Key（格式：`oks_xxxxx`）
6. **重要：** 立即复制保存 API Key，之后无法再次查看

**API Key 使用：**
```bash
curl -H "X-API-Key: oks_xxxxx" https://api.oksai.cc/api/endpoint
```

**API Key 管理：**
- 查看所有 API Key 列表
- 查看 API Key 使用时间
- 撤销 API Key

![API Key 管理页面](./screenshots/api-keys.png)

## 配置选项

### 环境变量

| 选项 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| BETTER_AUTH_SECRET | Better Auth 加密密钥 | - | ✅ |
| NEXT_PUBLIC_URL | 应用 URL | - | ✅ |
| GOOGLE_CLIENT_ID | Google OAuth Client ID | - | OAuth 必需 |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret | - | OAuth 必需 |
| GITHUB_CLIENT_ID | GitHub OAuth Client ID | - | OAuth 必需 |
| GITHUB_CLIENT_SECRET | GitHub OAuth Client Secret | - | OAuth 必需 |
| SMTP_HOST | SMTP 服务器地址 | - | ✅ |
| SMTP_PORT | SMTP 端口 | 587 | ✅ |
| SMTP_USER | SMTP 用户名 | - | ✅ |
| SMTP_PASSWORD | SMTP 密码 | - | ✅ |
| SMTP_FROM | 发件人邮箱 | - | ✅ |

### Better Auth 配置

| 选项 | 说明 | 默认值 |
|------|------|--------|
| Session 有效期 | 用户会话过期时间 | 7 天 |
| 密码最小长度 | 密码最小长度要求 | 8 位 |
| 密码最大长度 | 密码最大长度 | 128 位 |
| 邮箱验证链接有效期 | 邮箱验证 Token 过期时间 | 1 小时 |
| 密码重置链接有效期 | 密码重置 Token 过期时间 | 1 小时 |
| Magic Link 有效期 | Magic Link 过期时间 | 10 分钟 |
| 2FA 验证码长度 | TOTP 验证码位数 | 6 位 |
| 2FA 验证码有效期 | TOTP 验证码有效时间 | 30 秒 |
| 备用码数量 | 2FA 备用码数量 | 10 个 |

## 常见用例

### 用例 1：普通用户注册登录

1. 访问注册页面，使用邮箱密码注册
2. 查收邮箱，点击验证链接
3. 邮箱验证成功后，访问登录页面
4. 使用邮箱密码登录
5. 成功进入应用

### 用例 2：使用 OAuth 快速登录

1. 访问登录页面
2. 点击"使用 Google 登录"或"使用 GitHub 登录"
3. 在 OAuth Provider 页面授权
4. 自动完成注册/登录，进入应用

**注意：** 如果邮箱已存在，OAuth 账户会自动关联到现有账号。

### 用例 3：使用 Magic Link 无密码登录

1. 访问登录页面
2. 输入邮箱，点击"发送 Magic Link"
3. 查收邮箱，点击 Magic Link
4. 自动完成登录，进入应用

**注意：** Magic Link 有效期 10 分钟。

### 用例 4：启用 2FA 提升安全性

1. 登录后，访问安全设置页面
2. 点击"启用 2FA"
3. 使用 Google Authenticator 扫描二维码
4. 输入 6 位验证码完成启用
5. 保存备用码

**下次登录：**
1. 输入邮箱密码
2. 打开 Google Authenticator 获取验证码
3. 输入验证码完成登录

### 用例 5：开发者创建 API Key

1. 登录后，访问 API Key 管理页面
2. 点击"创建 API Key"
3. 输入名称"Production API"
4. 设置过期时间"1 年后"
5. 复制保存 API Key
6. 在 API 请求中使用：
   ```bash
   curl -H "X-API-Key: oks_xxxxx" https://api.oksai.cc/api/users
   ```

### 用例 6：重置忘记的密码

1. 访问登录页面，点击"忘记密码"
2. 输入注册邮箱
3. 查收密码重置邮件
4. 点击邮件中的重置链接
5. 输入新密码
6. 使用新密码登录

## 常见问题

### Q1: 为什么注册后无法登录？

**A:** 可能原因：
1. **邮箱未验证**：检查邮箱，点击验证链接
2. **密码错误**：确认密码输入正确，注意大小写
3. **账户锁定**：联系管理员解锁

### Q2: 没有收到验证邮件怎么办？

**A:** 解决方案：
1. 检查垃圾邮件文件夹
2. 确认邮箱地址正确
3. 点击"重新发送验证邮件"
4. 联系管理员手动验证

### Q3: OAuth 登录失败怎么办？

**A:** 可能原因：
1. OAuth Provider 配置错误
2. 回调 URL 配置不正确
3. OAuth Provider 服务异常

**解决方案：** 联系管理员检查 OAuth 配置

### Q4: 2FA 验证码一直错误怎么办？

**A:** 解决方案：
1. 确认手机时间正确（TOTP 依赖时间同步）
2. 重新扫描二维码
3. 使用备用码登录
4. 联系管理员重置 2FA

### Q5: API Key 泄露了怎么办？

**A:** 立即操作：
1. 访问 API Key 管理页面
2. 撤销泄露的 API Key
3. 创建新的 API Key
4. 更新应用配置

### Q6: 如何删除账户？

**A:** 联系管理员申请账户删除。注意：账户删除后数据无法恢复。

## 安全建议

### 对用户

1. **使用强密码**：至少 8 位，包含大小写字母、数字、特殊字符
2. **启用 2FA**：为账户添加额外保护层
3. **妥善保管备用码**：保存在安全的地方
4. **定期更换密码**：建议每 3-6 个月更换一次
5. **不要分享 API Key**：API Key 泄露可能导致数据泄露

### 对开发者

1. **使用 HTTPS**：确保所有通信加密
2. **验证所有输入**：防止注入攻击
3. **记录审计日志**：监控异常登录行为
4. **定期更新依赖**：及时修复安全漏洞
5. **遵循 OWASP 最佳实践**：参考 [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 技术架构

- **认证框架**：Better Auth
- **Session 策略**：JWT
- **数据库**：PostgreSQL (Drizzle ORM)
- **邮件服务**：Nodemailer
- **2FA**：Better Auth Two-Factor Plugin (TOTP)
- **API Key**：Passport HeaderAPIKeyStrategy

## 相关文档

- [认证系统设计](../design.md)
- [实现进度](../implementation.md)
- [架构决策](../decisions.md)
- [开发工作流程](../../_templates/workflow.md)

---

**文档版本：** 2.0.0  
**最后更新：** 2026年3月3日  
**维护者：** oksai.cc 团队
