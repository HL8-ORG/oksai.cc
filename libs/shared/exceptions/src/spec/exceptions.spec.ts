import { describe, expect, it } from "vitest";
import { ApplicationException } from "../lib/application.exception";
import { BaseException } from "../lib/base.exception";
import { BusinessRuleException } from "../lib/business-rule.exception";
import { ExceptionCode } from "../lib/codes";
import { DomainException } from "../lib/domain.exception";
import { InfrastructureException } from "../lib/infrastructure.exception";
import { NotFoundException } from "../lib/not-found.exception";
import { type ValidationError, ValidationException } from "../lib/validation.exception";

describe("异常代码枚举", () => {
  it("应该定义所有异常代码", () => {
    expect(ExceptionCode.ENTITY_NOT_FOUND).toBe("ENTITY_NOT_FOUND");
    expect(ExceptionCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ExceptionCode.DB_CONNECTION_FAILED).toBe("DB_CONNECTION_FAILED");
  });
});

describe("BaseException", () => {
  it("应该创建基础异常", () => {
    class TestException extends BaseException {
      constructor(message: string) {
        super(message, "TEST_ERROR");
      }
    }

    const error = new TestException("测试异常");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error.message).toBe("测试异常");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.name).toBe("TestException");
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it("应该支持错误原因链", () => {
    const cause = new Error("原始错误");
    class TestException extends BaseException {
      constructor() {
        super("测试", "TEST", { cause });
      }
    }

    const error = new TestException();
    expect(error.cause).toBe(cause);
  });

  it("应该支持上下文信息", () => {
    class TestException extends BaseException {
      constructor() {
        super("测试", "TEST", {
          context: { userId: "123", action: "delete" },
        });
      }
    }

    const error = new TestException();
    expect(error.context).toEqual({ userId: "123", action: "delete" });
  });

  it("应该支持序列化为 JSON", () => {
    class TestException extends BaseException {
      constructor() {
        super("测试", "TEST", {
          context: { key: "value" },
        });
      }
    }

    const error = new TestException();
    const json = error.toJSON();

    expect(json.name).toBe("TestException");
    expect(json.code).toBe("TEST");
    expect(json.message).toBe("测试");
    expect(json.context).toEqual({ key: "value" });
    expect(json.timestamp).toBeDefined();
  });

  it("应该支持获取完整消息", () => {
    class TestException extends BaseException {
      constructor() {
        super("测试", "TEST", {
          context: { userId: "123" },
        });
      }
    }

    const error = new TestException();
    const fullMessage = error.getFullMessage();

    expect(fullMessage).toContain("[TEST]");
    expect(fullMessage).toContain("测试");
    expect(fullMessage).toContain("userId");
  });
});

describe("DomainException", () => {
  it("应该创建领域异常", () => {
    const error = new DomainException("任务不存在", "JOB_NOT_FOUND");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error).toBeInstanceOf(DomainException);
    expect(error.message).toBe("任务不存在");
    expect(error.code).toBe("JOB_NOT_FOUND");
    expect(error.name).toBe("DomainException");
  });

  it("应该支持错误原因链", () => {
    const cause = new Error("原始错误");
    const error = new DomainException("操作失败", "OPERATION_FAILED", { cause });

    expect(error.cause).toBe(cause);
  });

  it("应该支持额外上下文信息", () => {
    const error = new DomainException("验证失败", "VALIDATION_FAILED", {
      context: { field: "name", value: "" },
    });

    expect(error.context).toEqual({ field: "name", value: "" });
  });
});

describe("ApplicationException", () => {
  it("应该创建应用异常", () => {
    const error = new ApplicationException("用例执行失败", "USE_CASE_FAILED");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error).toBeInstanceOf(ApplicationException);
    expect(error.message).toBe("用例执行失败");
    expect(error.code).toBe("USE_CASE_FAILED");
    expect(error.name).toBe("ApplicationException");
  });
});

describe("InfrastructureException", () => {
  it("应该创建基础设施异常", () => {
    const error = new InfrastructureException("数据库连接失败", "DB_CONNECTION_FAILED");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error).toBeInstanceOf(InfrastructureException);
    expect(error.message).toBe("数据库连接失败");
    expect(error.code).toBe("DB_CONNECTION_FAILED");
    expect(error.name).toBe("InfrastructureException");
  });
});

