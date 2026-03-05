import { ApplicationException } from "./application.exception";
import { BaseException } from "./base.exception";
import { DomainException } from "./domain.exception";
import { InfrastructureException } from "./infrastructure.exception";

/**
 * 异常类型守卫
 *
 * 检查错误是否为 BaseException 实例
 */
export function isBaseException(error: unknown): error is BaseException {
  return error instanceof BaseException;
}

/**
 * 领域异常类型守卫
 */
export function isDomainException(error: unknown): error is DomainException {
  return error instanceof DomainException;
}

/**
 * 应用异常类型守卫
 */
export function isApplicationException(error: unknown): error is ApplicationException {
  return error instanceof ApplicationException;
}

/**
 * 基础设施异常类型守卫
 */
export function isInfrastructureException(error: unknown): error is InfrastructureException {
  return error instanceof InfrastructureException;
}

/**
 * 将技术异常转换为领域异常
 *
 * @param error - 原始错误
 * @returns 领域异常
 */
export function toDomainException(error: unknown): DomainException {
  if (error instanceof DomainException) {
    return error;
  }

  if (error instanceof Error) {
    return new DomainException(error.message, "INTERNAL_ERROR", {
      cause: error,
    });
  }

  return new DomainException("未知错误", "UNKNOWN_ERROR");
}

/**
 * 将异常转换为应用异常
 *
 * @param error - 原始错误
 * @returns 应用异常
 */
export function toApplicationException(error: unknown): ApplicationException {
  if (error instanceof ApplicationException) {
    return error;
  }

  if (error instanceof Error) {
    return new ApplicationException(error.message, "INTERNAL_ERROR", {
      cause: error,
    });
  }

  return new ApplicationException("未知错误", "UNKNOWN_ERROR");
}

/**
 * 创建异常上下文
 *
 * 用于日志记录和监控
 */
export function createExceptionContext(exception: BaseException) {
  return {
    exceptionType: exception.constructor.name,
    code: exception.code,
    message: exception.message,
    context: exception.context,
    timestamp: exception.timestamp.toISOString(),
    stack: exception.stack,
    cause: exception.cause,
  };
}

/**
 * 判断异常是否可重试
 */
export function isRetryable(exception: BaseException): boolean {
  // 基础设施异常通常可以重试
  if (exception instanceof InfrastructureException) {
    return ["DB_CONNECTION_FAILED", "EXTERNAL_SERVICE_UNAVAILABLE", "MQ_UNAVAILABLE", "CACHE_ERROR"].includes(
      exception.code
    );
  }

  // 并发冲突可以重试
  if (exception instanceof ApplicationException && exception.code === "CONCURRENCY_CONFLICT") {
    return true;
  }

  return false;
}

/**
 * 判断异常是否为客户端错误
 */
export function isClientError(exception: BaseException): boolean {
  // 领域异常和验证异常通常是客户端错误
  if (exception instanceof DomainException) {
    return true;
  }

  // 业务规则违反通常是客户端错误
  if (exception.code === "BUSINESS_RULE_VIOLATION") {
    return true;
  }

  // 验证错误是客户端错误
  if (exception.code.startsWith("VALIDATION_")) {
    return true;
  }

  return false;
}
