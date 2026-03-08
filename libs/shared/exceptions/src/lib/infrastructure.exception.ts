import { BaseException } from "./base.exception.js";
import type { ExceptionCode } from "./codes.js";

/**
 * 基础设施异常
 *
 * 表示基础设施层中发生的技术错误，如数据库、网络、文件系统等。
 * 这类异常通常表示外部依赖或技术组件出现问题。
 *
 * @example
 * ```typescript
 * // 数据库连接失败
 * throw new InfrastructureException('数据库连接失败', 'DB_CONNECTION_FAILED', {
 *   cause: originalError,
 *   context: { host: 'localhost', port: 5432 }
 * });
 *
 * // 消息队列不可用
 * throw new InfrastructureException('消息队列不可用', 'MQ_UNAVAILABLE');
 *
 * // 外部服务不可用
 * throw new InfrastructureException('支付服务不可用', 'EXTERNAL_SERVICE_UNAVAILABLE', {
 *   context: { service: 'PaymentService', endpoint: '/api/pay' }
 * });
 * ```
 */
export class InfrastructureException extends BaseException {
  constructor(
    message: string,
    code: string | ExceptionCode,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, code, options);
  }
}