describe("ValidationException", () => {
  it("应该创建验证异常", () => {
    const error = new ValidationException("用户名不能为空", "name");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error).toBeInstanceOf(ValidationException);
    expect(error.message).toBe("用户名不能为空");
    expect(error.field).toBe("name");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.name).toBe("ValidationException");
  });

  it("应该支持多个验证错误", () => {
    const errors: ValidationError[] = [
      { field: "name", message: "名称不能为空" },
      { field: "email", message: "邮箱格式不正确" },
    ];

    const error = new ValidationException("验证失败", undefined, { errors });

    expect(error.errors).toHaveLength(2);
    expect(error.errors).toEqual(errors);
  });

  it("应该支持自定义异常代码", () => {
    const error = new ValidationException("密码不符合要求", "password", {
      code: "INVALID_PASSWORD",
    });

    expect(error.code).toBe("INVALID_PASSWORD");
  });

  it("应该支持静态工厂方法 forField", () => {
    const error = ValidationException.forField("email", "邮箱格式不正确", "invalid");

    expect(error).toBeInstanceOf(ValidationException);
    expect(error.field).toBe("email");
    expect(error.message).toBe("邮箱格式不正确");
    expect(error.context).toEqual({ value: "invalid" });
  });

  it("应该支持静态工厂方法 forFields", () => {
    const errors: ValidationError[] = [
      { field: "name", message: "名称不能为空" },
      { field: "email", message: "邮箱格式不正确" },
    ];

    const error = ValidationException.forFields(errors);

    expect(error).toBeInstanceOf(ValidationException);
    expect(error.errors).toEqual(errors);
    expect(error.message).toBe("验证失败");
  });

  it("应该支持序列化（包含字段和错误列表）", () => {
    const errors: ValidationError[] = [{ field: "name", message: "名称不能为空" }];

    const error = new ValidationException("验证失败", "name", { errors });
    const json = error.toJSON();

    expect(json.field).toBe("name");
    expect(json.errors).toEqual(errors);
  });
});

describe("BusinessRuleException", () => {
  it("应该创建业务规则异常", () => {
    const error = new BusinessRuleException("任务必须包含至少一个任务项");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error).toBeInstanceOf(BusinessRuleException);
    expect(error.message).toBe("任务必须包含至少一个任务项");
    expect(error.code).toBe("BUSINESS_RULE_VIOLATION");
    expect(error.name).toBe("BusinessRuleException");
  });

  it("应该支持规则名称", () => {
    const error = new BusinessRuleException("超出预算限制", "BUDGET_LIMIT_EXCEEDED");

    expect(error.rule).toBe("BUDGET_LIMIT_EXCEEDED");
    expect(error.code).toBe("BUDGET_LIMIT_EXCEEDED");
  });

  it("应该支持上下文信息", () => {
    const error = new BusinessRuleException("超出预算限制", "BUDGET_LIMIT_EXCEEDED", {
      context: { limit: 10000, actual: 15000 },
    });

    expect(error.context).toEqual({ limit: 10000, actual: 15000 });
  });
});

describe("NotFoundException", () => {
  it("应该创建未找到异常", () => {
    const error = new NotFoundException("任务", "job-123");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseException);
    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.message).toBe("未找到任务: job-123");
    expect(error.entityType).toBe("任务");
    expect(error.identifier).toBe("job-123");
    expect(error.code).toBe("ENTITY_NOT_FOUND");
    expect(error.name).toBe("NotFoundException");
  });

  it("应该在上下文中包含实体信息", () => {
    const error = new NotFoundException("用户", "user-456");

    expect(error.context).toEqual({
      entityType: "用户",
      identifier: "user-456",
    });
  });

  it("应该支持静态工厂方法 forEntity", () => {
    const error = NotFoundException.forEntity("订单", "order-789");

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.entityType).toBe("订单");
    expect(error.identifier).toBe("order-789");
  });

  it("应该支持错误原因", () => {
    const cause = new Error("数据库查询失败");
    const error = new NotFoundException("任务", "job-123", { cause });

    expect(error.cause).toBe(cause);
  });
});

describe("异常类型检查", () => {
  it("应该能区分不同类型的异常", () => {
    const domainError = new DomainException("领域错误", "DOMAIN_ERROR");
    const appError = new ApplicationException("应用错误", "APP_ERROR");
    const infraError = new InfrastructureException("基础设施错误", "INFRA_ERROR");
    const validationError = new ValidationException("验证错误", "field");
    const notFoundError = new NotFoundException("实体", "id");

    // 类型检查
    expect(domainError instanceof DomainException).toBe(true);
    expect(domainError instanceof ApplicationException).toBe(false);

    expect(appError instanceof ApplicationException).toBe(true);
    expect(appError instanceof InfrastructureException).toBe(false);

    expect(infraError instanceof InfrastructureException).toBe(true);
    expect(infraError instanceof DomainException).toBe(false);

    expect(validationError instanceof ValidationException).toBe(true);
    expect(validationError instanceof DomainException).toBe(false);

    expect(notFoundError instanceof NotFoundException).toBe(true);
    expect(notFoundError instanceof DomainException).toBe(false);

    // 所有异常都是 BaseException
    expect(domainError instanceof BaseException).toBe(true);
    expect(appError instanceof BaseException).toBe(true);
    expect(infraError instanceof BaseException).toBe(true);
    expect(validationError instanceof BaseException).toBe(true);
    expect(notFoundError instanceof BaseException).toBe(true);
  });
});

describe("异常代码枚举使用", () => {
  it("应该支持使用异常代码枚举", () => {
    const error = new DomainException("实体未找到", ExceptionCode.ENTITY_NOT_FOUND);

    expect(error.code).toBe("ENTITY_NOT_FOUND");
  });

  it("应该支持混合使用字符串和枚举", () => {
    const error1 = new DomainException("错误1", "CUSTOM_ERROR");
    const error2 = new DomainException("错误2", ExceptionCode.INVALID_STATE);

    expect(error1.code).toBe("CUSTOM_ERROR");
    expect(error2.code).toBe("INVALID_STATE");
  });
});
