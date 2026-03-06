# Swagger/OpenAPI 文档技术方案

## 概述

本文档详细阐述 OksAI 项目中 Swagger/OpenAPI 文档的实现方案，包括技术架构、配置方式、工具链集成和最佳实践。

## 技术架构

### 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| @nestjs/swagger | 最新 | NestJS 官方 Swagger 模块 |
| class-validator | 最新 | 请求参数验证 |
| class-transformer | 最新 | 类型转换 |
| @scalar/api-reference | CDN | 现代 API 文档 UI |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        Gateway Application                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   main.ts (启动)                      │  │
│  │  - setupSwagger() 配置 Swagger UI                    │  │
│  │  - setupScalarUi() 配置 Scalar UI                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                app.module.ts (模块注册)               │  │
│  │  - @ApiExtraModels() 注册所有 DTO                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controllers (路由控制器)                 │  │
│  │  - @ApiTags() API 分组                               │  │
│  │  - @ApiOperation() 操作说明                          │  │
│  │  - @ApiBody() 请求体类型                             │  │
│  │  - @ApiResponse() 响应类型                           │  │
│  │  - @ApiParam() 路径参数                              │  │
│  │  - @ApiQuery() 查询参数                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    DTOs (数据传输对象)                │  │
│  │  - @ApiProperty() 必填属性                           │  │
│  │  - @ApiPropertyOptional() 可选属性                   │  │
│  │  - class-validator 验证装饰器                        │  │
│  │  - class-transformer 类型转换装饰器                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              @oksai/nestjs-utils/swagger              │  │
│  │  - setupSwagger() 统一配置函数                       │  │
│  │  - DocumentBuilder 配置文档元信息                    │  │
│  │  - 动态 import 避免强依赖                            │  │
│  │  - Scalar UI CDN 集成                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────────┐
         │      OpenAPI 3.0 规范文档           │
         │  - /swagger-json (JSON 格式)        │
         │  - /swagger-yaml (YAML 格式)        │
         └─────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────────┐
         │          文档 UI 展示层              │
         │  - Swagger UI (/swagger)            │
         │  - Scalar UI (/docs)                │
         └─────────────────────────────────────┘
```

## 实现细节

### 1. 核心配置函数

**位置：** `libs/shared/nestjs-utils/src/lib/swagger.ts`

#### 1.1 setupSwagger() 函数

这是项目的核心 Swagger 配置函数，负责：

1. **动态加载 Swagger 依赖** - 避免 `@nestjs/swagger` 被强绑定到所有服务
2. **配置文档元信息** - 使用 `DocumentBuilder` 设置标题、描述、版本
3. **配置 Bearer Auth** - 支持 JWT Token 认证
4. **生成 OpenAPI 文档** - 创建符合 OpenAPI 3.0 规范的文档
5. **配置 Swagger UI** - 定制 UI 选项（持久化授权、展开模式等）
6. **集成 Scalar UI** - 提供现代化的文档 UI 替代方案

```typescript
export async function setupSwagger(
  app: INestApplication,
  options: SetupSwaggerOptions
): Promise<string | null> {
  // 1. 动态加载 @nestjs/swagger
  const mod = await import("@nestjs/swagger");
  const { SwaggerModule, DocumentBuilder } = mod;

  // 2. 配置文档元信息
  const config = new DocumentBuilder()
    .setTitle("OksAI Gateway API")
    .setDescription("OksAI 平台 API 文档")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "请输入 JWT Token",
        in: "header",
      },
      "bearer"
    )
    .build();

  // 3. 生成 OpenAPI 文档
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  // 4. 配置 Swagger UI
  SwaggerModule.setup("swagger", app, document, {
    swaggerOptions: {
      persistAuthorization: true,  // 持久化认证信息
      docExpansion: "none",        // 默认折叠所有接口
      filter: true,                // 启用搜索过滤
      showRequestDuration: true,   // 显示请求耗时
    },
    customSiteTitle: "OksAI Gateway API - Swagger UI",
  });

  // 5. 集成 Scalar UI
  await setupScalarUi(app, {
    title: "OksAI Gateway API",
    scalarPath: "docs",
    swaggerJsonPath: "/swagger-json",
  });

  return "swagger";
}
```

#### 1.2 setupScalarUi() 函数

使用 CDN 集成 Scalar UI，无需安装额外的 npm 包：

```typescript
async function setupScalarUi(
  app: INestApplication,
  options: {
    title: string;
    scalarPath: string;
    swaggerJsonPath: string;
  }
): Promise<void> {
  const html = (swaggerJsonUrl: string) => `
<!doctype html>
<html>
  <head>
    <title>${title} - API 文档</title>
  </head>
  <body>
    <script id="api-reference" data-url="${swaggerJsonUrl}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

  // 动态添加路由
  instance.get("/docs", (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(html("/swagger-json"));
  });
}
```

### 2. 应用启动配置

**位置：** `apps/gateway/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 配置全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // 过滤未定义的属性
      forbidNonWhitelisted: true, // 拒绝未定义的属性
      transform: true,            // 自动转换类型
    })
  );

  // 配置 Swagger API 文档
  const swaggerPath = await setupSwagger(app, {
    enabled: true,
    title: "OksAI Gateway API",
    description: "OksAI 平台 API 文档",
    version: "1.0.0",
    swaggerPath: "swagger",
    enableScalar: true,
    scalarPath: "docs",
  });

  await app.listen(3000);

  if (swaggerPath) {
    logger.log(`📖 Swagger UI: http://localhost:3000/${swaggerPath}`);
    logger.log(`📚 Scalar UI: http://localhost:3000/docs`);
  }
}
```

### 3. DTO 注册机制

**位置：** `apps/gateway/src/app.module.ts`

#### 3.1 为什么需要 @ApiExtraModels()

在 NestJS 中，仅使用 `@ApiBody({ type: XxxDto })` 和 `@ApiResponse({ type: XxxResponse })` 并不足以让 Swagger 完全识别所有 DTO。原因是：

1. **未直接使用的 DTO 可能被忽略** - 如果某个 DTO 只在其他 DTO 中引用，但未在 Controller 中直接使用，Swagger 可能不会将其包含在文档中
2. **嵌套类型的完整展示** - 确保所有嵌套的 DTO 类型都能在 Schema 列表中显示
3. **复用 DTO 的统一管理** - 在一个地方集中管理所有 DTO 的注册

#### 3.2 实现方式

```typescript
import { ApiExtraModels } from "@nestjs/swagger";
import {
  AdminImpersonateResponse,
  AdminUserListResponse,
  CreateUserDto,
  UserResponse,
  // ... 其他 DTO
} from "./auth/dto";

