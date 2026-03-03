/**
 * 邮件服务使用示例
 *
 * 演示如何使用邮件服务发送各种类型的邮件
 */

import process from "node:process";
import { createEmailServiceFromEnv, EmailService } from "@oksai/email";

/**
 * 示例 1: 从环境变量创建邮件服务
 */
async function example1() {
  // 从环境变量创建服务
  const emailService = createEmailServiceFromEnv();

  // 验证 SMTP 连接
  const isValid = await emailService.verify();
  console.log("SMTP 连接验证:", isValid ? "成功" : "失败");

  // 发送简单邮件
  const result = await emailService.send({
    to: "user@example.com",
    subject: "测试邮件",
    html: "<h1>Hello World</h1>",
  });

  console.log("邮件发送结果:", result);

  // 关闭服务
  await emailService.close();
}

/**
 * 示例 2: 使用自定义配置创建邮件服务
 */
async function example2() {
  const emailService = new EmailService({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "your-email@gmail.com",
    password: "your-app-password",
    from: "your-email@gmail.com",
    fromName: "oksai.cc",
  });

  // 发送邮箱验证邮件
  await emailService.sendVerificationEmail({
    to: "user@example.com",
    userName: "张三",
    verificationUrl: "https://example.com/verify?token=abc123",
  });

  await emailService.close();
}

/**
 * 示例 3: 与 Better Auth 集成
 *
 * 文件位置: apps/gateway/src/auth/auth.config.ts
 */
async function example3() {
  const emailService = createEmailServiceFromEnv();

  // 在 Better Auth 配置中使用
  const auth = {
    // ... Better Auth 配置
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerificationEmail({
        to: user.email,
        userName: user.name || undefined,
        verificationUrl: url,
      });
    },
    sendResetPasswordEmail: async ({ user, url }) => {
      await emailService.sendResetPasswordEmail({
        to: user.email,
        userName: user.name || undefined,
        resetUrl: url,
      });
    },
  };
}

/**
 * 示例 4: 在 NestJS 中使用
 *
 * 文件位置: apps/gateway/src/email/email.service.ts
 */
// @Injectable()
// export class NestEmailService {
//   private emailService: EmailService;
//
//   constructor() {
//     this.emailService = createEmailServiceFromEnv();
//   }
//
//   async sendVerificationEmail(to: string, url: string) {
//     return this.emailService.sendVerificationEmail({
//       to,
//       verificationUrl: url,
//     });
//   }
// }

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  example1().catch(console.error);
}
