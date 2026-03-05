# @oksai/context 使用指南 - 避免硬编码

## 概述

`@oksai/context` 提供多租户上下文管理，帮助避免硬编码租户、用户、请求相关信息。

**核心价值：**
- 🎯 **避免硬编码**：统一管理上下文字段名称
- 🔄 **自动传递**：在请求链路中自动传递上下文
- 🛡️ **类型安全**：TypeScript 类型保护
- 🇨🇳 **中文文档**：完整的中文注释和文档

## 常见硬编码问题

### ❌ 硬编码示例

```typescript
// ❌ 硬编码 Header 名称
@Headers("x-user-id") userId: string
@Headers("x-tenant-id") tenantId: string
@Headers("x-request-id") requestId: string

// ❌ 硬编码字段名
const data = {
  tenantId: "xxx",
  userId: "yyy",
  correlationId: "zzz"
};

// ❌ 硬编码常量
const TENANT_ID_HEADER = "x-tenant-id";
const USER_ID_KEY = "userId";
```

### ✅ 使用 @oksai/context 和 @oksai/constants

```typescript
// ✅ 使用常量
import { TENANT_ID_HEADER, REQUEST_ID_HEADER, USER_ID_KEY } from "@oksai/constants";

@Headers(TENANT_ID_HEADER) tenantId: string
@Headers(REQUEST_ID_HEADER) requestId: string

// ✅ 使用上下文服务
import { TenantContextService } from "@oksai/context";

@Injectable()
export class UserService {
  constructor(private readonly contextService: TenantContextService) {}
  
  async createUser() {
    // 自动获取当前租户和用户
    const tenantId = this.contextService.tenantId;
    const userId = this.contextService.userId;
    const correlationId = this.contextService.correlationId;
  }
}
```

## 安装和配置

### 1. 添加依赖

```json
{
  "dependencies": {
    "@oksai/constants": "workspace:*",
    "@oksai/context": "workspace:*"
  }
}
```

### 2. 在模块中导入

```typescript
import { Module } from "@nestjs/common";
import { AsyncLocalStorageProvider } from "@oksai/context";
import { TenantContextService } from "@oksai/context";

@Module({
  providers: [
    AsyncLocalStorageProvider,  // 必须提供
    TenantContextService,        // 上下文服务
  ],
  exports: [TenantContextService],
})
export class AppModule {}
```

## 使用方式

### 1. 在中间件中设置上下文

```typescript
import { Injectable, NestMiddleware } from "@nestjs/common";
import { TenantContextService, TenantContext } from "@oksai/context";
import { TENANT_ID_HEADER, REQUEST_ID_HEADER } from "@oksai/constants";
import type { Request, Response, NextFunction } from "express";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly contextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 从 Header 中获取租户信息（使用常量，避免硬编码）
    const tenantId = req.headers[TENANT_ID_HEADER] as string;
    const userId = req.headers[USER_ID_KEY] as string;
    const correlationId = req.headers[REQUEST_ID_HEADER] as string || generateRequestId();

    // 创建上下文
    const context = TenantContext.create({
      tenantId,
      userId,
      correlationId,
    });

    // 在上下文中运行后续逻辑
    this.contextService.run(context, () => {
      next();
    });
  }
}
```

### 2. 在服务中使用上下文

```typescript
import { Injectable } from "@nestjs/common";
import { TenantContextService } from "@oksai/context";

@Injectable()
export class OrderService {
  constructor(private readonly contextService: TenantContextService) {}

  async createOrder(orderData: any) {
    // ✅ 自动获取当前租户和用户（避免硬编码传递）
    const tenantId = this.contextService.tenantId;
    const userId = this.contextService.userId;
    const correlationId = this.contextService.correlationId;

    // 创建订单时自动关联租户和用户
    const order = await this.orderRepository.create({
      ...orderData,
      tenantId,        // 自动注入
      createdBy: userId, // 自动注入
      correlationId,   // 用于追踪
    });

    return order;
  }

  async getOrders() {
    // ✅ 自动按租户过滤（避免手动传递 tenantId）
    const tenantId = this.contextService.tenantId;
    
    return this.orderRepository.findMany({
      where: { tenantId }, // 自动租户隔离
    });
  }
}
```

### 3. 在控制器中使用常量（避免硬编码）