@ApiExtraModels(
  // 请求 DTO
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  
  // 响应 DTO
  UserResponse,
  UserListResponse,
  
  // 所有其他 DTO...
)
@Module({
  // ...
})
export class AppModule {}
```

#### 3.3 最佳实践：统一导入和注册

**推荐做法：** 在模块的 `dto/index.ts` 中导出所有 DTO，然后在 `app.module.ts` 中统一注册

```typescript
// 1. auth/dto/index.ts - 统一导出
export * from "./auth.dto";
export * from "./admin.dto";
export * from "./user.dto";
export * from "./organization.dto";
// ...

// 2. app.module.ts - 统一注册
import * as AuthDtos from "./auth/dto";
import * as UserDtos from "./user/dto";

@ApiExtraModels(
  ...Object.values(AuthDtos),
  ...Object.values(UserDtos),
)
@Module({ /* ... */ })
export class AppModule {}
```

### 4. Controller 装饰器规范

#### 4.1 完整的装饰器组合

每个 Controller 方法都应该包含以下装饰器：

```typescript
@ApiTags("用户管理")  // API 分组
@Controller("users")
export class UserController {
  // POST 请求
  @Post()
  @ApiOperation({ summary: "创建用户", description: "创建新用户账户" })
  @ApiBody({ type: CreateUserDto })  // ⚠️ 必须添加
  @ApiResponse({ status: 201, description: "创建成功", type: UserResponse })
  @ApiResponse({ status: 400, description: "参数错误" })
  @ApiResponse({ status: 409, description: "邮箱已存在" })
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.userService.create(dto);
  }

  // PUT 请求（带路径参数）
  @Put(":id")
  @ApiOperation({ summary: "更新用户" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponse })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto
  ): Promise<UserResponse> {
    return this.userService.update(id, dto);
  }

  // GET 请求（带查询参数）
  @Get()
  @ApiOperation({ summary: "获取用户列表" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, type: UserListResponse })
  async list(@Query() query: ListUsersDto): Promise<UserListResponse> {
    return this.userService.findAll(query);
  }

  // DELETE 请求
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "删除用户" })
  @ApiParam({ name: "id", description: "用户 ID" })
  @ApiResponse({ status: 200, description: "删除成功" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async delete(@Param("id") id: string): Promise<{ success: boolean }> {
    return this.userService.delete(id);
  }
}
```

#### 4.2 关键注意事项

⚠️ **必须遵守的规则：**

1. **禁止使用 `import type` 导入 DTO**

```typescript
// ❌ 严重错误：编译后类型信息丢失
import type { CreateUserDto } from "./dto";

@Controller("users")
export class UserController {
  @Post()
  async create(@Body() dto: CreateUserDto) {  // Swagger 无法识别！
    // ...
  }
}

// ✅ 正确：使用普通 import
import { CreateUserDto } from "./dto";

@Controller("users")
export class UserController {
  @Post()
  @ApiBody({ type: CreateUserDto })  // 必须
  async create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

**原因：** TypeScript 的 `import type` 在编译后会被完全移除，导致运行时无法获取类型元数据，Swagger 反射机制失效。

2. **必须使用 `type` 而非 `schema`**

```typescript
// ❌ 错误：响应类型无法在 Swagger 中正确显示
@ApiResponse({
  status: 200,
  description: "成功",
  schema: { example: { id: "xxx", name: "User" } }
})

// ✅ 正确：响应类型完整显示
@ApiResponse({ status: 200, description: "成功", type: UserResponse })
```

### 5. DTO 编写规范

#### 5.1 基本结构

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from "class-validator";

/**
 * 用户注册 DTO
 */
export class SignUpDto {
  @ApiProperty({ 
    description: "用户邮箱", 
    example: "user@example.com",
    format: "email"
  })
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;

  @ApiProperty({ 
    description: "用户密码", 
    example: "SecurePass123!",
    minLength: 8,
    maxLength: 128
  })
  @IsString()
  @MinLength(8, { message: "密码至少需要 8 个字符" })
  @MaxLength(128, { message: "密码不能超过 128 个字符" })
  password!: string;

  @ApiPropertyOptional({ 
    description: "用户名称", 
    example: "John Doe",
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "名称不能超过 100 个字符" })
  name?: string;
}
```

#### 5.2 响应 DTO

```typescript
/**
 * 用户响应 DTO
 */
export class UserResponse {
  @ApiProperty({ description: "用户 ID", example: "abc123" })
  id!: string;

  @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
  email!: string;

  @ApiPropertyOptional({ description: "用户名称", nullable: true })
  name!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-03-07T00:00:00Z" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间", example: "2026-03-07T00:00:00Z" })
  updatedAt!: Date;
}

