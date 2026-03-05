import { BaseException } from "./base.exception";
import type { ExceptionCode } from "./codes";
import { ExceptionCode as Codes } from "./codes";

/**
 * 验证错误项
 */
export interface ValidationError {
  /** 字段名称 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误值（可选） */
  value?: unknown;
  /** 验证规则（可选） */
  rule?: string;
}

/**
 * 验证异常
 *
 * 表示输入验证失败，包含具体的字段和错误信息。
 * 现在统一继承自 BaseException，提供一致的异常结构。
 *
 * @example
 * ```typescript
 * // 单个字段验证失败
 * throw new ValidationException('用户名不能为空', 'name');
 *
 * // 多个字段验证失败
 * throw new ValidationException('验证失败', undefined, {
 *   errors: [
 *     { field: 'name', message: '名称不能为空', value: '' },
 *     { field: 'email', message: '邮箱格式不正确', value: 'invalid-email' }
 *   ]
 * });
 *
 * // 带上下文的验证错误
 * throw new ValidationException('密码不符合要求', 'password', {
 *   context: {
 *     minLength: 8,
 *     currentLength: 5
 *   }
 * });
 * ```
 */
export class ValidationException extends BaseException {
  /**
   * 字段名称（单个验证错误时使用）
   */
  public readonly field?: string;

  /**
   * 验证错误列表（多个验证错误时使用）
   */
  public readonly errors?: ValidationError[];

  constructor(
    message: string,
    field?: string,
    options?: {
      code?: string | ExceptionCode;
      errors?: ValidationError[];
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, options?.code || Codes.VALIDATION_ERROR, options);
    this.field = field;
    this.errors = options?.errors;
  }

  /**
   * 创建单个字段的验证异常
   *
   * @param field - 字段名称
   * @param message - 错误消息
   * @param value - 错误值
   * @returns ValidationException 实例
   */
  static forField(field: string, message: string, value?: unknown): ValidationException {
    return new ValidationException(message, field, {
      context: value !== undefined ? { value } : undefined,
    });
  }

  /**
   * 创建多个字段的验证异常
   *
   * @param errors - 验证错误列表
   * @returns ValidationException 实例
   */
  static forFields(errors: ValidationError[]): ValidationException {
    return new ValidationException("验证失败", undefined, { errors });
  }

  /**
   * 序列化为 JSON（扩展基类方法）
   */
  override toJSON() {
    const json = super.toJSON();
    return {
      ...json,
      field: this.field,
      errors: this.errors,
    };
  }
}