```typescript
import { Controller, Headers, Get } from "@nestjs/common";
import { TENANT_ID_HEADER, REQUEST_ID_HEADER } from "@oksai/constants";

@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ✅ 使用常量而非硬编码字符串
  @Get()
  async list(@Headers(TENANT_ID_HEADER) tenantId: string) {
    // tenantId 已经通过常量定义，避免拼写错误
    return this.orderService.getOrders();
  }
}
```

### 4. 在日志中自动注入上下文

```typescript
import { Injectable } from "@nestjs/common";
import { OksaiLoggerService } from "@oksai/logger";
import { TenantContextService } from "@oksai/context";

@Injectable()
export class UserService {
  constructor(
    private readonly logger: OksaiLoggerService,
    private readonly contextService: TenantContextService,
  ) {
    this.logger.setContext(UserService.name);
  }

  async createUser(data: CreateUserDto) {
    // ✅ 日志会自动包含 tenantId, userId, correlationId（无需手动传递）
    this.logger.log("创建用户", { email: data.email });
    
    // 输出示例：
    // {
    //   "msg": "创建用户",
    //   "email": "user@example.com",
    //   "tenantId": "tenant-abc",      // 自动注入
    //   "userId": "user-123",          // 自动注入
    //   "correlationId": "req-456"     // 自动注入
    // }
  }
}
```

## 可用常量

### 从 @oksai/constants 导入

```typescript
import {
  // 租户相关
  TENANT_ID_HEADER,      // "x-tenant-id"
  TENANT_CONTEXT_KEY,    // "tenantContext"
  
  // 用户相关
  USER_ID_KEY,           // "userId"
  JWT_PAYLOAD_KEY,       // "jwtPayload"
  
  // 请求相关
  REQUEST_ID_HEADER,     // "x-request-id"
  
  // 分页相关
  DEFAULT_PAGE_NUMBER,   // 1
  DEFAULT_PAGE_SIZE,     // 20
  MAX_PAGE_SIZE,         // 100
  
  // 日志相关
  DEFAULT_LOG_LEVEL,     // "info"
  
  // 超时相关
  DEFAULT_HTTP_TIMEOUT_MS,        // 30000
  DEFAULT_JWT_EXPIRES_IN_MS,      // 86400000
} from "@oksai/constants";
```

## TenantContextService API

### 属性访问

```typescript
@Injectable()
export class MyService {
  constructor(private readonly contextService: TenantContextService) {}

  method() {
    // 获取当前租户 ID（如果没有上下文，返回空字符串）
    const tenantId = this.contextService.tenantId;
    
    // 获取当前用户 ID（如果没有，返回 undefined）
    const userId = this.contextService.userId;
    
    // 获取关联 ID（如果没有上下文，返回空字符串）
    const correlationId = this.contextService.correlationId;
    
    // 获取完整上下文（可能 undefined）
    const context = this.contextService.getContext();
    
    // 获取上下文，如果没有则抛出异常
    const contextOrThrow = this.contextService.getContextOrThrow();
  }
}
```

### 上下文运行

```typescript
import { TenantContext } from "@oksai/context";

// 创建上下文
const context = TenantContext.create({
  tenantId: "tenant-123",
  userId: "user-456",
  correlationId: "req-789", // 可选
});

// 在上下文中运行
this.contextService.run(context, () => {
  // 在这个回调函数中，所有代码都能访问到上下文
  console.log(this.contextService.tenantId);  // "tenant-123"
  console.log(this.contextService.userId);    // "user-456"
});
```

## 迁移指南

### 1. 替换硬编码的 Header 名称

```typescript
// ❌ 旧代码
@Headers("x-user-id") userId: string
@Headers("x-tenant-id") tenantId: string
@Headers("x-request-id") requestId: string

// ✅ 新代码
import { TENANT_ID_HEADER, REQUEST_ID_HEADER, USER_ID_KEY } from "@oksai/constants";

@Headers(USER_ID_KEY) userId: string
@Headers(TENANT_ID_HEADER) tenantId: string
@Headers(REQUEST_ID_HEADER) requestId: string
```

### 2. 替换手动传递租户 ID

