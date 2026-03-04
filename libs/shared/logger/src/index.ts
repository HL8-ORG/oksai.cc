/**
 * @oksai/logger
 *
 * 基于 Pino 的结构化日志模块，集成多租户上下文。
 *
 * 特性：
 * - 实现 NestJS LoggerService 接口
 * - 自动注入租户上下文（tenantId、userId、correlationId）
 * - 增强的序列化器（请求、响应、错误）
 * - 智能日志级别计算
 * - 支持 pino-pretty 美化输出
 * - 中文错误消息
 *
 * @packageDocumentation
 */

// 模块
export { LoggerModule, type LoggerModuleAsyncOptions, type LoggerModuleOptions } from "./lib/logger.module";
// 序列化器
export {
  computeLogLevel,
  getRequestIdFromReq,
  resolveOptionalDependency,
  type SerializedError,
  type SerializedRequest,
  type SerializedResponse,
  serializeError,
  serializeRequest,
  serializeResponse,
} from "./lib/logger.serializer";
// 服务
export { type LogContext, type OksaiLoggerOptions, OksaiLoggerService } from "./lib/oksai-logger.service";
