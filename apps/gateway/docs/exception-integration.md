# 异常系统集成指南

## 概述

Gateway 已集成 `@oksai/exceptions`，提供统一的异常处理体系。

## 架构

### 异常类型

1. **DomainException** - 领域层异常（422）
   - 业务规则验证失败
   - 实体状态不满足要求

2. **ApplicationException** - 应用层异常（409/500）
   - 用例执行失败
   - 并发冲突

3. **InfrastructureException** - 基础设施异常（503）
   - 数据库连接失败
   - 外部服务不可用

4. **ValidationException** - 验证异常（400）
   - 字段验证失败
   - 输入格式错误

5. **NotFoundException** - 资源未找到（404）
   - 实体不存在
   - 资源无法找到

### 全局过滤器

Gateway 使用 `GlobalExceptionFilter` 处理所有异常：

```typescript
// app.module.ts
import { GlobalExceptionFilter } from "@oksai/exceptions";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## 使用示例

### 1. 领域异常

```typescript
import { DomainException } from "@oksai/exceptions";

// 用户余额不足
if (user.balance < amount) {
  throw new DomainException("余额不足", "INSUFFICIENT_BALANCE");
}

// 订单状态不允许取消
if (order.status !== "pending") {
  throw new DomainException("只能取消待处理订单", "INVALID_ORDER_STATUS");
}
```

**响应（422 Unprocessable Entity）：**
```json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "余额不足",
  "timestamp": "2024-03-06T12:00:00.000Z"
}
```

### 2. 应用异常
```typescript
import { ApplicationException } from "@oksai/exceptions";

// 并发冲突（乐观锁失败）
if (currentVersion !== expectedVersion) {
  throw new ApplicationException("数据已被其他用户修改", "CONCURRENCY_CONFLICT");
}

// 业务流程执行失败
throw new ApplicationException("订单处理失败", "ORDER_PROCESSING_FAILED");
```

**响应（409 Conflict 或 500 Internal Server Error）：**
```json
{
  "code": "CONCURRENCY_CONFLICT",
  "message": "数据已被其他用户修改",
  "timestamp": "2024-03-06T12:00:00.000Z"
}
```

### 3. 基础设施异常
```typescript
import { InfrastructureException } from "@oksai/exceptions";

try {
  await this.database.query(...);
} catch (error) {
  throw new InfrastructureException(
    "数据库连接失败",
    "DATABASE_CONNECTION_FAILED",
    { cause: error }
  );
}
```

**响应（503 Service Unavailable）：**
```json
{
  "code": "DATABASE_CONNECTION_FAILED",
  "message": "服务暂时不可用，请稍后重试",
  "timestamp": "2024-03-06T12:00:00.000Z"
}
```

### 4. 验证异常
```typescript
import { ValidationException } from "@oksai/exceptions";

// 单个字段验证失败
throw new ValidationException("邮箱格式不正确", "email");

// 多个字段验证失败
throw new ValidationException("验证失败", undefined, {
  errors: [
    { field: "email", message: "必须是有效的邮箱地址" },
    { field: "password", message: "密码长度至少 8 位" }
  ]
});

// 使用静态方法
throw ValidationException.forField("email", "邮箱格式不正确");
```

**响应（400 Bad Request）：**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "验证失败",
  "timestamp": "2024-03-06T12:00:00.000Z",
  "field": "email",
  "errors": [
    { "field": "email", "message": "必须是有效的邮箱地址" }
  ]
}
```

### 5. 未找到异常
```typescript
import { NotFoundException } from "@oksai/exceptions";

// 用户不存在
const user = await this.userRepository.findById(userId);
if (!user) {
  throw new NotFoundException(`用户 ${userId} 不存在`, "USER_NOT_FOUND");
}
```

**响应（404 Not Found）：**
```json
{
  "code": "USER_NOT_FOUND",
  "message": "用户 xxx 不存在",
  "timestamp": "2024-03-06T12:00:00.000Z"
}
```

## HTTP 状态码映射

| 异常类型 | HTTP 状态码 | 说明 |
|---------|------------|------|
| `ValidationException` | 400 | 验证失败 |
| `NotFoundException` | 404 | 资源未找到 |
| `ApplicationException` (CONCURRENCY_CONFLICT) | 409 | 并发冲突 |
| `DomainException` | 422 | 业务规则违反 |
| `ApplicationException` | 500 | 应用错误 |
| `InfrastructureException` | 503 | 服务不可用 |

## 最佳实践

### 1. 使用有意义的错误代码
```typescript
// ✅ 做法使用清晰的错误代码
throw new DomainException("余额不足", "INSUFFICIENT_BALANCE");

// ❌ 避免使用通用错误代码
throw new DomainException("余额不足", "ERROR");
```

### 2. 添加上下文信息
```typescript
throw new DomainException("订单处理失败", "ORDER_PROCESSING_FAILED", {
  context: {
    orderId: order.id,
    userId: user.id,
    currentStatus: order.status
  }
});
```

### 3. 包装底层异常
```typescript
try {
  await this.externalService.call();
} catch (error) {
  throw new InfrastructureException(
    "外部服务调用失败",
    "EXTERNAL_SERVICE_ERROR",
    { cause: error }
  );
}
```

## 测试示例

访问测试端点查看不同异常的响应：

```bash
# 领域异常（422）
curl http://localhost:3000/api/examples/exceptions/domain

# 应用异常（409）
curl http://localhost:3000/api/examples/exceptions/application

# 基础设施异常（503）
curl http://localhost:3000/api/examples/exceptions/infrastructure

# 验证异常（400）
curl http://localhost:3000/api/examples/exceptions/validation

# 未找到异常（404）
curl http://localhost:3000/api/examples/exceptions/not-found/123

# 正常响应（200）
curl http://localhost:3000/api/examples/exceptions/success
```

## 相关文件

- `/apps/gateway/src/app.module.ts` - 全局异常过滤器注册
- `/apps/gateway/src/examples/exception-example.controller.ts` - 异常示例控制器
- `/libs/shared/exceptions` - 异常库源码