/**
 * 用户列表响应 DTO
 */
export class UserListResponse {
  @ApiProperty({ description: "用户列表", type: [UserResponse] })
  users!: UserResponse[];

  @ApiProperty({ description: "总数", example: 100 })
  total!: number;

  @ApiProperty({ description: "当前页", example: 1 })
  page!: number;

  @ApiProperty({ description: "每页数量", example: 20 })
  limit!: number;
}
```

#### 5.3 嵌套 DTO

```typescript
/**
 * 地址 DTO
 */
export class AddressDto {
  @ApiProperty({ description: "街道" })
  @IsString()
  street!: string;

  @ApiProperty({ description: "城市" })
  @IsString()
  city!: string;
}

/**
 * 创建用户 DTO（包含嵌套对象）
 */
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

## 工具链集成

### 1. 验证管道配置

**位置：** `apps/gateway/src/main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // 自动删除未在 DTO 中定义的属性
    forbidNonWhitelisted: true, // 如果有未定义的属性，抛出错误
    transform: true,            // 自动将请求体转换为 DTO 类实例
    transformOptions: {
      enableImplicitConversion: true,  // 启用隐式类型转换
    },
  })
);
```

**作用：**
- `whitelist: true` - 防止客户端提交额外字段
- `forbidNonWhitelisted: true` - 严格模式，拒绝包含未定义属性的请求
- `transform: true` - 自动类型转换（字符串 → 数字、字符串 → 日期等）

### 2. TypeScript 配置

**位置：** `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,  // 必须：为装饰器生成元数据
    "experimentalDecorators": true, // 必须：启用装饰器
    "strict": true
  }
}
```

**关键配置说明：**
- `emitDecoratorMetadata: true` - **必须启用**，否则 NestJS 的依赖注入和 Swagger 反射机制无法工作
- `experimentalDecorators: true` - 启用装饰器支持

### 3. 依赖包

```json
{
  "dependencies": {
    "@nestjs/swagger": "^11.0.0",      // Swagger 模块
    "class-validator": "^0.14.0",      // 参数验证
    "class-transformer": "^0.5.0"      // 类型转换
  }
}
```

