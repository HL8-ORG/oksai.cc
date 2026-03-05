# 硬编码迁移示例

## 示例 1: 替换硬编码的 Header 名称

### ❌ 之前（硬编码）

```typescript
// apps/gateway/src/auth/webhook.controller.ts
@Controller("webhooks")
export class WebhookController {
  @Post()
  async create(@Headers("x-user-id") userId: string, @Body() dto: CreateWebhookDto) {
    return this.webhookService.createWebhook(userId, dto);
  }

  @Get()
  async list(@Headers("x-user-id") userId: string) {
    return this.webhookService.listWebhooks(userId);
  }
}
```

### ✅ 之后（使用常量）

```typescript
// apps/gateway/src/auth/webhook.controller.ts
import { USER_ID_KEY } from "@oksai/constants";

@Controller("webhooks")
export class WebhookController {
  @Post()
  async create(@Headers(USER_ID_KEY) userId: string, @Body() dto: CreateWebhookDto) {
    return this.webhookService.createWebhook(userId, dto);
  }

  @Get()
  async list(@Headers(USER_ID_KEY) userId: string) {
    return this.webhookService.listWebhooks(userId);
  }
}
```

## 示例 2: 使用 TenantContextService

### ❌ 之前（手动传递租户ID）

```typescript
// apps/gateway/src/auth/organization.service.ts
@Injectable()
export class OrganizationService {
  async createOrganization(userId: string, data: CreateOrganizationDto) {
    // 需要手动传递 userId
    const response = await fetch("/api/organizations", {
      headers: {
        "x-user-id": userId,  // 硬编码 header
      },
    });
    return response.json();
  }
}
```

### ✅ 之后（使用上下文）

```typescript
// apps/gateway/src/auth/organization.service.ts
import { TenantContextService } from "@oksai/context";
import { USER_ID_KEY } from "@oksai/constants";

@Injectable()
export class OrganizationService {
  constructor(private readonly contextService: TenantContextService) {}

  async createOrganization(data: CreateOrganizationDto) {
    // 从上下文中自动获取
    const userId = this.contextService.userId;
    const tenantId = this.contextService.tenantId;

    const response = await fetch("/api/organizations", {
      headers: {
        [USER_ID_KEY]: userId,  // 使用常量
      },
    });
    return response.json();
  }
}
```

## 示例 3: 使用常量定义缓存键

### ❌ 之前（硬编码字符串）

```typescript
// apps/gateway/src/common/cache.service.ts
export class CacheService {
  async cacheUser(userId: string, data: any) {
    await this.cache.set(`user:${userId}`, data);
  }

  async getUser(userId: string) {
    return await this.cache.get(`user:${userId}`);
  }
}
```

### ✅ 之后（使用常量）

```typescript
// libs/shared/constants/src/lib/cache.constants.ts (新建)
export const CACHE_KEY_PREFIX = {
  USER: "user",
  TENANT: "tenant",
  SESSION: "session",
  API_KEY: "api_key",
} as const;

// apps/gateway/src/common/cache.service.ts
import { CACHE_KEY_PREFIX } from "@oksai/constants";

export class CacheService {
  async cacheUser(userId: string, data: any) {
    await this.cache.set(`${CACHE_KEY_PREFIX.USER}:${userId}`, data);
  }

  **Example 2: Using TenantContextService**

**Before (Manual tenant ID passing):**
```typescript
// apps/gateway/src/auth/organization.service.ts
@Injectable()
export class OrganizationService {
  async createOrganization(userId: string, data: CreateOrganizationDto) {
    // Need to manually pass userId
    const response = await fetch("/api/organizations", {
      headers: {
        "x-user-id": userId,  // Hardcoded header
      },
    });
    return response.json();
  }
}
```

**After (Using context):**
```typescript
// apps/gateway/src/auth/organization.service.ts
import { TenantContextService } from "@oksai/context";
import { USER_ID_KEY } from "@oksai/constants";

