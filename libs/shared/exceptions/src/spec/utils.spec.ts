import { describe, expect, it } from "vitest";
import { ApplicationException } from "../lib/application.exception.js";
import { BusinessRuleException } from "../lib/business-rule.exception.js";
import { DomainException } from "../lib/domain.exception.js";
import { InfrastructureException } from "../lib/infrastructure.exception.js";
import {
  createExceptionContext,
  isApplicationException,
  isBaseException,
  isClientError,
  isDomainException,
  isInfrastructureException,
  isRetryable,
  toApplicationException,
  toDomainException,
} from "../lib/utils";
import { ValidationException } from "../lib/validation.exception.js";

describe("异常类型守卫", () => {
  describe("isBaseException", () => {
    it("应该识别 BaseException", () => {
      const error = new DomainException("测试", "TEST");
      expect(isBaseException(error)).toBe(true);
    });

    it("应该拒绝非 BaseException", () => {
      const error = new Error("测试");
      expect(isBaseException(error)).toBe(false);
    });
  });

  describe("isDomainException", () => {
    it("应该识别领域异常", () => {
      const error = new DomainException("测试", "TEST");
      expect(isDomainException(error)).toBe(true);
    });

    it("应该拒绝其他异常", () => {
      const error = new ApplicationException("测试", "TEST");
      expect(isDomainException(error)).toBe(false);
    });
  });

  describe("isApplicationException", () => {
    it("应该识别应用异常", () => {
      const error = new ApplicationException("测试", "TEST");
      expect(isApplicationException(error)).toBe(true);
    });

    it("应该拒绝其他异常", () => {
      const error = new DomainException("测试", "TEST");
      expect(isApplicationException(error)).toBe(false);
    });
  });

  describe("isInfrastructureException", () => {
    it("应该识别基础设施异常", () => {
      const error = new InfrastructureException("测试", "DB_CONNECTION_FAILED");
      expect(isInfrastructureException(error)).toBe(true);
    });

    it("应该拒绝其他异常", () => {
      const error = new DomainException("测试", "TEST");
      expect(isInfrastructureException(error)).toBe(false);
    });
  });
});

describe("异常转换", () => {
  describe("toDomainException", () => {
    it("应该保持领域异常不变", () => {
      const error = new DomainException("原始错误", "ORIGINAL");
      const converted = toDomainException(error);

      expect(converted).toBe(error);
    });

    it("应该转换标准错误为领域异常", () => {
      const error = new Error("标准错误");
      const converted = toDomainException(error);

      expect(converted).toBeInstanceOf(DomainException);
      expect(converted.message).toBe("标准错误");
      expect(converted.code).toBe("INTERNAL_ERROR");
      expect(converted.cause).toBe(error);
    });

    it("应该处理非错误类型", () => {
      const converted = toDomainException("字符串错误");

      expect(converted).toBeInstanceOf(DomainException);
      expect(converted.message).toBe("未知错误");
      expect(converted.code).toBe("UNKNOWN_ERROR");
    });
  });

  describe("toApplicationException", () => {
    it("应该保持应用异常不变", () => {
      const error = new ApplicationException("原始错误", "ORIGINAL");
      const converted = toApplicationException(error);

      expect(converted).toBe(error);
    });

    it("应该转换标准错误为应用异常", () => {
      const error = new Error("标准错误");
      const converted = toApplicationException(error);

      expect(converted).toBeInstanceOf(ApplicationException);
      expect(converted.message).toBe("标准错误");
      expect(converted.code).toBe("INTERNAL_ERROR");
      expect(converted.cause).toBe(error);
    });
  });
});

describe("createExceptionContext", () => {
  it("应该创建异常上下文", () => {
    const error = new DomainException("测试错误", "TEST_CODE", {
      context: { userId: "123" },
    });

    const context = createExceptionContext(error);

    expect(context.exceptionType).toBe("DomainException");
    expect(context.code).toBe("TEST_CODE");
    expect(context.message).toBe("测试错误");
    expect(context.context).toEqual({ userId: "123" });
    expect(context.timestamp).toBeDefined();
    expect(context.stack).toBeDefined();
  });
});

describe("isRetryable", () => {
  it("应该识别可重试的基础设施异常", () => {
    const error1 = new InfrastructureException("DB错误", "DB_CONNECTION_FAILED");
    const error2 = new InfrastructureException("服务不可用", "EXTERNAL_SERVICE_UNAVAILABLE");
    const error3 = new InfrastructureException("MQ错误", "MQ_UNAVAILABLE");

    expect(isRetryable(error1)).toBe(true);
    expect(isRetryable(error2)).toBe(true);
    expect(isRetryable(error3)).toBe(true);
  });

  it("应该识别可重试的并发冲突", () => {
    const error = new ApplicationException("并发冲突", "CONCURRENCY_CONFLICT");
    expect(isRetryable(error)).toBe(true);
  });

  it("应该拒绝不可重试的异常", () => {
    const error = new DomainException("业务错误", "BUSINESS_ERROR");
    expect(isRetryable(error)).toBe(false);
  });
});

describe("isClientError", () => {
  it("应该识别领域异常为客户端错误", () => {
    const error = new DomainException("测试", "TEST");
    expect(isClientError(error)).toBe(true);
  });

  it("应该识别业务规则违反为客户端错误", () => {
    const error = new BusinessRuleException("规则违反", "BUSINESS_RULE_VIOLATION");
    expect(isClientError(error)).toBe(true);
  });

  it("应该识别验证异常为客户端错误", () => {
    const error = new ValidationException("验证失败", "field", {
      code: "VALIDATION_ERROR",
    });
    expect(isClientError(error)).toBe(true);
  });

  it("应该拒绝基础设施异常", () => {
    const error = new InfrastructureException("DB错误", "DB_ERROR");
    expect(isClientError(error)).toBe(false);
  });
});
