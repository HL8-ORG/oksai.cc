# DTO 编写规范

## 概述

本文档定义了项目中 DTO（Data Transfer Object）的编写规范，确保代码一致性、类型安全和良好的 API 文档生成。

## 为什么使用 Class 而不是 Interface

### Interface 的问题

```typescript
// ❌ 不推荐：使用 interface
export interface CreateUserDto {
  email: string;
  password: string;
}
```

**问题：**
1. **编译后被移除** - interface 在 TypeScript 编译后会被完全移除，无法在运行时使用
2. **无法验证** - 无法配合 `class-validator` 进行请求数据验证
3. **无法生成文档** - Swagger 无法自动提取 schema 信息
4. **无运行时类型** - 无法进行 instanceof 检查

### Class 的优势

```typescript
// ✅ 推荐：使用 class
export class CreateUserDto {
  @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "用户密码", example: "SecurePass123!" })
  @IsString()
  @MinLength(8)
  password!: string;
}
```

**优势：**
1. **运行时存在** - class 在编译后仍然存在
2. **自动验证** - 配合 `class-validator` 自动验证请求数据
3. **自动文档** - Swagger 自动生成完整的 API 文档
4. **类型安全** - 保持 TypeScript 类型检查
5. **依赖注入** - 可配合 NestJS 的 DI 系统

## DTO 分类

### 1. 请求 DTO（Request DTO）

用于接收客户端请求数据，需要验证。

**命名规范：** `{Action}{Resource}Dto`

```typescript
// 创建请求
export class CreateUserDto { }
export class CreateOrganizationDto { }

// 更新请求
export class UpdateUserDto { }
export class UpdateOrganizationDto { }

// 查询参数
export class ListUsersDto { }
export class SearchProductsDto { }

// 操作请求
export class LoginDto { }
export class ResetPasswordDto { }
```

### 2. 响应 DTO（Response DTO）

用于返回给客户端的数据，不需要验证。

**命名规范：** `{Resource}Response` 或 `{Action}Response`

```typescript
// 单个资源响应
export class UserResponse { }
export class OrganizationResponse { }

// 列表响应
export class UserListResponse { }
export class OrganizationListResponse { }

// 操作响应
export class LoginResponse { }
export class DeleteResponse { }
```

## 装饰器使用规范

### 1. Swagger 装饰器

所有 DTO 都应该添加 Swagger 装饰器以生成 API 文档。

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  // 必填字段
  @ApiProperty({ 
    description: "用户邮箱", 
    example: "user@example.com",
    format: "email"
  })
  email!: string;

  // 可选字段
  @ApiPropertyOptional({ 
    description: "用户名", 
    example: "John Doe",
    default: "Anonymous"
  })
  name?: string;

  // 枚举字段
  @ApiPropertyOptional({ 
    description: "用户角色", 
    enum: ["user", "admin", "superadmin"],
    default: "user"
  })
  role?: string;

  // 数组字段
  @ApiPropertyOptional({ 
    description: "用户标签", 
    type: [String],
    example: ["vip", "active"]
  })
  tags?: string[];
}
```

### 2. 验证装饰器

请求 DTO 必须添加验证装饰器。

```typescript
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsNumber,
  Min, 
  Max, 
  MinLength,
  MaxLength,
  IsArray,
  IsBoolean,
  IsDate,
  IsUUID
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ description: "用户邮箱" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @ApiProperty({ description: "用户密码" })
  @IsString()
  @MinLength(8, { message: "密码至少 8 位" })
  @MaxLength(32, { message: "密码最多 32 位" })
  password!: string;

  @ApiPropertyOptional({ description: "用户名" })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: "年龄" })
  @IsNumber()
  @Min(0)
  @Max(150)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: "角色", enum: ["user", "admin"] })
  @IsEnum(["user", "admin"])
  @IsOptional()
  role?: string;
}
```

### 3. 类型转换装饰器

用于自动转换请求数据类型。

```typescript
import { Type } from "class-transformer";

export class SearchDto {
  @ApiPropertyOptional({ description: "页码", default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: "每页数量", default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: "是否激活" })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "创建日期" })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  createdAt?: Date;
}
```

## 属性定义规范

### 1. 必填属性

使用 `!` 断言（definite assignment assertion）。

```typescript
export class LoginDto {
  @ApiProperty({ description: "邮箱" })
  @IsEmail()
  email!: string;  // 使用 ! 断言

  @ApiProperty({ description: "密码" })
  @IsString()
  password!: string;
}
```

### 2. 可选属性

使用 `?` 可选标记。

```typescript
export class UpdateUserDto {
  @ApiPropertyOptional({ description: "用户名" })
  @IsString()
  @IsOptional()
  name?: string;  // 使用 ? 可选标记