```typescript
// ❌ 旧代码（手动传递）
async createOrder(orderData: any, tenantId: string, userId: string) {
  const order = await this.orderRepository.create({
    ...orderData,
    tenantId,
    createdBy: userId,
  });
  return order;
}

// ✅ 新代码（自动注入）
async createOrder(orderData: any) {
  const tenantId = this.contextService.tenantId;
  const userId = this.contextService.userId;
  
  const order = await this.orderRepository.create({
    ...orderData,
    tenantId,
    createdBy: userId,
  });
  return order;
}
```

### 3. 替换硬编码的魔术字符串

```typescript
// ❌ 旧代码
const data = {
  "x-user-id": userId,
  "x-tenant-id": tenantId,
};

// ✅ 新代码
import { TENANT_ID_HEADER, USER_ID_KEY } from "@oksai/constants";

const data = {
  [USER_ID_KEY]: userId,
  [TENANT_ID_HEADER]: tenantId,
};
```

## 最佳实践

### 1. 在中间件中尽早设置上下文

```typescript
// main.ts 或 app.module.ts
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes("*"); // 所有路由
  }
}
```

### 2. 使用上下文服务而非手动传递

```typescript
// ❌ 不推荐：手动传递
async method(tenantId: string, userId: string) {
  // ...
}

// ✅ 推荐：使用上下文服务
async method() {
  const tenantId = this.contextService.tenantId;
  const userId = this.contextService.userId;
  // ...
}
```

### 3. 所有常量从 @oksai/constants 导入

```typescript
// ❌ 不推荐：本地定义常量
const MY_TENANT_HEADER = "x-tenant-id";

// ✅ 推荐：使用共享常量
import { TENANT_ID_HEADER } from "@oksai/constants";
```

### 4. 在后台任务中传递上下文

```typescript
import { runWithOksaiContext } from "@oksai/context";

// 后台任务
async processInBackground() {
  const context = this.contextService.getContext();
  
  // 在新异步上下文中运行
  runWithOksaiContext(context, async () => {
    // 这里可以访问租户上下文
    const tenantId = this.contextService.tenantId;
    await this.doWork();
  });
}
```

## 完整示例

### 订单服务示例

```typescript
import { Injectable } from "@nestjs/common";
import { TenantContextService, TenantContext } from "@oksai/context";
import { OksaiLoggerService } from "@oksai/logger";

@Injectable()
export class OrderService {
  constructor(
    private readonly contextService: TenantContextService,
    private readonly logger: OksaiLoggerService,
  ) {
    this.logger.setContext(OrderService.name);
  }

  async createOrder(orderData: CreateOrderDto) {
    // ✅ 自动获取租户和用户上下文
    const tenantId = this.contextService.tenantId;
    const userId = this.contextService.userId;
    const correlationId = this.contextService.correlationId;

    // ✅ 日志自动包含上下文
    this.logger.log("创建订单", { orderData });

    // ✅ 自动租户隔离
    const order = await this.orderRepository.create({
      ...orderData,
      tenantId,
      createdBy: userId,
      correlationId, // 用于追踪整个请求链路
    });

    this.logger.log("订单创建成功", { orderId: order.id });

    return order;
  }

  async getOrders() {
    // ✅ 自动按租户过滤
    const tenantId = this.contextService.tenantId;

    return this.orderRepository.findMany({
      where: { tenantId },
    });
  }
}
```

## 故障排除

### 上下文为空

```typescript
// 检查是否在上下文中运行
const context = this.contextService.getContext();
if (!context) {
  // 不在上下文中，可能：
  // 1. 中间件未配置
  // 2. 在异步任务中（需要使用 runWithOksaiContext）
  console.warn("没有租户上下文");
}
```

### 常量未找到

```bash
# 确保已安装依赖
pnpm add @oksai/constants @oksai/context
```

## 总结

### 避免硬编码的好处

1. **类型安全**：TypeScript 会检查常量引用
2. **易于维护**：修改常量只需在一处更新
3. **避免拼写错误**：使用常量而非字符串字面量
4. **代码提示**：IDE 自动补全常量名称
5. **统一管理**：所有常量集中在一个地方

### 使用 @oksai/context 的好处

1. **自动传递**：无需手动传递 tenantId、userId
2. **类型安全**：完整的 TypeScript 支持
3. **易于测试**：可以轻松模拟上下文
4. **日志集成**：自动注入日志上下文
5. **请求追踪**：自动传递 correlationId

**推荐在所有后端服务中使用 `@oksai/context` 和 `@oksai/constants`，避免硬编码！**
