import type { ExceptionCode } from "./codes";

/**
 * 异常序列化 JSON 接口
 */
export interface ExceptionJSON {
  /** 异常类型名称 */
  name: string;
  /** 异常代码 */
  code: string;
  /** 异常消息 */
  message: string;
  /** 上下文信息 */
  context?: Record<string, unknown>;
  /** 时间戳 */
  timestamp: string;
  /** 堆栈信息 */
  stack?: string;
}

/**
 * 基础异常类
 *
 * 所有自定义异常的基类，提供统一的异常结构。
 *
 * @example
 * ```typescript
 * class MyException extends BaseException {
 *   constructor(message: string) {
 *     super(message, 'MY_ERROR');
 *   }
 * }
 * ```
 */
export abstract class BaseException extends Error {
  /**
   * 异常代码
   */
  public readonly code: string;

  /**
   * 额外上下文信息
   */
  public readonly context?: Record<string, unknown>;

  /**
   * 异常发生时间
   */
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string | ExceptionCode,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, options);
    this.code = code;
    this.context = options?.context;
    this.timestamp = new Date();
    this.name = this.constructor.name;

    // 确保原型链正确
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * 序列化为 JSON
   *
   * @returns JSON 对象表示
   */
  toJSON(): ExceptionJSON {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * 获取完整的错误信息
   *
   * @returns 包含代码和时间戳的完整信息
   */
  getFullMessage(): string {
    const parts = [`[${this.code}]`, this.message];
    if (this.context && Object.keys(this.context).length > 0) {
      parts.push(`上下文: ${JSON.stringify(this.context)}`);
    }
    return parts.join(" - ");
  }
}
