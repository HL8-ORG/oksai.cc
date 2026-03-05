# 契约（Contracts）集中管理指南

## 概述

契约是服务间通信的协议定义，在 `@oksai/constants` 库中集中管理：

- 📋 **API 契约**：HTTP 接口的请求/响应结构
- 🎭 **事件契约**：事件名称和 Payload 类型  
- 📨 **消息契约**：消息队列的 DTO
- ❌ **错误代码契约**：统一的错误码定义

## 目录结构

```
libs/shared/constants/src/lib/contracts/
├── index.ts                      # 契约导出入口
├── api/                          # API 契约
│   ├── user.contract.ts          # 用户 API 契约
│   ├── tenant.contract.ts        # 租户 API 契约
│   ├── auth.contract.ts          # 认证 API 契约
│   └── order.contract.ts         # 订单 API 契约
├── events/                       # 事件契约
│   ├── user.events.ts            # 用户事件
│   ├── tenant.events.ts          # 租户事件
│   └── order.events.ts           # 订单事件
├── messages/                     # 消息契约
│   ├── email.contract.ts         # 邮件消息
│   └── notification.contract.ts  # 通知消息
└── errors/                       # 错误代码契约
    └── error-codes.contract.ts   # 错误码定义
```

## 使用方式

### 1. 导入契约

```typescript
import {
  // API 契约
  USER_API_ENDPOINTS,
  CreateUserRequest,
  UserResponse,
  
  // 事件契约
  USER_EVENTS,
  UserCreatedPayload,
  
  // 消息契约
  EMAIL_MESSAGE_TYPES,
  EmailMessage,
  
  // 错误代码
  ERROR_CODES,
  ApiErrorResponse
} from "@oksai/constants";
```

### 2. 使用 API 契约

**控制器中使用路由常量：**

```typescript
import { USER_API_PREFIX, USER_API_ENDPOINTS } from "@oksai/constants";

@Controller(USER_API_PREFIX)
export class UserController {
  @Get(USER_API_ENDPOINTS.LIST)
  async list(@Query() query: UserQueryParams): Promise<UserListResponse> {
    return this.userService.list(query);
  }

  @Post(USER_API_ENDPOINTS.CREATE)
  async create(@Body() dto: CreateUserRequest): Promise<UserResponse> {
    return this.userService.create(dto);
  }

  @Get(USER_API_ENDPOINTS.GET)
  async get(@Param("id") id: string): Promise<UserResponse> {
    return this.userService.get(id);
  }
}
```

**使用请求/响应 DTO：**

```typescript
import { CreateUserRequest, UserResponse } from "@oksai/constants";

@Injectable()
export class UserService {
  async create(dto: CreateUserRequest): Promise<UserResponse> {
    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      password: await hash(dto.password),
      displayName: dto.displayName,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
    });

    return this.toResponse(user);
  }

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
```

### 3. 使用事件契约

**发布事件：**

```typescript
import { USER_EVENTS, UserCreatedPayload } from "@oksai/constants";

@Injectable()
export class UserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async create(dto: CreateUserRequest): Promise<UserResponse> {
    const user = await this.userRepository.create(dto);

    // 发布用户创建事件
    const payload: UserCreatedPayload = {
      eventId: generateId(),
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        userId: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        tenantId: user.tenantId,
        createdBy: user.createdBy,
      },
    };

    this.eventEmitter.emit(USER_EVENTS.USER_CREATED, payload);

    return this.toResponse(user);
  }
}
```

**监听事件：**

```typescript
import { USER_EVENTS, UserCreatedPayload } from "@oksai/constants";

@Injectable()
export class EmailService {
  @OnEvent(USER_EVENTS.USER_CREATED)
  async handleUserCreated(payload: UserCreatedPayload) {
    // 发送欢迎邮件
    await this.sendWelcomeEmail(payload.data.email, payload.data.username);
  }
}
```

### 4. 使用消息契约

**发送邮件消息：**

```typescript
import { EMAIL_MESSAGE_TYPES, EmailMessage, VerificationEmailPayload } from "@oksai/constants";

@Injectable()
export class EmailService {
  async sendVerificationEmail(email: string, username: string, token: string) {
    const templateData: VerificationEmailPayload = {
      token,
      verificationUrl: `${process.env.APP_URL}/verify-email?token=${token}`,
      expiresInHours: 24,
      username,
    };

    const message: EmailMessage = {
      messageId: generateId(),
      type: EMAIL_MESSAGE_TYPES.VERIFICATION,
      to: email,
      subject: "请验证您的邮箱地址",
      template: "verification",
      templateData,
      priority: "high",
    };

    await this.messageQueue.publish("email.queue", message);
  }
}
```

### 5. 使用错误代码契约

**抛出标准化错误：**

