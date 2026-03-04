/**
 * @description 契约（Contracts）集中管理
 *
 * 契约是服务间通信的协议定义，包括：
 * - API 契约：HTTP 接口的请求/响应结构
 * - 事件契约：事件名称和 Payload 类型
 * - 消息契约：消息队列的 DTO
 * - 错误代码：统一的错误码定义
 *
 * @module @oksai/constants/contracts
 */

// ============ API 契约 ============

export * from "./api/auth.contract";
export * from "./api/order.contract";
export * from "./api/tenant.contract";
export * from "./api/user.contract";

// ============ 事件契约 ============

export * from "./events/order.events";
export * from "./events/tenant.events";
export * from "./events/user.events";

// ============ 消息契约 ============

export * from "./messages/email.contract";
export * from "./messages/notification.contract";

// ============ 错误代码契约 ============

export * from "./errors/error-codes.contract";
