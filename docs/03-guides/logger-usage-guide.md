# @oksai/logger 使用指南

## 概述

`@oksai/logger` 是基于 Pino 的结构化日志模块，提供：
- ✅ 实现 NestJS LoggerService 接口
- ✅ 自动注入租户上下文（tenantId、userId、correlationId）
- ✅ 增强的序列化器（请求、响应、错误）
- ✅ 智能日志级别计算
- ✅ 支持 pino-pretty 美化输出
- ✅ 中文错误消息

## 已完成集成

### Gateway 应用

已在 Gateway 应用中集成 `@oksai/logger`：

- ✅ `apps/gateway/package.json` - 添加 `@oksai/logger` 依赖
- ✅ `apps/gateway/src/app.module.ts` - 导入 `LoggerModule`
- ✅ `apps/gateway/src/main.ts` - 使用 `OksaiLoggerService` 作为全局日志器

### 配置

**app.module.ts:**
```typescript
import { LoggerModule } from "@oksai/logger";

@Module({
  imports: [
    LoggerModule.forRoot({
      isGlobal: true,
      pretty: process.env.NODE_ENV !== "production",
      level: process.env.LOG_LEVEL || "info",
    }),
  ],
})
export class AppModule {}
```

**main.ts:**
```typescript
import { OksaiLoggerService } from "@oksai/logger";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 使用 OksaiLoggerService 作为全局日志器
  const logger = app.get(OksaiLoggerService);
  app.useLogger(logger);
  
  // 所有 console.log 都会通过 logger 输出
  logger.log(`🚀 Gateway running on http://localhost:${port}`);
}
```

## 使用方式

### 1. 在模块中导入

```typescript
import { LoggerModule } from "@oksai/logger";

@Module({
  imports: [
    LoggerModule.forRoot({
      isGlobal: true,          // 全局模块
        pretty: true,            // 开发环境美化输出
        level: "info",           // 日志级别
        serviceName: "gateway",  // 服务名称
      }),
  ],
})
export class AppModule {}
```

### 2. 在服务中使用（依赖注入）

```typescript
import { Injectable } from "@nestjs/common";
import { OksaiLoggerService } from "@oksai/logger";

@Injectable()
export class UserService {
  // 注入 logger（每个服务自动创建子日志器）
  constructor(private readonly logger: OksaiLoggerService) {
    // 设置当前服务的上下文
    this.logger.setContext(UserService.name);
  }