@Injectable()
export class OrganizationService {
  constructor(private readonly contextService: ${userId}`);
  }
}
```

## 示例 4: 日志中自动包含上下文

### ❌ 之前（手动添加上下文到日志）

```typescript
export class OrderService {
  async createOrder(userId: string, data: any) {
    console.log("Creating order", { userId, tenantId: "xxx" });
  }
}
```

### ✅ 之后（自动注入上下文）

```typescript
import { OksaiLoggerService } from "@oksai/logger";

export class OrderService {
  constructor(private readonly logger: OksaiLoggerService) {}

  async createOrder(data: any) {
    // 日志自动包含 tenantId, userId, correlationId
    this.logger.log("Creating order", { orderId: data.id });
  }
}
```

## 示例 5: 中间件中设置上下文

### ✅ 推荐做法

```typescript
import { Injectable, NestMiddleware } from "@nestjs/common";
import { TenantContextService, TenantContext } from "@oksai/context";
import { TENANT_ID_HEADER, REQUEST_ID_HEADER, USER_ID_KEY } from "@oksai/constants";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly contextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const context = TenantContext.create({
      tenantId: req.headers[TENANT_ID_HEADER] as string,
      userId: req.headers[USER_ID_KEY] as string,
      correlationId: req.headers[REQUEST_ID_HEADER] as string,
    });

    this.contextService.run(context, () => {
      next();
    });
  }
}
```

## 迁移清单

### 1. 查找硬编码

```bash
# 查找硬编码的 header
grep -r "x-tenant-id\|x-user-id\|x-request-id" apps/gateway/src --include="*.ts"

# 查找硬编码的字符串
grep -r "'tenantId'\|'userId'\|'correlationId'" apps/gateway/src --include="*.ts"
```

### 2. 替换为常量

**步骤：**
1. 导入常量：`import { TENANT_ID_HEADER } from "@oksai/constants";`
2. 替换硬编码字符串
3. 使用 TypeScript 检查：`pnpm tsc --noEmit`

### 3. 使用上下文服务

**步骤：**
1. 添加依赖：`import { TenantContextService } from "@oksai/context";`
2. 注入服务：`constructor(private readonly contextService: TenantContextService) {}`
3. 使用属性：`this.contextService.tenantId`

## 迁移优先级

### 高优先级
- Header 名称（x-tenant-id, x-user-id, x-request-id）
- 常量值（端口号、路径、超时时间）
- 缓存键前缀

### 中优先级
- 日志字段名
- 数据库字段名
- 配置键名

### 低优先级
- 注释中的描述（可选）
- 文档中的示例（可选）

## 常见问题

### Q: 为什么要避免硬编码？

**A:**
1. **易于维护**：修改只需一处
2. **避免错误**：TypeScript 检查拼写
3. **自动补全**：IDE 支持更好
4. **统一管理**：集中定义，一致性高

### Q: 什么时候可以硬编码？

**A:**
- 仅在本文件内使用的一次性代码
- 快速原型开发（但最终要替换）
- 第三方库要求的具体字符串

### Q: 如何组织常量？

**A:**
```
libs/shared/constants/src/lib/
├── api.constants.ts      # API 相关
├── cache.constants.ts    # 缓存相关
├── db.constants.ts       # 数据库相关
├── log.constants.ts      # 日志相关
└── reflect-metadata.constants.ts  # 装饰器相关
```

## 迁移脚本示例

```bash
#!/bin/bash
# migrate-hardcoded.sh

# 替换 Header 名称
find apps/gateway/src -name "*.ts" -type f -exec sed -i 's/"x-tenant-id"/TENANT_ID_HEADER/g' {} \;
find apps/gateway/src -name "*.ts" -type f -exec sed -i 's/"x-user-id"/USER_ID_KEY/g' {} \;
find apps/gateway/src -name "*.ts" -type f -exec sed -i 's/"x-request-id"/REQUEST_ID_HEADER/g' {} \;

# 添加导入语句
find apps/gateway/src -name "*.ts" -type f -exec sed -i '1i import { TENANT_ID_HEADER, USER_ID_KEY, REQUEST_ID_HEADER } from "@oksai/constants";' {} \;

echo "Migration completed!"
```

## 总结

**避免硬编码的关键步骤：**

1. ✅ 识别硬编码（字符串字面量）
2. ✅ 创建常量定义
3. ✅ 替换硬编码为常量
4. ✅ 使用上下文服务
5. ✅ 运行类型检查
6. ✅ 测试功能正常

**好处：**
- 🎯 更易维护
- 🛡️ 类型安全
- 🔍 避免拼写错误
- 📝 代码提示友好
- 🔄 易于重构
