import { BaseException } from "./base.exception.js";
import type { ExceptionCode } from "./codes.js";
import { ExceptionCode as Codes } from "./codes.js";

/**
 * 业务规则异常
 *
 * 表示业务规则被违反，但不属于领域层的核心不变量。
 * 通常用于应用层的业务策略验证。
 *
 * @example
 * ```typescript
 * // 简单的业务规则异常
 * throw new BusinessRuleException('任务必须包含至少一个任务项');
 *
 * // 带规则名称的异常
 * throw new BusinessRuleException('超出预算限制', 'BUDGET_LIMIT_EXCEEDED');
 *
 * // 带上下文的异常
 * throw new BusinessRuleException('订单金额超出限额', 'ORDER_AMOUNT_LIMIT', {
 *   context: {
 *     limit: 10000,
 *     actual: 15000
 *   }
 * });
 * ```
 */
export class BusinessRuleException extends BaseException {
  /**
   * 规则名称（可选）
   */
  public readonly rule?: string;

  constructor(
    message: string,
    rule?: string | ExceptionCode,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, rule || Codes.BUSINESS_RULE_VIOLATION, options);
    this.rule = rule;
  }
}
