/**
 * 邮件服务配置接口
 */

/**
 * SMTP 配置选项
 */
export interface EmailConfig {
  /** SMTP 服务器地址 */
  host: string;
  /** SMTP 端口 */
  port: number;
  /** 是否使用安全连接 (TLS) */
  secure?: boolean;
  /** SMTP 用户名 */
  user: string;
  /** SMTP 密码 */
  password: string;
  /** 发件人邮箱地址 */
  from: string;
  /** 发件人名称 */
  fromName?: string;
}

/**
 * 邮件选项
 */
export interface EmailOptions {
  /** 收件人邮箱 */
  to: string | string[];
  /** 邮件主题 */
  subject: string;
  /** 纯文本内容 */
  text?: string;
  /** HTML 内容 */
  html?: string;
  /** 抄送 */
  cc?: string | string[];
  /** 密送 */
  bcc?: string | string[];
  /** 附件 */
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * 邮件发送结果
 */
export interface EmailResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 ID */
  messageId?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 模板数据类型
 */
export interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}
