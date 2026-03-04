/**
 * @description 邮件消息契约
 *
 * @module @oksai/constants/contracts/messages/email
 */

export const EMAIL_MESSAGE_TYPES = {
  VERIFICATION: "email.verification",
  WELCOME: "email.welcome",
  PASSWORD_RESET: "email.password_reset",
  NOTIFICATION: "email.notification",
  NEWSLETTER: "email.newsletter",
} as const;

export type EmailMessageType = (typeof EMAIL_MESSAGE_TYPES)[keyof typeof EMAIL_MESSAGE_TYPES];

export interface EmailMessage {
  /** 消息 ID */
  messageId: string;
  /** 消息类型 */
  type: EmailMessageType;
  /** 收件人 */
  to: string | string[];
  /** 抄送 */
  cc?: string[];
  /** 密送 */
  bcc?: string[];
  /** 主题 */
  subject: string;
  /** 模板名称 */
  template: string;
  /** 模板数据 */
  templateData: Record<string, unknown>;
  /** 附件 */
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
  /** 优先级 */
  priority?: "high" | "normal" | "low";
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

export interface VerificationEmailPayload {
  /** 验证令牌 */
  token: string;
  /** 验证链接 */
  verificationUrl: string;
  /** 过期时间（小时） */
  expiresInHours: number;
  /** 用户名 */
  username: string;
  /** 租户名称 */
  tenantName?: string;
}

export interface WelcomeEmailPayload {
  /** 用户名 */
  username: string;
  /** 租户名称 */
  tenantName?: string;
  /** 仪表板链接 */
  dashboardUrl: string;
  /** 文档链接 */
  docsUrl?: string;
}