## 常见问题和解决方案

### 1. DTO 不显示在 Swagger 中

**症状：** 
- Swagger UI 中请求体显示为空对象 `{}`
- Schema 列表中找不到某个 DTO
- 响应类型不显示具体字段

**排查步骤：**

#### 步骤 1：检查 Controller 中的 import 方式

```bash
# 检查是否有使用 import type
grep -rn "import type.*Dto" apps/*/src --include="*.controller.ts"
```

**修复：** 将所有 `import type` 改为普通 `import`

```bash
# 批量修复
find apps -name "*.controller.ts" -exec \
  sed -i 's/import type { \([^}]*Dto[^}]*\) }/import { \1 }/g' {} \;
```

#### 步骤 2：检查是否添加了 @ApiBody

```bash
# 检查所有 @Body() 参数是否有对应的 @ApiBody
grep -A 3 "@Body()" apps/*/src --include="*.controller.ts"
```

**修复：** 为所有 `@Body()` 参数添加 `@ApiBody({ type: XxxDto })`

#### 步骤 3：检查 @ApiResponse 是否使用 type

```bash
# 检查是否使用了 schema
grep -rn "ApiResponse.*schema" apps/*/src --include="*.controller.ts"
```

**修复：** 将 `schema: { example: {...} }` 改为 `type: XxxResponse`

#### 步骤 4：检查 DTO 是否已注册

```bash
# 检查 app.module.ts 中的 @ApiExtraModels
grep -A 100 "@ApiExtraModels" apps/*/src/app.module.ts
```

**修复：** 在 `@ApiExtraModels()` 中添加缺失的 DTO

### 2. 验证装饰器不生效

**症状：** 提交非法参数时，服务器没有返回验证错误

**排查：**

1. 检查 `main.ts` 中是否配置了 `ValidationPipe`
2. 检查 DTO 类是否使用了 `class-validator` 装饰器
3. 检查 Controller 方法参数是否使用了 `@Body()` 装饰器

**验证：**

```bash
# 测试验证是否生效
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "123"}'

# 应该返回 400 错误
```

### 3. 类型转换失败

**症状：** 查询参数或路径参数无法正确转换为数字、日期等类型

**解决方案：** 使用 `class-transformer` 的 `@Type()` 装饰器

```typescript
import { Type } from "class-transformer";

export class ListUsersDto {
  @ApiPropertyOptional({ description: "页码", default: 1 })
  @Type(() => Number)  // 自动转换为数字
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "创建日期" })
  @Type(() => Date)    // 自动转换为日期
  @IsDate()
  @IsOptional()
  createdAt?: Date;
}
```

### 4. 编译后元数据丢失

**症状：** 开发环境正常，生产环境 Swagger 显示异常

**诊断：**

```bash
# 检查编译后的文件
cat dist/src/user.controller.js | grep -A 3 "__metadata"

# 正确：
# tslib_1.__metadata("design:paramtypes", [create_user_dto_1.CreateUserDto])

# 错误：
# tslib_1.__metadata("design:paramtypes", [Function])
```

**原因：**
1. 使用了 `import type`
2. `tsconfig.json` 中未启用 `emitDecoratorMetadata`
3. 使用了接口（interface）而非类（class）

**修复：**
1. 确认 `tsconfig.json` 配置正确
2. 将所有 `import type` 改为普通 `import`
3. 将所有 interface 改为 class

## 最佳实践

### 1. 文件组织

#### 简单模块

```
src/modules/user/
├── user.dto.ts          # 所有 DTO 定义
├── user.controller.ts
├── user.service.ts
└── user.module.ts
```

#### 复杂模块

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

### 2. DTO 命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 创建请求 | Create{Resource}Dto | CreateUserDto |
| 更新请求 | Update{Resource}Dto | UpdateUserDto |
| 列表查询 | List{Resources}Dto | ListUsersDto |
| 单个响应 | {Resource}Response | UserResponse |
| 列表响应 | {Resource}ListResponse | UserListResponse |
| 操作响应 | {Action}Response | DeleteResponse |

### 3. 装饰器顺序

推荐顺序（从上到下）：

```typescript
@Post()
@ApiOperation({ summary: "操作说明" })        // 1. 操作说明
@ApiBody({ type: CreateXxxDto })              // 2. 请求体
@ApiResponse({ status: 201, type: XxxResponse })  // 3. 成功响应
@ApiResponse({ status: 400 })                 // 4. 错误响应
async create(@Body() dto: CreateXxxDto) {     // 5. 方法参数
  // ...
}
```

