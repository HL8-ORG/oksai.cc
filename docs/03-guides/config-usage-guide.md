# @oksai/config 使用指南

## 概述

`@oksai/config` 是基于 `@nestjs/config` 增强的配置管理模块，提供：
- ✅ 类型安全的配置读取（getInt, getUrl, getDurationMs 等）
- ✅ zod schema 验证
- ✅ 命名空间配置分组
- ✅ 配置缓存
- ✅ 边界校验（min/max）
- ✅ Result 类型返回
- ✅ 中文错误消息

## 已完成迁移

### Gateway 应用

已将以下文件从 `@nestjs/config` 迁移到 `@oksai/config`：

- ✅ `apps/gateway/src/app.module.ts`
- ✅ `apps/gateway/src/main.ts`
- ✅ `apps/gateway/src/auth/encryption.util.ts`

### 新引入的库

以下库已使用 `@oksai/config`：
- ✅ `libs/shared/logger` - 日志模块
- ✅ `libs/shared/config` - 配置模块本身

## 使用方式

### 1. 导入模块

```typescript
import { ConfigModule } from "@oksai/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
  ],
})
export class AppModule {}
```

### 2. 使用服务

```typescript
import { ConfigService } from "@oksai/config";

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getPort(): number {
    // 类型安全的配置读取，默认值 3000
    return this.configService.get("PORT", 3000);
  }

  getDatabaseUrl(): string {
    // 类型安全的 URL 读取
    return this.configService.getUrl("DATABASE_URL");
  }

  getTimeout(): number {
    // 支持时间单位转换
    return this.configService.getDurationMs("TIMEOUT", { unit: "s" });
  }
}
```

### 3. 环境变量验证

```typescript
import { z } from "@oksai/config";
import { validateConfig } from "@oksai/config";

const envSchema = z.object({
  PORT: z.string().transform(Number).default("3000"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
});

// 验证环境变量
const config = validateConfig(process.env, envSchema);
```

### 4. 命名空间配置

```typescript
import { ConfigService, getNamespaceToken } from "@oksai/config";

// 定义命名空间
const databaseConfig = configService.getNamespace("database");

// 读取配置
const host = databaseConfig.get("host");
const port = databaseConfig.getInt("port");
```

## 高级特性

### 类型安全的方法

```typescript
// 整数
configService.getInt("MAX_CONNECTIONS", { min: 1, max: 100 });

// 浮点数
configService.getFloat("RATE_LIMIT", { min: 0.1, max: 1.0 });

// 布尔值
configService.getBoolean("FEATURE_ENABLED");

// URL
configService.getUrl("API_ENDPOINT");

// 持续时间（支持单位转换）
configService.getDurationMs("CACHE_TTL", { unit: "m" }); // 分钟转毫秒

// JSON
configService.getJson<{ key: string }>("CONFIG_JSON");

// 枚举
configService.getEnum("LOG_LEVEL", ["debug", "info", "warn", "error"] as const);

// 列表
configService.getList("ALLOWED_ORIGINS", { separator: "," });
```

### 边界验证

```typescript
// 数值范围验证
const port = configService.getInt("PORT", {
  min: 1024,
  max: 65535,
});

// 字符串长度验证
const name = configService.getString("APP_NAME", {
  minLength: 3,
  maxLength: 50,
});
```

### Result 模式

```typescript
import { Result } from "@oksai/domain-core";

// 使用 Result 类型处理配置错误
const result = configService.tryGet("OPTIONAL_CONFIG");

if (result.isOk()) {
  console.log("配置值:", result.value);
} else {
  console.log("配置缺失，使用默认值");
}
```

## 与 @nestjs/config 的区别

| 特性 | @nestjs/config | @oksai/config |
|------|---------------|---------------|
| 基础功能 | ✅ | ✅ |
| 类型安全 | 部分 | ✅ 完整 |
| Schema 验证 | 需要 Joi/class-validator | ✅ 内置 Zod |
| 命名空间 | ✅ | ✅ 增强 |
| 配置缓存 | ❌ | ✅ |
| 边界校验 | ❌ | ✅ |
| Result 类型 | ❌ | ✅ |
| 错误消息 | 英文 | 中文 |
| 单位转换 | ❌ | ✅ (时间单位) |

