/**
 * 邮件通知适配器
 *
 * 实现通知端口，通过邮件发送通知
 */

import type {
  INotificationPort,
  NotificationPayload,
} from "../../../domain/ports/secondary/notification.port.js";

export class EmailNotificationAdapter implements INotificationPort {
  async send(payload: NotificationPayload): Promise<void> {
    console.log(`[EmailNotificationAdapter] 发送邮件通知:`, {
      tenantId: payload.tenantId,
      recipient: payload.recipient,
      subject: payload.subject,
    });

    // TODO: 集成实际的邮件发送服务
    // await this.emailService.send({
    //   to: payload.recipient,
    //   subject: payload.subject,
    //   html: payload.content,
    // });
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    console.log(`[EmailNotificationAdapter] 批量发送邮件通知: ${payloads.length} 封`);

    // 并行发送所有邮件
    await Promise.all(payloads.map((payload) => this.send(payload)));
  }
}
