/**
 * 邮件发送服务
 *
 * 基于 nodemailer 实现的邮件发送服务，支持：
 * - SMTP 邮件发送
 * - 模板渲染
 * - 邮箱验证
 * - 密码重置
 * - Magic Link
 */

import process from "node:process";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type { EmailConfig, EmailOptions, EmailResult, TemplateData } from "./types.js";

/**
 * 邮件服务类
 */
export class EmailService {
  private transporter: Transporter;
  private config: EmailConfig;

  /**
   * 创建邮件服务实例
   */
  constructor(config: EmailConfig) {
    this.config = config;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  /**
   * 验证 SMTP 连接
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("[EmailService] SMTP 验证失败:", error);
      return false;
    }
  }

  /**
   * 发送邮件
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const from = this.config.fromName ? `${this.config.fromName} <${this.config.from}>` : this.config.from;

      // 辅助函数：格式化邮件地址
      const formatAddress = (addr: string | string[] | undefined): string | undefined => {
        if (!addr) return undefined;
        return Array.isArray(addr) ? addr.join(", ") : addr;
      };

      const info = await this.transporter.sendMail({
        from,
        to: formatAddress(options.to),
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: formatAddress(options.cc),
        bcc: formatAddress(options.bcc),
        attachments: options.attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[EmailService] 邮件发送失败:", errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 发送模板邮件
   */
  async sendTemplate(
    to: string | string[],
    subject: string,
    template: string,
    data: TemplateData
  ): Promise<EmailResult> {
    const html = this.renderTemplate(template, data);

    return this.send({
      to,
      subject,
      html,
    });
  }

  /**
   * 渲染模板（简单字符串替换）
   */
  private renderTemplate(template: string, data: TemplateData): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, "g"), String(value ?? ""));
    }

    return result;
  }

  /**
   * 发送邮箱验证邮件
   */
  async sendVerificationEmail(params: {
    to: string;
    userName?: string;
    verificationUrl: string;
  }): Promise<EmailResult> {
    const { to, userName = "用户", verificationUrl } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">验证您的邮箱地址</h1>
        <p>您好，${userName}！</p>
        <p>请点击下方链接验证您的邮箱地址：</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          验证邮箱
        </a>
        <p>或复制此链接到浏览器：</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          此链接将在 1 小时后失效。如果您没有注册 oksai.cc 账户，请忽略此邮件。
        </p>
      </div>
    `;

    return this.send({
      to,
      subject: "验证您的邮箱地址 - oksai.cc",
      html,
    });
  }

  /**
   * 发送密码重置邮件
   */
  async sendResetPasswordEmail(params: {
    to: string;
    userName?: string;
    resetUrl: string;
  }): Promise<EmailResult> {
    const { to, userName = "用户", resetUrl } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">重置您的密码</h1>
        <p>您好，${userName}！</p>
        <p>我们收到了重置您账户密码的请求。请点击下方链接重置密码：</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          重置密码
        </a>
        <p>或复制此链接到浏览器：</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          此链接将在 1 小时后失效。如果您没有请求重置密码，请忽略此邮件。
        </p>
      </div>
    `;

    return this.send({
      to,
      subject: "重置您的密码 - oksai.cc",
      html,
    });
  }

  /**
   * 发送 Magic Link 登录邮件
   */
  async sendMagicLinkEmail(params: {
    to: string;
    userName?: string;
    magicLinkUrl: string;
  }): Promise<EmailResult> {
    const { to, userName = "用户", magicLinkUrl } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">登录到 oksai.cc</h1>
        <p>您好，${userName}！</p>
        <p>点击下方链接即可快速登录：</p>
        <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          立即登录
        </a>
        <p>或复制此链接到浏览器：</p>
        <p style="color: #666; word-break: break-all;">${magicLinkUrl}</p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          此链接将在 10 分钟后失效。如果您没有请求登录，请忽略此邮件。
        </p>
      </div>
    `;

    return this.send({
      to,
      subject: "登录链接 - oksai.cc",
      html,
    });
  }

  /**
   * 关闭邮件服务
   */
  async close(): Promise<void> {
    this.transporter.close();
  }
}

/**
 * 从环境变量创建邮件服务实例
 */
export function createEmailServiceFromEnv(): EmailService {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || "noreply@example.com",
    fromName: process.env.SMTP_FROM_NAME || "oksai.cc",
  };

  return new EmailService(config);
}