```typescript
import { ERROR_CODES, ERROR_MESSAGES, ApiErrorResponse } from "@oksai/constants";

@Injectable()
export class UserService {
  async get(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      const error: ApiErrorResponse = {
        success: false,
        code: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        requestId: this.contextService.correlationId,
        timestamp: new Date().toISOString(),
      };

      throw new NotFoundException(error);
    }

    return this.toResponse(user);
  }
}
```

**全局异常过滤器：**

```typescript
import { ERROR_CODES, ApiErrorResponse } from "@oksai/constants";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const errorResponse: ApiErrorResponse = {
      success: false,
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: "Internal server error",
      requestId: request.headers["x-request-id"],
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      errorResponse.code = ERROR_CODES.VALIDATION_ERROR;
      errorResponse.message = exception.message;
    }

    response.status(500).json(errorResponse);
  }
}
```

## 契约版本管理

### 版本控制策略

```typescript
// 在契约中定义版本
export const USER_API_VERSION = "v1";
export const USER_API_VERSION_PREFIX = `/api/${USER_API_VERSION}/users`;

// 事件版本
export interface UserCreatedPayload {
  eventId: string;
  timestamp: string;
  version: "1.0";  // 固定版本号
  data: { ... };
}
```

### 向后兼容

```typescript
// 新增字段使用可选
export interface UserResponse {
  id: string;
  email: string;
  // ... 其他字段
  phone?: string | null;  // 可选字段，向后兼容
}
```

## 最佳实践

### 1. 使用常量而非字符串

```typescript
// ❌ 不推荐
@Controller("/users")
async list(@Query("page") page: number) { }

// ✅ 推荐
@Controller(USER_API_PREFIX)
async list(@Query("page") page: number) { }
```

### 2. 类型安全的契约

```typescript
// ✅ 使用契约类型
async create(dto: CreateUserRequest): Promise<UserResponse> { }

// ❌ 避免 any
async create(dto: any): Promise<any> { }
```

### 3. 契约验证

```typescript
import { z } from "zod";
import { CreateUserRequest } from "@oksai/constants";

// 使用 Zod 验证契约
const CreateUserSchema = z.object<CreateUserRequest>({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

@Post()
async create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserRequest) {
  // dto 已经通过验证
}
```

### 4. 文档化契约

```typescript
/**
 * @description 创建用户请求 DTO
 */
export interface CreateUserRequest {
  /** 邮箱地址（必需） */
  email: string;
  /** 用户名（3-50字符） */
  username: string;
  /** 密码（至少8位） */
  password: string;
  /** 显示名称（可选） */
  displayName?: string;
}
```

## 添加新契约

### 1. 创建契约文件

```typescript
// libs/shared/constants/src/lib/contracts/api/product.contract.ts

export const PRODUCT_API_PREFIX = "/products";

export const PRODUCT_API_ENDPOINTS = {
  LIST: "/",
  GET: "/:id",
  CREATE: "/",
  UPDATE: "/:id",
  DELETE: "/:id",
} as const;

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2. 导出契约

```typescript
// libs/shared/constants/src/lib/contracts/api/product.contract.ts
export * from "./api/product.contract";
```

### 3. 更新主索引

```typescript
// libs/shared/constants/src/lib/contracts/index.ts
export * from "./api/user.contract";
export * from "./api/tenant.contract";
export * from "./api/auth.contract";
export * from "./api/order.contract";
export * from "./api/product.contract";  // 新增
```

### 4. 重新构建

```bash
pnpm nx build @oksai/constants
```

## 契约测试

### 单元测试

```typescript
import { CreateUserRequest, UserResponse } from "@oksai/constants";

describe("UserContract", () => {
  it("should validate CreateUserRequest", () => {
    const dto: CreateUserRequest = {
      email: "user@example.com",
      username: "testuser",
      password: "password123",
    };

    expect(dto.email).toBeDefined();
    expect(dto.username).toBeDefined();
  });
});
```

### 契约测试

```typescript
import { USER_API_ENDPOINTS } from "@oksai/constants";

describe("User API Contract", () => {
  it("should match endpoint paths", () => {
    expect(USER_API_ENDPOINTS.LIST).toBe("/");
    expect(USER_API_ENDPOINTS.GET).toBe("/:id");
    expect(USER_API_ENDPOINTS.CREATE).toBe("/");
  });
});
```

## 总结

### 优势

1. ✅ **类型安全**：完整的 TypeScript 支持
2. ✅ **集中管理**：所有契约在一处定义
3. ✅ **易于维护**：修改契约只需一处
4. ✅ **自动补全**：IDE 完整支持
5. ✅ **文档化**：契约即文档
6. ✅ **版本控制**：明确的版本管理

### 适用场景

- ✅ API 接口定义
- ✅ 事件驱动架构
- ✅ 微服务通信
- ✅ 消息队列
- ✅ 错误处理

**现在你可以在整个项目中使用集中管理的契约！** 🎉