  @ApiPropertyOptional({ description: "头像 URL" })
  @IsString()
  @IsOptional()
  avatar?: string;
}
```

### 3. 可空属性

使用联合类型 `| null`。

```typescript
export class UserResponse {
  @ApiProperty({ description: "用户 ID" })
  id!: string;

  @ApiPropertyOptional({ description: "用户名", nullable: true })
  name!: string | null;  // 可能为 null

  @ApiPropertyOptional({ description: "头像", nullable: true })
  avatar!: string | null;
}
```

## 常见模式

### 1. 分页查询 DTO

```typescript
export class PaginationDto {
  @ApiPropertyOptional({ description: "页码", default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: "每页数量", default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: "排序字段", default: "createdAt" })
  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ description: "排序方向", enum: ["asc", "desc"], default: "desc" })
  @IsEnum(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}

// 继承使用
export class ListUsersDto extends PaginationDto {
  @ApiPropertyOptional({ description: "搜索关键词" })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: "角色筛选", enum: ["user", "admin", "superadmin"] })
  @IsEnum(["user", "admin", "superadmin"])
  @IsOptional()
  role?: string;
}
```

### 2. 列表响应 DTO

```typescript
export class UserListResponse {
  @ApiProperty({ description: "用户列表", type: [UserResponse] })
  users!: UserResponse[];

  @ApiProperty({ description: "总数" })
  total!: number;

  @ApiProperty({ description: "当前页" })
  page!: number;

  @ApiProperty({ description: "每页数量" })
  limit!: number;

  @ApiProperty({ description: "总页数" })
  totalPages!: number;
}
```

### 3. 嵌套对象 DTO

```typescript
export class AddressDto {
  @ApiProperty({ description: "街道" })
  @IsString()
  street!: string;

  @ApiProperty({ description: "城市" })
  @IsString()
  city!: string;

  @ApiProperty({ description: "邮编" })
  @IsString()
  zipCode!: string;
}