  async createUser(data: CreateUserDto) {
    this.logger.log("开始创建用户", { email: data.email });
    
    try {
      const user = await this.userRepository.create(data);
      this.logger.log("用户创建成功", { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error("创建用户失败", error.stack, { email: data.email });
      throw error;
    }
  }
}
```

### 3. 直接使用 Logger 方法

```typescript
// 基础日志
logger.log("普通日志消息");
logger.error("错误消息", error.stack);
logger.warn("警告消息");
logger.debug("调试消息");
logger.verbose("详细日志");

// 带上下文的日志
logger.log("用户登录", { 
  userId: "123", 
  email: "user@example.com" 
});

// 错误日志
logger.error("数据库连接失败", error.stack, { 
  database: "postgres",
  host: "localhost" 
});
```

### 4. 创建子日志器

```typescript
// 创建子日志器（自动包含额外上下文）
const jobLogger = logger.child({ module: "JobService" });
jobLogger.log("处理任务"); // 自动包含 module: "JobService"

const dbLogger = logger.child({ component: "Database", service: "gateway" });
dbLogger.log("执行查询"); // 自动包含 component 和 service
```

### 5. 结构化日志

```typescript
// 对象会自动序列化为 JSON
logger.log("API 请求", {
  method: "POST",
  path: "/api/users",
  body: { email: "user@example.com" },
  headers: { "content-type": "application/json" }
});

// 输出示例（JSON 格式）：
{
  "level": 30,
  "time": 1612345678901,
  "msg": "API 请求",
  "method": "POST",
  "path": "/api/users",
  "body": { "email": "user@example.com" },
  "headers": { "content-type": "application/json" }
}
```

## 高级特性

### 1. 自动租户上下文注入

```typescript
// 如果使用了 @oksai/context，日志会自动包含租户信息
@Injectable()
export class OrderService {
  constructor(private readonly logger: OksaiLoggerService) {}

  async createOrder(data: any) {
    // 日志会自动包含 tenantId, userId, correlationId
    this.logger.log("创建订单", { orderId: data.id });
    
    // 输出示例：
    // {
    //   "msg": "创建订单",
    //   "orderId": "123",
    //   "tenantId": "tenant-abc",
    //   "userId": "user-123",
    //   "correlationId": "req-456"
    // }
  }
}
```

### 2. 请求/响应序列化

```typescript
import { serializeRequest, serializeResponse } from "@oksai/logger";

// 序列化请求
const serializedReq = serializeRequest(req);
// {
//   method: "POST",
//   url: "/api/users",
//   query: { id: "123" },
//   headers: { "content-type": "application/json" },
//   remoteAddress: "192.168.1.1"
// }

// 序列化响应
const serializedRes = serializeResponse(res);
// {
//   statusCode: 200,
//   contentLength: 1234
// }

// 日志记录
logger.log("HTTP 请求", {
  request: serializedReq,
  response: serializedRes
});
```

### 3. 错误序列化

```typescript
import { serializeError } from "@oksai/logger";

try {
  // ... 业务逻辑
} catch (error) {
  const serialized = serializeError(error, process.env.NODE_ENV === "production");
  
  logger.error("操作失败", error.stack, {
    error: serialized
  });
  
  // 序列化错误示例：
  // {
  //   type: "DatabaseError",
  //   message: "连接失败",
  //   code: "ECONNREFUSED",
  //   stack: "Error at...",  // 生产环境不包含
  //   details: { ... }      // 如果有额外详情
  // }
}
```

### 4. 智能日志级别计算

```typescript
import { computeLogLevel } from "@oksai/logger";

// 根据状态码自动计算日志级别
const logLevel = computeLogLevel(req, res, error);

// 2xx -> "info"
// 4xx -> "warn"
// 5xx -> "error"
// UnhandledPromiseRejection -> "fatal"

logger[logLevel]("请求处理完成", { statusCode: res.statusCode });
```

### 5. 美化输出（开发环境）

```typescript
LoggerModule.forRoot({
  pretty: process.env.NODE_ENV !== "production",
  prettyOptions: {
    colorize: true,           // 彩色输出
    timeFormat: "SYS:standard", // 时间格式
    singleLine: false,        // 多行输出
    ignore: "pid,hostname"    // 忽略字段
  }
})
```

**输出示例（开发环境）：**
```
[10:30:45.123] INFO (gateway/123 on localhost):
  用户登录成功
  userId: "user-123"
  email: "user@example.com"
  tenantId: "tenant-abc"
```

## 配置选项

### LoggerModuleOptions

```typescript
interface LoggerModuleOptions {
  // 是否全局模块（默认 true）
  isGlobal?: boolean;
  
  // 日志级别（trace/debug/info/warn/error/fatal）
  level?: string;
  
  // 服务名称（用于日志标识）
  serviceName?: string;
  
  // 是否启用控制台美化输出（建议仅开发环境）
  pretty?: boolean;
  
  // 是否启用上下文注入（默认 true）
  enableContext?: boolean;
  
  // 美化输出选项
  prettyOptions?: {
    colorize?: boolean;
    timeFormat?: string;
    singleLine?: boolean;
    errorLikeObjectKeys?: string[];
    ignore?: string;
  };
}
```

### 环境变量

```bash
# 日志级别
LOG_LEVEL=info

# 是否美化输出（开发环境）
NODE_ENV=development
```

## 迁移指南

### 从 console.log 迁移

```typescript
// ❌ 旧方式
console.log("用户登录", userId);
console.error("创建失败", error);

// ✅ 新方式
this.logger.log("用户登录", { userId });
this.logger.error("创建失败", error.stack, { userId });
```

### 从 NestJS Logger 迁移

```typescript
// ❌ 旧方式
import { Logger } from "@nestjs/common";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  createUser() {
    this.logger.log("创建用户");
  }
}

// ✅ 新方式
import { OksaiLoggerService } from "@oksai/logger";

@Injectable()
export class UserService {
  constructor(private readonly logger: OksaiLoggerService) {
    this.logger.setContext(UserService.name);
  }
  
