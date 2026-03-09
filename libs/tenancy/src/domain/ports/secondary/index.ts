/**
 * 被驱动端口（出站端口）导出
 *
 * 定义领域层需要的外部服务接口
 */

export type { IEventStorePort } from "./event-store.port.js";
export type { INotificationPort, NotificationPayload } from "./notification.port.js";
