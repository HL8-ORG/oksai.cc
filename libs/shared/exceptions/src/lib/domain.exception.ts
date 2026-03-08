import { BaseException } from "./base.exception.js";
import type { ExceptionCode } from "./codes.js";

/**
 * 领域异常
 *
 * 表示领域层中发生的业务规则违反或领域逻辑错误。
 * 这类异常通常表示领域模型的不变量被违反。
 *
 * @example
 * ```typescript
 * // 实体状态无效
 * throw new DomainException('任务不存在', 'JOB_NOT_FOUND');
 *
 * // 业务规则违反
 * throw new DomainException('任务已完成，无法修改', 'JOB_ALREADY_COMPLETED');
 *
 * // 领域不变量违反
 * throw new DomainException('订单金额不能为负数', 'INVALID_ORDER_AMOUNT', {
 *   context: { amount: -100 }
 * });
 * ```
 */
export class DomainException extends BaseException {
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
