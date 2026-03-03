# @oksai/email

邮件服务模块，为 oksai.cc 提供邮件发送功能。

## 功能特性

- ✅ 基于 nodemailer 的邮件发送
- ✅ SMTP 服务器支持
- ✅ 模板渲染功能
- ✅ 邮箱验证邮件
- ✅ 密码重置邮件
- ✅ Magic Link 登录邮件
- ✅ TypeScript 类型安全

## 安装

```bash
pnpm install --filter @oksai/email
```

## 配置

### 环境变量

```bash
# SMTP 配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
SMTP_FROM_NAME=oksai.cc
```

## 使用方法

### 1. 基础使用

```typescript
import { EmailService } from "@oksai/email";

// 创建邮件服务
const emailService = new EmailService({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "your-email@gmail.com",
  password: "your-app-password",
  from: "your-email@gmail.com",
  fromName: "oksai.cc",
});

// 发送邮件
await emailService.send({
  to: "user@example.com",
  subject: "测试邮件",
  html: "<h1>Hello World</h1>",
});
```

### 2. 从环境变量创建

```typescript
import { createEmailServiceFromEnv } from "@oksai/email";

// 从环境变量创建服务
const emailService = createEmailServiceFromEnv();

// 验证连接
const isValid = await emailService.verify();
console.log("SMTP 连接:", isValid ? "成功" : "失败");
```

### 3. 发送邮箱验证邮件

```typescript
await emailService.sendVerificationEmail({
  to: "user@example.com",
  userName: "张三",
  verificationUrl: "https://example.com/verify?token=abc123",
});
```

### 4. 发送密码重置邮件

```typescript
await emailService.sendResetPasswordEmail({
  to: "user@example.com",
  userName: "张三",
  resetUrl: "https://example.com/reset-password?token=xyz789",
});
```

### 5. 发送 Magic Link 邮件

```typescript
await emailService.sendMagicLinkEmail({
  to: "user@example.com",
  userName: "张三",
  magicLinkUrl: "https://example.com/magic-link?token=def456",
});
```

### 6. 与 Better Auth 集成

```typescript
import { createBetterAuth } from "@oksai/auth-config";
import { createEmailServiceFromEnv } from "@oksai/email";
import { db } from "@oksai/database";

// 创建邮件服务
const emailService = createEmailServiceFromEnv();

// 创建 Better Auth 实例
export const auth = createBetterAuth({
  db,
  baseURL: "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  
  // 邮箱验证回调
  sendVerificationEmail: async ({ user, url }) => {
    await emailService.sendVerificationEmail({
      to: user.email,
      userName: user.name || undefined,
      verificationUrl: url,
    });
  },
  
  // 密码重置回调
  sendResetPasswordEmail: async ({ user, url }) => {
    await emailService.sendResetPasswordEmail({
      to: user.email,
      userName: user.name || undefined,
      resetUrl: url,
    });
  },
});
```

## API 文档

### EmailService

#### constructor(config: EmailConfig)

创建邮件服务实例。

**参数：**
- `config.host` - SMTP 服务器地址
- `config.port` - SMTP 端口
- `config.secure` - 是否使用安全连接
- `config.user` - SMTP 用户名
- `config.password` - SMTP 密码
- `config.from` - 发件人邮箱
- `config.fromName` - 发件人名称

#### verify(): Promise<boolean>

验证 SMTP 连接。

#### send(options: EmailOptions): Promise<EmailResult>

发送邮件。

#### sendTemplate(to, subject, template, data): Promise<EmailResult>

发送模板邮件。

#### sendVerificationEmail(params): Promise<EmailResult>

发送邮箱验证邮件。

#### sendResetPasswordEmail(params): Promise<EmailResult>

发送密码重置邮件。

#### sendMagicLinkEmail(params): Promise<EmailResult>

发送 Magic Link 登录邮件。

### createEmailServiceFromEnv(): EmailService

从环境变量创建邮件服务实例。

## 开发状态

- [x] Phase 1: 核心邮件功能
- [ ] Phase 2: 高级特性（邮件队列、重试机制）
- [ ] Phase 3: 集成第三方邮件服务（SendGrid, Mailgun）

## 相关文档

- [认证系统技术规格](../../../specs/authentication/design.md)
- [实现进度](../../../specs/authentication/implementation.md)
- [nodemailer 官方文档](https://nodemailer.com/)

## License

MIT