### 4. Code Review 检查清单

在合并代码前，检查以下内容：

- [ ] DTO 使用 `class` 而非 `interface`
- [ ] Controller 使用普通 `import`（不是 `import type`）
- [ ] `@Body()` 参数添加了 `@ApiBody({ type: XxxDto })`
- [ ] `@ApiResponse` 使用 `type` 而非 `schema`
- [ ] 所有 DTO 在 `@ApiExtraModels()` 中注册
- [ ] DTO 属性添加了 `@ApiProperty()` 或 `@ApiPropertyOptional()`
- [ ] 请求 DTO 添加了 `class-validator` 装饰器
- [ ] 需要类型转换的属性添加了 `@Type()` 装饰器
- [ ] 所有属性都有中文描述和示例值

### 5. 测试 Swagger 文档

```bash
# 1. 启动服务
pnpm dev

# 2. 访问 Swagger UI
open http://localhost:3000/swagger

# 3. 访问 Scalar UI
open http://localhost:3000/docs

# 4. 下载 OpenAPI JSON
curl http://localhost:3000/swagger-json > openapi.json

# 5. 下载 OpenAPI YAML
curl http://localhost:3000/swagger-yaml > openapi.yaml
```

## 高级主题

### 1. 自定义 Swagger UI

```typescript
SwaggerModule.setup("swagger", app, document, {
  swaggerOptions: {
    persistAuthorization: true,     // 持久化认证
    docExpansion: "none",          // 默认折叠
    filter: true,                  // 启用搜索
    showRequestDuration: true,     // 显示请求耗时
    displayRequestDuration: true,
    showExtensions: true,          // 显示扩展字段
    showCommonExtensions: true,
    syntaxHighlight: {             // 语法高亮
      activate: true,
      theme: "monokai"
    }
  },
  customSiteTitle: "My API - Swagger UI",
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui { font-family: "Inter", sans-serif }
  `,
  customfavIcon: "/favicon.ico",
  customJs: "/custom.js"
});
```

### 2. 多文档支持

```typescript
// 创建多个文档
const publicConfig = new DocumentBuilder()
  .setTitle("Public API")
  .build();

const adminConfig = new DocumentBuilder()
  .setTitle("Admin API")
  .addBearerAuth()
  .build();

const publicDocument = SwaggerModule.createDocument(app, publicConfig, {
  include: [PublicController, HealthController],
});

const adminDocument = SwaggerModule.createDocument(app, adminConfig, {
  include: [AdminController],
});

SwaggerModule.setup("api", app, publicDocument);
SwaggerModule.setup("admin-api", app, adminDocument);
```

### 3. API 版本管理

```typescript
const config = new DocumentBuilder()
  .setTitle("My API")
  .setVersion("2.0.0")
  .addServer("https://api.example.com/v2", "Production v2")
  .addServer("https://staging-api.example.com/v2", "Staging v2")
  .addServer("http://localhost:3000", "Local Development")
  .build();
```

### 4. 导出文档用于其他工具

```typescript
// 生成文档后导出
const document = SwaggerModule.createDocument(app, config);

// 导出为 JSON
fs.writeFileSync("openapi.json", JSON.stringify(document, null, 2));

// 导出为 YAML
const yaml = require("js-yaml");
fs.writeFileSync("openapi.yaml", yaml.dump(document));

// 用于：
// - Postman 导入
// - API Gateway 配置
// - 客户端代码生成
// - API 测试工具
```

## 总结

### 核心要点

1. **必须使用 class** - DTO 必须使用 class 而非 interface
2. **禁止 import type** - Controller 中不能使用 `import type` 导入 DTO
3. **必须添加 @ApiBody** - 所有 `@Body()` 参数都要加 `@ApiBody({ type: XxxDto })`
4. **使用 type 而非 schema** - `@ApiResponse` 应该使用 `type: XxxResponse`
5. **注册所有 DTO** - 在 `@ApiExtraModels()` 中注册所有 DTO

### 工具链

- `@nestjs/swagger` - Swagger 模块
- `class-validator` - 参数验证
- `class-transformer` - 类型转换
- `@scalar/api-reference` - 现代 UI（CDN）

### 文档访问

- Swagger UI: `http://localhost:3000/swagger`
- Scalar UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/swagger-json`
- OpenAPI YAML: `http://localhost:3000/swagger-yaml`

## 参考资料

- [NestJS OpenAPI Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [Scalar API Reference](https://github.com/scalar/scalar)
- [Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)
