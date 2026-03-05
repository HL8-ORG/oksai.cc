# @oksai/exceptions

统一异常体系 - 领域驱动设计的异常类型

## 安装

```bash
pnpm add @oksai/exceptions
```

## 快速开始

### 1. 领域异常

```typescript
import { DomainException, from "@oksai/exceptions";

// 实体不存在
throw new DomainException("任务不存在", "JOB_NOT_FOUND");

// 领域规则违反
throw new DomainException("订单金额不能为负数", "INVALID_ORDER_AMOUNT");

// 带上下文
throw new DomainException("任务已完成，无法修改", "JOB_ALREADY_COMPLETED", {
  context: { jobId: "job-123", status: "completed" }
});
```

```

### 2. 应用异常

```typescript
import { ApplicationException } from "@oksai/exceptions";

// 用例执行失败
throw new ApplicationException("创建订单用例失败", "CREATE_ORDER_failed");

// 并发冲突
throw new ApplicationException("数据已被其他用户修改， "CONCURRENCY_CONFLICT");
```

```

### 3. 基础设施异常

```typescript
import { InfrastructureException } from "@oksai/exceptions";

// 数据库连接失败
throw new InfrastructureException("数据库连接失败", "DB_CONNECTION_FAILED", {
  cause: originalError,
});
```
```

### 4. 验证异常

```typescript
import { ValidationException } from "@oksai/exceptions";

// 单个字段验证
throw new ValidationException("用户名不能为空", "username");

// 多个字段验证
throw ValidationException.forFields([
  { field: "email", message: "邮箱格式不正确" },
  { field: "password", message: "密码长度至少 8 位" }
]);
```
```

### 5. 业务规则异常

```typescript
import { BusinessRuleException } from "@oksai/exceptions";

// 简单规则
throw new BusinessRuleException("订单金额超出预算限制");

// 带规则名称
throw new BusinessRuleException("超出预算限制", "BUDGET_LIMIT_EXCEEDED");
```
```

### 6. 实体未找到

```typescript
import { NotFoundException } from "@oksai/exceptions";

// 简单用法
throw new NotFoundException("用户", "user-123");

// 静态工厂方法
throw NotFoundException.forEntity("订单", "order-456");
```
```

### 7. NestJS 集成

```typescript
// 在模块中全局注册异常过滤器
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GlobalExceptionFilter } from "@oksai/exceptions";

import { UsersController } from "./users.controller";

import { UsersService } from "./users.service";

import { UsersRepository } from "./users.repository";

import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    DatabaseModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
```
```

## API 文档

### 异常代码

所有异常都包含一个唯一的代码，便于日志、监控和前端处理：

```typescript
import { ExceptionCode } from "@oksai/exceptions";

// 领域异常
ExceptionCode.ENTITY_NOT_FOUND
ExceptionCode.INVALID_STATE
ExceptionCode.BUSINESS_RULE_VIOLATION

// 应用异常
ExceptionCode.USE_CASE_FAILED
ExceptionCode.CONCURRENCY_CONFLICT

// 基础设施异常
ExceptionCode.DB_CONNECTION_FAILED
ExceptionCode.MQ_UNAVAILABLE

ExceptionCode.CACHE_ERROR
```

```
### HTTP 状态码映射

- `DomainException` → 422 (Unprocessable Entity)
- `ApplicationException` → 500 (Internal Server Error) 或 409 (Conflict)
- `InfrastructureException` → 503 (Service Unavailable)
- `ValidationException` → 400 (Bad Request)
- `NotFoundException` → 404 (Not Found)
- `BusinessRuleException` → 422 (Unprocessable Entity)

```

```
### 工具函数

```typescript
import {
  isBaseException,
  isDomainException,
  toDomainException,
  createExceptionContext,
  isRetryable,
  isClientError,
} from "@oksai/exceptions";

// 类型守卫
if (isDomainException(error)) {
  // TypeScript 知道这是 DomainException
  console.log("领域异常:", error.code);
}

```
```

## 最佳实践

1. **统一异常体系**： 所有异常继承自 `BaseException`
2. **清晰的错误信息**： 提供有意义的错误消息和代码
3. **上下文信息**： 包含有助于调试的上下文数据
4. **错误原因链**： 使用 `cause` 保留原始错误
5. **HTTP 映射**： 使用 NestJS 过滤器统一处理异常
6. **日志记录**： 记录异常的完整上下文

7. **前端友好**： 返回结构化的错误信息给前端
8. **测试覆盖**： 为异常处理编写单元测试

```

```
## 测试

```bash
pnpm test
```

## 构建

```bash
pnpm build
```

## 类型检查

```bash
pnpm typecheck
```

## License

AGPL-3.0
