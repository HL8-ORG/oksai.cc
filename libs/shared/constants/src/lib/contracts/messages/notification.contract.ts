/**
 * @description 通知消息契约
 *
 * @module @oksai/constants/contracts/messages/notification
 */

export const NOTIFICATION_TYPES = {
  /** 系统通知 */
  SYSTEM: "notification.system",
  /** 提及通知 */
  MENTION: "notification.mention",
  /** 评论通知 */
  COMMENT: "notification.comment",
  /** 点赞通知 */
  LIKE: "notification.like",
  /** 关注通知 */
  FOLLOW: "notification.follow",
  /** 订单通知 */
  ORDER: "notification.order",
  /** 账单通知 */
  BILLING: "notification.billing",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_CHANNELS = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  WEBHOOK: "webhook",
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export interface NotificationMessage {
  /** 通知 ID */
  notificationId: string;
  /** 通知类型 */
  type: NotificationType;
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 接收者 ID */
  recipientId: string;
  /** 发送渠道 */
  channels: NotificationChannel[];
  /** 优先级 */
  priority: "high" | "normal" | "low";
  /** 操作链接 */
  actionUrl?: string;
  /** 额外数据 */
  data?: Record<string, unknown>;
  /** 过期时间 */
  expiresAt?: string;
  /** 创建时间 */
  createdAt: string;
}

export interface InAppNotification extends NotificationMessage {
  /** 是否已读 */
  isRead: boolean;
  /** 阅读时间 */
  readAt?: string;
}
