# DTO 目录

本目录包含认证模块的所有 Data Transfer Object (DTO) 定义。

## 📁 目录结构

```
dto/
├── admin.dto.ts           # Admin 管理相关 DTO
├── api-key.dto.ts         # API Key 管理相关 DTO
├── auth.dto.ts            # 认证相关 DTO（注册、登录等）
├── impersonation.dto.ts   # 用户模拟相关 DTO
├── oauth-client.dto.ts    # OAuth 客户端管理相关 DTO
├── oauth.dto.ts           # OAuth 2.0 相关 DTO
├── organization.dto.ts    # 组织管理相关 DTO
├── session.dto.ts         # Session 管理相关 DTO
├── webhook.dto.ts         # Webhook 管理相关 DTO
└── index.ts               # 统一导出
```

## 📖 使用方式

### 方式一：统一导入（推荐）

```typescript
import { 
  CreateUserDto, 
  LoginDto, 
  CreateOrganizationDto 
} from "./dto";
```

### 方式二：单独导入

```typescript
import { CreateUserDto } from "./dto/auth.dto";
import { LoginDto } from "./dto/auth.dto";
import { CreateOrganizationDto } from "./dto/organization.dto";
```

## 📋 DTO 规范

所有 DTO 遵循以下规范：

1. **使用 class 而非 interface**
   - 运行时存在，支持验证和文档生成

2. **添加 Swagger 装饰器**
   ```typescript
   @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
   email!: string;
   ```

3. **请求 DTO 添加验证装饰器**
   ```typescript
   @IsEmail()
   @ApiProperty({ description: "用户邮箱" })
   email!: string;
   ```

4. **响应 DTO 只添加文档装饰器**
   ```typescript
   @ApiProperty({ description: "用户 ID" })
   id!: string;
   ```

详细规范请参考：[docs/guides/dto-best-practices.md](../../../docs/guides/dto-best-practices.md)

## 🔍 DTO 分类

### 请求 DTO（Request DTO）
- 用于接收客户端请求数据
- 需要添加验证装饰器
- 命名规范：`CreateXxxDto`, `UpdateXxxDto`, `ListXxxDto`

### 响应 DTO（Response DTO）
- 用于返回给客户端的数据
- 不需要验证装饰器
- 命名规范：`XxxResponse`, `XxxListResponse`

## 📚 相关文档

- [DTO 编写规范](../../../docs/guides/dto-best-practices.md)
- [NestJS DTO Best Practices](https://docs.nestjs.com/controllers#request-payloads)
- [class-validator Documentation](https://github.com/typestack/class-validator)
