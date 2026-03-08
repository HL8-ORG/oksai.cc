import { BaseException } from "./base.exception.js";
import type { ExceptionCode } from "./codes.js";

/**
 * 应用异常
 *
 * 表示应用层中发生的用例执行错误或协调错误。
 * 这类异常通常表示应用服务的编排逻辑出现问题。
 *
 * @example
 * ```typescript
 * // 用例执行失败
 * throw new ApplicationException('创建订单用例执行失败', 'USE_CASE_FAILED');
 *
 * // 并发冲突
 * throw new ApplicationException('数据已被其他用户修改，请刷新后重试', 'CONCURRENCY_CONFLICT');
 *
 * // 命令处理器失败
 * throw new ApplicationException('命令处理失败', 'COMMAND_HANDLER_FAILED', {
 *   cause: originalError,
 *   context: { commandName: 'CreateOrderCommand' }
 * });
 * ```
 */
export class ApplicationException extends BaseException {
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
