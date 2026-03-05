import { BaseException } from "./base.exception";
import { ExceptionCode } from "./codes";

/**
 * 未找到异常
 *
 * 表示请求的实体或资源不存在。
 * 这是一个特殊的领域异常，用于表示聚合根或实体未找到的情况。
 *
 * @example
 * ```typescript
 * // 实体未找到
 * throw new NotFoundException('任务', 'job-123');
 *
 * // 用户未找到
 * throw new NotFoundException('用户', 'user-456');
 *
 * // 带原始错误的异常
 * throw new NotFoundException('订单', 'order-789', {
 *   cause: dbError
 * });
 * ```
 */
export class NotFoundException extends BaseException {
  /**
   * 实体类型
   */
  public readonly entityType: string;

  /**
   * 实体标识符
   */
  public readonly identifier: string;

  constructor(
    entityType: string,
    identifier: string,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    }
  ) {
    super(`未找到${entityType}: ${identifier}`, ExceptionCode.ENTITY_NOT_FOUND, {
      ...options,
      context: {
        entityType,
        identifier,
        ...options?.context,
      },
    });
    this.entityType = entityType;
    this.identifier = identifier;
  }

  /**
   * 创建实体未找到异常的静态工厂方法
   *
   * @param entityType - 实体类型
   * @param identifier - 实体标识符
   * @returns NotFoundException 实例
   */
  static forEntity(entityType: string, identifier: string): NotFoundException {
    return new NotFoundException(entityType, identifier);
  }
}