export class CreateUserDto {
  @ApiProperty({ description: "用户名" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "地址", type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
```

### 4. 操作响应 DTO

```typescript
export class DeleteResponse {
  @ApiProperty({ description: "是否成功", example: true })
  success!: boolean;

  @ApiProperty({ description: "消息", example: "删除成功" })
  message!: string;
}

export class BatchDeleteResponse {
  @ApiProperty({ description: "是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "删除数量" })
  deletedCount!: number;

  @ApiProperty({ description: "失败的 ID 列表", type: [String] })
  failedIds!: string[];
}
```

## 文件组织

### 1. 单个 DTO 文件

适用于简单模块。

```
src/modules/user/
├── user.dto.ts          # 所有 DTO 定义
├── user.controller.ts
├── user.service.ts
└── user.module.ts
```

```typescript
// user.dto.ts
export class CreateUserDto { }
export class UpdateUserDto { }
export class ListUsersDto { }
export class UserResponse { }
export class UserListResponse { }
```

### 2. DTO 目录

适用于复杂模块。

```
src/modules/order/
├── dto/
│   ├── create-order.dto.ts
│   ├── update-order.dto.ts
│   ├── list-orders.dto.ts
│   ├── order-response.dto.ts
│   └── index.ts          # 统一导出
├── order.controller.ts
├── order.service.ts
└── order.module.ts
```

```typescript
// dto/index.ts
export * from "./create-order.dto";
export * from "./update-order.dto";
export * from "./list-orders.dto";
export * from "./order-response.dto";
```

## 在控制器中使用

### 1. 基本用法

```typescript
@Controller("users")
@ApiTags("用户管理")
export class UserController {
  @Post()
  @ApiOperation({ summary: "创建用户" })
  @ApiResponse({ status: 201, description: "创建成功", type: UserResponse })
  @ApiResponse({ status: 400, description: "参数错误" })
  async create(
    @Body() dto: CreateUserDto  // 自动验证
  ): Promise<UserResponse> {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "获取用户列表" })
  @ApiResponse({ status: 200, description: "成功", type: UserListResponse })
  async list(
    @Query() query: ListUsersDto  // 自动验证查询参数
  ): Promise<UserListResponse> {
    return this.userService.findAll(query);
  }
}
```

### 2. 配合 @ApiBody

如果需要更详细描述请求体：

```typescript
@Post()
@ApiOperation({ summary: "批量导入用户" })
@ApiBody({
  type: BatchCreateUsersDto,
  description: "批量创建用户，最多 100 个",
  examples: {
    example1: {
      summary: "示例数据",
      value: {
        users: [
          { email: "user1@example.com", name: "User 1" },
          { email: "user2@example.com", name: "User 2" }
        ]
      }
    }
  }
})
async batchCreate(
  @Body() dto: BatchCreateUsersDto
): Promise<BatchCreateResponse> {
  return this.userService.batchCreate(dto);
}
```

### 3. 配合 @ApiQuery

描述查询参数：

```typescript
@Get()
@ApiOperation({ summary: "搜索用户" })
@ApiQuery({ name: "keyword", description: "搜索关键词", required: true })
@ApiQuery({ name: "role", description: "角色筛选", enum: ["user", "admin"], required: false })
@ApiQuery({ name: "page", description: "页码", type: Number, required: false })
@ApiQuery({ name: "limit", description: "每页数量", type: Number, required: false })
async search(
  @Query() query: SearchUsersDto
): Promise<UserListResponse> {
  return this.userService.search(query);
}
```

## 最佳实践

### 1. 始终添加描述

```typescript
// ❌ 不推荐
@ApiProperty()
email!: string;

// ✅ 推荐
@ApiProperty({ description: "用户邮箱地址", example: "user@example.com" })
email!: string;
```

### 2. 提供示例值

```typescript
@ApiProperty({ 
  description: "用户状态",
  enum: ["active", "inactive", "banned"],
  example: "active"
})
status!: string;
```

### 3. 验证错误消息

```typescript
@IsEmail({}, { message: "请输入有效的邮箱地址" })
email!: string;

@MinLength(8, { message: "密码长度至少为 8 位" })
password!: string;
```

### 4. 合理分组

```typescript
// user.dto.ts
// ============================================
// 请求 DTO
// ============================================
export class CreateUserDto { }
export class UpdateUserDto { }
export class ListUsersDto { }

// ============================================
// 响应 DTO
// ============================================
export class UserResponse { }
export class UserListResponse { }
```

### 5. 复用基础 DTO

```typescript
// base.dto.ts
export abstract class BaseDto {
  @ApiProperty({ description: "ID" })
  id!: string;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

// user.dto.ts
export class UserResponse extends BaseDto {
  @ApiProperty({ description: "邮箱" })
  email!: string;

  @ApiPropertyOptional({ description: "用户名", nullable: true })
  name!: string | null;
}
```

### 6. 使用 DTO 类而非接口

```typescript
// ❌ 避免
export interface CreateUserDto {
  email: string;
  password: string;
}

// ✅ 推荐
export class CreateUserDto {
  @ApiProperty({ description: "用户邮箱" })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "用户密码" })
  @IsString()
  @MinLength(8)
  password!: string;
}
```

## 常见验证器

| 装饰器 | 说明 | 示例 |
|--------|------|------|
| `@IsString()` | 字符串 | `@IsString()` |
| `@IsNumber()` | 数字 | `@IsNumber()` |
| `@IsBoolean()` | 布尔值 | `@IsBoolean()` |
| `@IsEmail()` | 邮箱 | `@IsEmail()` |
| `@IsUUID()` | UUID | `@IsUUID()` |
| `@IsDate()` | 日期 | `@IsDate()` |
| `@IsEnum()` | 枚举 | `@IsEnum(["a", "b"])` |
| `@IsArray()` | 数组 | `@IsArray()` |
| `@IsOptional()` | 可选 | `@IsOptional()` |
| `@MinLength(n)` | 最小长度 | `@MinLength(8)` |
| `@MaxLength(n)` | 最大长度 | `@MaxLength(32)` |
| `@Min(n)` | 最小值 | `@Min(0)` |
| `@Max(n)` | 最大值 | `@Max(100)` |
| `@Matches(regex)` | 正则匹配 | `@Matches(/^[a-z]+$/)` |
| `@ValidateNested()` | 嵌套验证 | `@ValidateNested()` |

## 总结

### DO ✅

- 使用 `class` 而非 `interface`
- 添加 `@ApiProperty` 或 `@ApiPropertyOptional` 装饰器
- 请求 DTO 添加验证装饰器
- 为所有属性添加描述和示例
- 使用明确的类型和枚举
- 必填属性使用 `!` 断言
- 可选属性使用 `?` 标记
- 提供有意义的验证错误消息

### DON'T ❌

- 不要使用 `interface` 定义 DTO
- 不要省略 Swagger 装饰器
- 不要使用 `any` 类型
- 不要忘记添加验证装饰器
- 不要在响应 DTO 中添加验证装饰器
- 不要在 DTO 中编写业务逻辑

## 参考资料

- [NestJS DTO Best Practices](https://docs.nestjs.com/controllers#request-payloads)
- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [NestJS Swagger Plugin](https://docs.nestjs.com/openapi/introduction)
