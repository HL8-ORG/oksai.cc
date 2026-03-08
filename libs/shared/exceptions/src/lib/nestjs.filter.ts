import process from "node:process";
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ApplicationException } from "./application.exception.js";
import { BaseException } from "./base.exception.js";
import { DomainException } from "./domain.exception.js";
import { InfrastructureException } from "./infrastructure.exception.js";
import { NotFoundException } from "./not-found.exception.js";
import { createExceptionContext, isClientError } from "./utils.js";
import { ValidationException } from "./validation.exception.js";

/**
 * 统一异常过滤器
 *
 * 捕获所有 BaseException 并转换为 HTTP 响应
 *
 * @example
 * ```typescript
 * // 在模块中全局注册
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useClass: ExceptionFilter
 *     }
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Catch(BaseException)
export class UnifiedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnifiedExceptionFilter.name);

  catch(exception: BaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 记录异常日志
    this.logException(exception, request);

    // 转换为 HTTP 状态码和响应体
    const { status, body } = this.transformException(exception);

    // 发送响应
    response.status(status).json(body);
  }

  /**
   * 记录异常日志
   */
  private logException(exception: BaseException, _request: Request) {
    const context = createExceptionContext(exception);

    // 客户端错误使用 warn 级别
    if (isClientError(exception)) {
      this.logger.warn(`客户端错误: ${exception.message}`, context);
    } else {
      // 服务端错误使用 error 级别
      this.logger.error(`服务端错误: ${exception.message}`, exception.stack, context);
    }
  }

  /**
   * 转换异常为 HTTP 响应
   */
  private transformException(exception: BaseException): {
    status: HttpStatus;
    body: any;
  } {
    const baseBody = {
      code: exception.code,
      message: exception.message,
      timestamp: exception.timestamp.toISOString(),
      path: undefined as string | undefined,
    };

    // 添加上下文信息（仅开发环境）
    if (process.env.NODE_ENV === "development") {
      baseBody.path = exception.stack?.split("\n")[1]?.trim();
    }

    // 验证异常特殊处理
    if (exception instanceof ValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          ...baseBody,
          field: exception.field,
          errors: exception.errors,
        },
      };
    }

    // 实体未找到
    if (exception instanceof NotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: baseBody,
      };
    }

    // 领域异常
    if (exception instanceof DomainException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: baseBody,
      };
    }

    // 应用异常
    if (exception instanceof ApplicationException) {
      // 并发冲突
      if (exception.code === "CONCURRENCY_CONFLICT") {
        return {
          status: HttpStatus.CONFLICT,
          body: baseBody,
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: baseBody,
      };
    }

    // 基础设施异常
    if (exception instanceof InfrastructureException) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        body: {
          ...baseBody,
          message: "服务暂时不可用，请稍后重试",
        },
      };
    }

    // 默认：500 错误
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: baseBody,
    };
  }
}

/**
 * 全局异常过滤器
 *
 * 捕获所有类型的异常（包括 NestJS 内置异常和非 BaseException）
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 如果是 BaseException，使用统一异常过滤器
    if (exception instanceof BaseException) {
      const filter = new UnifiedExceptionFilter();
      return filter.catch(exception, host);
    }

    // NestJS HttpException
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response, request);
    }

    // 标准 Error
    if (exception instanceof Error) {
      return this.handleStandardError(exception, response, request);
    }

    // 未知错误
    return this.handleUnknownError(exception, response, request);
  }

  private handleHttpException(exception: HttpException, response: Response, request: Request) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    this.logger.warn(`HTTP ${status}: ${exception.message}`, {
      path: request.url,
      method: request.method,
    });

    response.status(status).json({
      code: `HTTP_${status}`,
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleStandardError(error: Error, response: Response, request: Request) {
    this.logger.error(`未处理的错误: ${error.message}`, error.stack, {
      path: request.url,
      method: request.method,
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "服务器内部错误" : error.message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleUnknownError(error: unknown, response: Response, request: Request) {
    this.logger.error("未知错误类型", {
      error,
      path: request.url,
      method: request.method,
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: "UNKNOWN_ERROR",
      message: "服务器内部错误",
      timestamp: new Date().toISOString(),
    });
  }
}
