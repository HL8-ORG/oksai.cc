/**
 * @oksai/exceptions
 *
 * 统一异常体系，提供领域驱动设计的异常类型。
 *
 * @packageDocumentation
 */

export { ApplicationException } from "./lib/application.exception";
// 基础异常类
export { BaseException, type ExceptionJSON } from "./lib/base.exception";
export { BusinessRuleException } from "./lib/business-rule.exception";
// 异常代码
export { ExceptionCode } from "./lib/codes";
// DDD 分层异常
export { DomainException } from "./lib/domain.exception";
export { InfrastructureException } from "./lib/infrastructure.exception";
// NestJS 集成
export {
  GlobalExceptionFilter,
  UnifiedExceptionFilter,
} from "./lib/nestjs.filter";
export { NotFoundException } from "./lib/not-found.exception";
// 工具函数
export {
  createExceptionContext,
  isApplicationException,
  isBaseException,
  isClientError,
  isDomainException,
  isInfrastructureException,
  isRetryable,
  toApplicationException,
  toDomainException,
} from "./lib/utils";
// 特殊用途异常
export {
  type ValidationError,
  ValidationException,
} from "./lib/validation.exception";
