/**
 * 异常示例控制器
 *
 * @description
 * 演示如何使用 @oksai/exceptions 中的各种异常类型
 */

import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  ApplicationException,
  BusinessRuleException,
  DomainException,
  InfrastructureException,
  NotFoundException,
  ValidationException,
} from "@oksai/exceptions";

@ApiTags("异常示例")
@Controller("examples/exceptions")
export class ExceptionExampleController {
  /**
   * 抛出领域异常
   *
   * @description
   * 演示领域层异常，例如业务规则验证失败
   */
  @Get("domain")
  @ApiOperation({ summary: "领域异常示例", description: "演示领域层异常（如业务规则验证失败）" })
  @ApiResponse({ status: 422, description: "领域异常" })
  throwDomainException(): never {
    throw new DomainException("用户余额不足", "INSUFFICIENT_BALANCE");
  }

  /**
   * 抛出应用异常
   *
   * @description
   * 演示应用层异常，例如并发冲突
   */
  @Get("application")
  @ApiOperation({ summary: "应用异常示例", description: "演示应用层异常（如并发冲突）" })
  @ApiResponse({ status: 409, description: "并发冲突" })
  throwApplicationException(): never {
    throw new ApplicationException("数据已被其他用户修改", "CONCURRENCY_CONFLICT");
  }

  /**
   * 抛出基础设施异常
   *
   * @description
   * 演示基础设施层异常，例如数据库连接失败
   */
  @Get("infrastructure")
  @ApiOperation({ summary: "基础设施异常示例", description: "演示基础设施层异常（如数据库连接失败）" })
  @ApiResponse({ status: 503, description: "服务不可用" })
  throwInfrastructureException(): never {
    throw new InfrastructureException("数据库连接失败", "DATABASE_CONNECTION_FAILED");
  }

  /**
   * 抛出验证异常
   *
   * @description
   * 演示验证异常，包含字段级别的错误信息
   */
  @Get("validation")
  @ApiOperation({ summary: "验证异常示例", description: "演示字段验证失败" })
  @ApiResponse({ status: 400, description: "验证失败" })
  throwValidationException(): never {
    throw new ValidationException("验证失败", undefined, {
      errors: [
        { field: "email", message: "必须是有效的邮箱地址" },
        { field: "email", message: "不能使用临时邮箱" },
      ],
    });
  }

  /**
   * 抛出未找到异常
   *
   * @description
   * 演示资源未找到异常
   */
  @Get("not-found/:id")
  @ApiOperation({ summary: "未找到异常示例", description: "演示资源未找到" })
  @ApiResponse({ status: 404, description: "资源未找到" })
  throwNotFoundException(@Param("id") id: string): never {
    throw new NotFoundException(`用户 ${id} 不存在`, "USER_NOT_FOUND");
  }

  /**
   * 抛出业务规则异常
   *
   * @description
   * 演示业务规则违反异常
   */
  @Get("business-rule")
  @ApiOperation({ summary: "业务规则异常示例", description: "演示业务规则违反" })
  @ApiResponse({ status: 422, description: "业务规则违反" })
  throwBusinessRuleException(): never {
    throw new BusinessRuleException("不能删除有订单的用户", "USER_HAS_ORDERS");
  }

  /**
   * 正常响应（对比）
   *
   * @description
   * 正常的响应，用于对比异常处理
   */
  @Get("success")
  @ApiOperation({ summary: "正常响应", description: "返回正常响应（用于对比）" })
  @ApiResponse({ status: 200, description: "成功", schema: { example: { message: "操作成功" } } })
  success(): { message: string } {
    return { message: "操作成功" };
  }
}
