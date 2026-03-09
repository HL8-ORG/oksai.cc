/**
 * 通知端口（被驱动端口/出站端口）
 *
 * 定义发送通知的契约
 * 由基础设施层实现
 */

/**
 * 通知负载
 */
export interface NotificationPayload {
  tenantId: string;
  type: "email" | "sms" | "webhook";
  recipient: string;
  subject: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * 通知端口接口
 */
export interface INotificationPort {
  /**
   * 发送通知
   *
   * @param payload - 通知负载
   */
  send(payload: NotificationPayload): Promise<void>;

  /**
   * 批量发送通知
   *
   * @param payloads - 通知负载列表
   */
  sendBatch(payloads: NotificationPayload[]): Promise<void>;
}