  createUser() {
    this.logger.log("创建用户");
  }
}
```

## 最佳实践

### 1. 使用结构化日志

```typescript
// ❌ 不推荐（字符串拼接）
this.logger.log(`用户 ${userId} 登录成功`);

// ✅ 推荐（结构化数据）
this.logger.log("用户登录成功", { userId });
```

### 2. 包含有用的上下文

```typescript
// ❌ 不推荐（缺少上下文）
this.logger.log("操作失败");

// ✅ 推荐（包含完整上下文）
this.logger.error("操作失败", error.stack, {
  operation: "createUser",
  email: data.email,
  tenantId: context.tenantId
});
```

### 3. 使用合适的日志级别

```typescript
// trace: 详细的追踪信息（仅开发）
logger.verbose("执行 SQL 查询", { sql: "SELECT * FROM users" });

// debug: 调试信息
logger.debug("用户数据验证通过", { email: data.email });

// info: 一般信息
logger.log("用户登录成功", { userId });

// warn: 警告
logger.warn("Redis 连接缓慢", { latency: 5000 });

// error: 错误
logger.error("数据库连接失败", error.stack);

// fatal: 致命错误
logger.fatal("应用启动失败", error.stack);
```

### 4. 生产环境配置

```typescript
LoggerModule.forRoot({
  isGlobal: true,
  pretty: false,              // 生产环境不美化
  level: "info",              // 生产环境使用 info 级别
  serviceName: "gateway",
  enableContext: true
})
```

### 5. 开发环境配置

```typescript
LoggerModule.forRoot({
  isGlobal: true,
  pretty: true,               // 开发环境美化输出
  level: "debug",             // 开发环境使用 debug 级别
  prettyOptions: {
    colorize: true,
    timeFormat: "SYS:standard"
  }
})
```

## 日志输出示例

### 开发环境（美化输出）

```
[2025-03-04 19:35:42.123] INFO (gateway):
  用户登录成功
  userId: "user-abc-123"
  email: "user@example.com"
  tenantId: "tenant-xyz"
  correlationId: "req-456-789"
```

### 生产环境（JSON 格式）

```json
{
  "level": 30,
  "time": 1612345678901,
  "msg": "用户登录成功",
  "userId": "user-abc-123",
  "email": "user@example.com",
  "tenantId": "tenant-xyz",
  "correlationId": "req-456-789",
  "service": "gateway",
  "hostname": "gateway-pod-123",
  "pid": 12345
}
```

## 故障排除

### 日志未输出

```typescript
// 检查日志级别配置
const level = configService.get("LOG_LEVEL", "info");
console.log("当前日志级别:", level);

// 确保模块已导入
LoggerModule.forRoot({ isGlobal: true })
```

### 上下文未注入

```typescript
// 确保启用了上下文
LoggerModule.forRoot({
  enableContext: true  // 默认 true
})

// 检查 TenantContextService 是否可用
```

### 美化输出不工作

```bash
# 安装 pino-pretty
pnpm add -D pino-pretty

# 启用美化
LoggerModule.forRoot({
  pretty: true
})
```

## 与其他日志库对比

| 特性 | console.log | NestJS Logger | @oksai/logger |
|------|-------------|---------------|---------------|
| 结构化日志 | ❌ | ✅ | ✅ |
| 日志级别 | ❌ | ✅ | ✅ |
| 租户上下文 | ❌ | ❌ | ✅ 自动注入 |
| 美化输出 | ❌ | ❌ | ✅ pino-pretty |
| 性能 | 高 | 中 | ✅ 高（Pino） |
| 序列化器 | ❌ | ❌ | ✅ 请求/响应/错误 |
| 日志文件 | ❌ | ❌ | ✅ 支持 |
| 中文消息 | ❌ | ✅ | ✅ |

## 总结

`@oksai/logger` 提供了比 NestJS Logger 更强大的功能：

- ✅ **结构化日志**：自动 JSON 序列化
- ✅ **高性能**：基于 Pino，极快的日志性能
- ✅ **上下文注入**：自动包含租户、用户、请求 ID
- ✅ **美化输出**：开发环境友好的控制台输出
- ✅ **智能序列化**：请求、响应、错误对象自动格式化
- ✅ **灵活配置**：支持多种输出格式和传输

推荐在所有服务中使用 `@oksai/logger` 替代 `console.log` 和 NestJS Logger。