## 最佳实践

### 1. 使用类型安全的方法

```typescript
// ❌ 不推荐
const port = configService.get("PORT"); // 返回 any

// ✅ 推荐
const port = configService.getInt("PORT", 3000); // 返回 number
```

### 2. 提供默认值

```typescript
// ❌ 不推荐（可能返回 undefined）
const timeout = configService.get("TIMEOUT");

// ✅ 推荐
const timeout = configService.getInt("TIMEOUT", 5000);
```

### 3. 使用 Schema 验证

```typescript
// ✅ 推荐：在模块初始化时验证所有必需的配置
ConfigModule.forRoot({
  isGlobal: true,
  validate: (config) => {
    const schema = z.object({
      DATABASE_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
    });
    return schema.parse(config);
  },
})
```

### 4. 敏感配置加密

```typescript
// 使用 EncryptionUtil 加密敏感配置
import { createEncryptionUtil } from "./auth/encryption.util";

const encryption = createEncryptionUtil(configService);
const encrypted = encryption.encrypt(apiKey);
const decrypted = encryption.decrypt(encrypted);
```

## 常见配置示例

### 数据库配置

```typescript
// .env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=30s

// 使用
const dbUrl = configService.getUrl("DATABASE_URL");
const poolSize = configService.getInt("DATABASE_POOL_SIZE", 10);
const timeout = configService.getDurationMs("DATABASE_TIMEOUT", { unit: "s" });
```

### Redis 配置

```typescript
// .env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
REDIS_TTL=3600s

// 使用
const redisUrl = configService.getUrl("REDIS_URL");
const enabled = configService.getBoolean("REDIS_ENABLED");
const ttl = configService.getDurationMs("REDIS_TTL", { unit: "s" });
```

### 日志配置

```typescript
// .env
LOG_LEVEL=info
LOG_FORMAT=json

// 使用
const logLevel = configService.getEnum("LOG_LEVEL", 
  ["debug", "info", "warn", "error"] as const
);
const logFormat = configService.getEnum("LOG_FORMAT", 
  ["json", "pretty"] as const
);
```

## 迁移指南

### 从 @nestjs/config 迁移

1. **更新导入**
```typescript
// 旧
import { ConfigModule, ConfigService } from "@nestjs/config";

// 新
import { ConfigModule, ConfigService } from "@oksai/config";
```

2. **添加依赖**
```json
{
  "dependencies": {
    "@oksai/config": "workspace:*"
  }
}
```

3. **使用类型安全方法**
```typescript
// 旧
const port = configService.get<number>("PORT") || 3000;

// 新
const port = configService.getInt("PORT", 3000);
```

## 故障排除

### 配置未找到

```typescript
// 检查配置是否存在
if (!configService.has("MY_CONFIG")) {
  throw new Error("缺少 MY_CONFIG 环境变量");
}
```

### 类型转换错误

```typescript
// 使用严格类型方法
const port = configService.getInt("PORT"); // 自动转换和验证

// 而不是
const port = Number(configService.get("PORT")); // 可能 NaN
```

### Schema 验证失败

```typescript
// 捕获验证错误
try {
  const config = validateConfig(process.env, schema);
} catch (error) {
  if (error instanceof ConfigSchemaError) {
    console.error("配置验证失败:", error.message);
  }
}
```

## 总结

`@oksai/config` 提供了比 `@nestjs/config` 更强大和类型安全的配置管理功能：

- ✅ **类型安全**：getInt, getUrl, getDurationMs 等
- ✅ **验证**：内置 Zod schema 验证
- ✅ **错误处理**：Result 模式和中文错误消息
- ✅ **便捷性**：时间单位转换、边界校验
- ✅ **可维护性**：命名空间、配置缓存

推荐在所有新项目中使用 `@oksai/config`，现有项目逐步迁移。
