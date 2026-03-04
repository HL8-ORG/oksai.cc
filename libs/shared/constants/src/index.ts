/**
 * @description @oksai/constants 公共导出入口
 *
 * 提供跨包共享的基础常量和契约：
 * - API 相关默认常量（端口、路径、超时等）
 * - 反射元数据键常量（装饰器、守卫、拦截器使用）
 * - API 契约（请求/响应 DTO）
 * - 事件契约（事件名称、Payload 类型）
 * - 消息契约（消息队列、DTO）
 * - 错误代码契约（统一错误码）
 *
 * @module @oksai/constants
 */

export * from "./lib/api.constants";
// 契约（Contracts）集中导出
export * from "./lib/contracts";
export * from "./lib/reflect-metadata.constants";
