# Better-Auth 核心原理深度解析

## 一、整体架构概览

Better-Auth 是一个全面的 TypeScript 认证框架，采用**模块化插件架构**设计，核心包 `@better-auth/core` 提供了认证系统的基础设施。

### 核心模块结构

```
packages/core/src/
├── api/               # API 端点和中间件系统
├── async_hooks/       # 异步上下文存储（基于 AsyncLocalStorage）
├── context/           # 请求上下文管理
├── db/                # 数据库抽象层
│   ├── adapter/       # 适配器工厂模式
│   └── schema/        # 核心数据模型
├── oauth2/            # OAuth2 协议实现
├── social-providers/  # 社交登录提供商
├── types/             # TypeScript 类型定义
└── utils/             # 工具函数
```

---

## 二、核心架构模式

### 2.1 上下文系统

Better-Auth 使用 **AsyncLocalStorage** 实现请求级别的上下文隔离，这是框架的核心机制。

```typescript:1:51:forks/better-auth/packages/core/src/context/endpoint-context.ts
// 通过 AsyncLocalStorage 存储认证上下文
export async function runWithEndpointContext<T>(
  context: AuthEndpointContext,
  fn: () => T,
): Promise<T> {
  const als = await ensureAsyncStorage();
  return als.run(context, fn);
}

// 在任何地方获取当前请求的认证上下文
export async function getCurrentAuthContext(): Promise<AuthEndpointContext> {
  const als = await ensureAsyncStorage();
  const context = als.getStore();
  if (!context) {
    throw new Error("No auth context found...");
  }
  return context;
}
```

**设计优势：**

- 无需显式传递上下文参数
- 支持异步调用链中的上下文传递
- 每个请求隔离，避免状态污染

### 2.2 插件系统

插件系统采用**声明式配置 + 生命周期钩子**的设计模式。

```typescript:52:175:forks/better-auth/packages/core/src/types/plugin.ts
export type BetterAuthPlugin = {
  id: LiteralString;

  // 初始化钩子 - 可以修改上下文和配置
  init?: (ctx: AuthContext) => Awaitable<{
    context?: DeepPartial<Omit<AuthContext, "options">>;
    options?: Partial<BetterAuthOptions>;
  } | void>;

  // 端点扩展 - 添加新的 API 端点
  endpoints?: { [key: string]: Endpoint };

  // 中间件 - 拦截请求处理
  middlewares?: { path: string; middleware: Middleware }[];

  // 请求/响应钩子
  onRequest?: (request: Request, ctx: AuthContext) => Promise<...>;
  onResponse?: (response: Response, ctx: AuthContext) => Promise<...>;

  // 前置/后置钩子
  hooks?: {
    before?: { matcher: (context) => boolean; handler: AuthMiddleware }[];
    after?: { matcher: (context) => boolean; handler: AuthMiddleware }[];
  };

  // 数据库 Schema 扩展
  schema?: BetterAuthPluginDBSchema;

  // 数据库迁移
  migrations?: Record<string, Migration>;

  // 自定义数据库操作
  adapter?: { [key: string]: (...args: any[]) => Awaitable<any> };
};
```

**核心特性：**

1. **Schema 扩展**：插件可以添加自定义字段到核心表
2. **端点注册**：添加新的 API 路由
3. **中间件注入**：在特定路径注入中间件
4. **生命周期钩子**：在请求处理前后执行自定义逻辑

### 2.3 数据库适配器工厂模式

Better-Auth 使用**工厂模式 + 转换层**设计数据库适配器，支持多种数据库。

```typescript:54:59:forks/better-auth/packages/core/src/db/adapter/factory.ts
export const createAdapterFactory =
  <Options extends BetterAuthOptions>({
    adapter: customAdapter,
    config: cfg,
  }: AdapterFactoryOptions): AdapterFactory<Options> =>
  (options: Options): DBAdapter<Options> => {
    // 创建适配器实例...
  };
```

**核心转换流程：**

```typescript:185:293:forks/better-auth/packages/core/src/db/adapter/factory.ts
const transformInput = async (
  data: Record<string, any>,
  defaultModelName: string,
  action: "create" | "update" | "findOne" | "findMany",
  forceAllowId?: boolean,
) => {
  const transformedData: Record<string, any> = {};
  const fields = schema[defaultModelName]!.fields;

  for (const field in fields) {
    let value = data[field];
    const fieldAttributes = fields[field];

    // 1. 字段名映射（例如 id -> _id）
    const newFieldName = newMappedKeys[field] || fields[field]!.fieldName || field;

    // 2. 类型转换（日期、布尔值、JSON 等）
    if (fieldAttributes.type === "date" && !config.supportsDates) {
      value = value.toISOString();
    } else if (fieldAttributes.type === "boolean" && !config.supportsBooleans) {
      value = value ? 1 : 0;
    } else if (fieldAttributes.type === "json" && !config.supportsJSON) {
      value = JSON.stringify(value);
    }

    // 3. 自定义转换器
    if (fieldAttributes.transform?.input) {
      value = await fieldAttributes.transform.input(value);
    }

    transformedData[newFieldName] = value;
  }
  return transformedData;
};
```

**支持的数据库特性适配：**

- `supportsBooleans`：是否支持布尔类型（否则用 0/1）
- `supportsDates`：是否支持日期类型（否则用 ISO 字符串）
- `supportsJSON`：是否支持 JSON 类型（否则用字符串）
- `supportsArrays`：是否支持数组类型
- `supportsUUIDs`：是否原生支持 UUID
- `transaction`：是否支持事务

---

## 三、核心数据模型

Better-Auth 定义了四个核心数据表：

### 3.1 User 表

```typescript:9:14:forks/better-auth/packages/core/src/db/schema/user.ts
export const userSchema = coreSchema.extend({
  email: z.string().transform((val) => val.toLowerCase()),
  emailVerified: z.boolean().default(false),
  name: z.string(),
  image: z.string().nullish(),
});
```

### 3.2 Session 表

```typescript:9:15:forks/better-auth/packages/core/src/db/schema/session.ts
export const sessionSchema = coreSchema.extend({
  userId: z.coerce.string(),
  expiresAt: z.date(),
  token: z.string(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
});
```

### 3.3 Account 表（OAuth）

存储第三方登录信息：

```typescript:204:289:forks/better-auth/packages/core/src/db/get-tables.ts
account: {
  modelName: "account",
  fields: {
    accountId: { type: "string", required: true },
    providerId: { type: "string", required: true },
    userId: { type: "string", references: { model: "user", field: "id" } },
    accessToken: { type: "string", returned: false },
    refreshToken: { type: "string", returned: false },
    idToken: { type: "string", returned: false },
    accessTokenExpiresAt: { type: "date" },
    refreshTokenExpiresAt: { type: "date" },
    scope: { type: "string" },
    password: { type: "string", returned: false },
  },
}
```

### 3.4 Verification 表

用于邮箱验证、密码重置等场景：

```typescript:58:96:forks/better-auth/packages/core/src/db/get-tables.ts
verification: {
  fields: {
    identifier: { type: "string", required: true, index: true },
    value: { type: "string", required: true },
    expiresAt: { type: "date", required: true },
  },
}
```

---

## 四、OAuth2 协议实现

### 4.1 OAuth Provider 接口

```typescript:26:95:forks/better-auth/packages/core/src/oauth2/oauth-provider.ts
export interface OAuthProvider {
  id: LiteralString;
  name: string;

  // 1. 创建授权 URL
  createAuthorizationURL: (data: {
    state: string;
    codeVerifier: string;
    scopes?: string[];
    redirectURI: string;
  }) => Awaitable<URL>;

  // 2. 验证授权码并获取令牌
  validateAuthorizationCode: (data: {
    code: string;
    redirectURI: string;
    codeVerifier?: string;
  }) => Promise<OAuth2Tokens | null>;

  // 3. 获取用户信息
  getUserInfo: (token: OAuth2Tokens) => Promise<{
    user: OAuth2UserInfo;
    data: T;
  } | null>;

  // 4. 刷新令牌（可选）
  refreshAccessToken?: (refreshToken: string) => Promise<OAuth2Tokens>;

  // 5. 撤销令牌（可选）
  revokeToken?: (token: string) => Promise<void>;
}
```

### 4.2 OAuth2 令牌结构

```typescript:3:16:forks/better-auth/packages/core/src/oauth2/oauth-provider.ts
export interface OAuth2Tokens {
  tokenType?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scopes?: string[];
  idToken?: string;
  raw?: Record<string, unknown>; // 保留提供商特定字段
}
```

---

## 五、API 端点系统

### 5.1 端点创建

Better-Auth 使用 `better-call` 库创建类型安全的 API 端点：

```typescript:73:199:forks/better-auth/packages/core/src/api/index.ts
export function createAuthEndpoint(
  pathOrOptions: any,
  handlerOrOptions: any,
  handlerOrNever?: any,
) {
  const path = typeof pathOrOptions === "string" ? pathOrOptions : undefined;
  const options = typeof handlerOrOptions === "object" ? handlerOrOptions : pathOrOptions;
  const handler = typeof handlerOrOptions === "function" ? handlerOrOptions : handlerOrNever;

  if (path) {
    return createEndpoint(
      path,
      { ...options, use: [...(options?.use || []), ...use] },
      async (ctx: any) => runWithEndpointContext(ctx, () => handler(ctx)),
    );
  }

  return createEndpoint(
    { ...options, use: [...(options?.use || []), ...use] },
    async (ctx: any) => runWithEndpointContext(ctx, () => handler(ctx)),
  );
}
```

### 5.2 中间件系统

```typescript:18:40:forks/better-auth/packages/core/src/api/index.ts
// 基础选项中间件 - 提供 AuthContext
export const optionsMiddleware = createMiddleware(async () => {
  return {} as AuthContext;
});

// 认证中间件工厂
export const createAuthMiddleware = createMiddleware.create({
  use: [
    optionsMiddleware,
    // 后置钩子中间件
    createMiddleware(async () => {
      return {} as {
        returned?: unknown;
        responseHeaders?: Headers;
      };
    }),
  ],
});
```

### 5.3 `better-call` 与 API 端点系统（深入）

`better-call` 在 Better-Auth 体系里承担的是**HTTP 端点运行时内核**，而 Better-Auth 在其之上封装了**认证语义层**。两者是“底层执行引擎 + 上层认证编排”的关系。

#### 5.3.1 `better-call` 的职责边界

在 `@better-auth/core` 中，端点能力直接来自 `better-call`：

```typescript:1:15:forks/better-auth/packages/core/src/api/index.ts
import type {
	Endpoint,
	EndpointContext,
	EndpointMetadata,
	EndpointRuntimeOptions,
	HTTPMethod,
	Middleware,
	ResolveBodyInput,
	ResolveErrorInput,
	ResolveMetaInput,
	ResolveQueryInput,
	StandardSchemaV1,
} from "better-call";
import { createEndpoint, createMiddleware } from "better-call";
```

核心能力可以归纳为：

- `createEndpoint`：定义端点（路径、方法、输入输出 schema、handler）
- `createMiddleware`：定义和组合中间件链
- `EndpointContext`：提供强类型上下文（query/body/headers/request/context）
- `createRouter`：将端点集合编译为统一路由入口（在 `packages/better-auth` 层使用）

#### 5.3.2 Core 层封装：`createAuthEndpoint`

`@better-auth/core/api` 不是重写端点系统，而是包装 `better-call.createEndpoint`，增加两项认证基础能力：

1. 自动注入 `optionsMiddleware`（把 `AuthContext` 放入上下文类型系统）
2. 通过 `runWithEndpointContext` 将当前请求绑定到 AsyncLocalStorage

```typescript:167:199:forks/better-auth/packages/core/src/api/index.ts
export function createAuthEndpoint(
	pathOrOptions: any,
	handlerOrOptions: any,
	handlerOrNever?: any,
) {
	const path: string | undefined =
		typeof pathOrOptions === "string" ? pathOrOptions : undefined;
	const options: EndpointRuntimeOptions =
		typeof handlerOrOptions === "object" ? handlerOrOptions : pathOrOptions;
	const handler =
		typeof handlerOrOptions === "function" ? handlerOrOptions : handlerOrNever;

	if (path) {
		return createEndpoint(
			path,
			{
				...options,
				use: [...(options?.use || []), ...use],
			} as any,
			async (ctx: any) => runWithEndpointContext(ctx, () => handler(ctx)),
		);
	}

	return createEndpoint(
		{
			...options,
			use: [...(options?.use || []), ...use],
		} as any,
		async (ctx: any) => runWithEndpointContext(ctx, () => handler(ctx)),
	);
}
```

这意味着端点处理函数内部和其异步调用链中，都可以安全读取“当前请求的认证上下文”。

#### 5.3.3 Better-Auth 层编排：端点聚合 + Router 管线

在 `packages/better-auth/src/api/index.ts`，系统将“内置端点 + 插件端点”聚合后交给 `createRouter`，并注入全局路由生命周期逻辑。

```typescript:273:295:forks/better-auth/packages/better-auth/src/api/index.ts
export const router = <Option extends BetterAuthOptions>(
	ctx: AuthContext,
	options: Option,
) => {
	const { api, middlewares } = getEndpoints(ctx, options);
	const basePath = new URL(ctx.baseURL).pathname;

	return createRouter(api, {
		routerContext: ctx,
		openapi: {
			disabled: true,
		},
		basePath,
		routerMiddleware: [
			{
				path: "/**",
				middleware: originCheckMiddleware,
			},
			...middlewares,
		],
```

该路由层统一处理：

- `onRequest`：禁用路径检查、插件请求钩子、限流预检查
- `onResponse`：限流回写、插件响应钩子
- `onError`：统一 APIError/日志/抛出策略

#### 5.3.4 执行器转换层：`toAuthEndpoints`

`toAuthEndpoints` 是 Better-Auth API 体系的关键桥梁。它把通用 `Endpoint` 包装为“认证端点执行器”，补齐认证领域所需的统一行为：

- before hooks（用户 hooks + 插件 hooks）
- handler 执行与 APIError 语义化处理
- after hooks
- 响应头合并、返回值规范化（对象/带状态/原生 Response）
- tracing 埋点（operationId、route、hook type）

```typescript:83:101:forks/better-auth/packages/better-auth/src/api/to-auth-endpoints.ts
export function toAuthEndpoints<const E extends Record<string, Endpoint>>(
	endpoints: E,
	ctx: AuthContext | Promise<AuthContext>,
): E {
	const api: Record<string, ...> = {};

	for (const [key, endpoint] of Object.entries(endpoints)) {
		api[key] = async (context?: UserInputContext) => {
			const operationId = getOperationId(endpoint, key);
```

从职责上可以总结为：  
**`better-call` 负责“如何定义并调用端点”，Better-Auth 负责“端点调用前后需要完成哪些认证平台级能力”。**

#### 5.3.5 一次请求的完整调用链（简化）

1. Router 收到请求（`createRouter`）
2. `onRequest` 执行（origin check、插件 `onRequest`、限流）
3. 匹配 endpoint 并进入 `toAuthEndpoints` 包装函数
4. 构造内部上下文并绑定 AsyncLocalStorage
5. 执行 before hooks
6. 执行端点 handler
7. 执行 after hooks，合并 headers/返回值
8. `onResponse` 执行（插件 `onResponse`、限流回写）
9. 异常路径进入 `onError`（统一日志与错误策略）

#### 5.3.6 这种分层设计的价值

- **解耦性强**：传输协议与认证业务分离，演进成本低
- **类型一致性**：从端点定义到上下文和返回值保持强类型
- **可扩展性高**：插件可以增量注入 endpoint/middleware/hooks
- **可观测性好**：统一 tracing 埋点，便于定位认证链路问题
- **行为一致性**：所有端点共享同一套错误、钩子、响应处理语义

#### 5.3.7 常见误区：`better-call` 是否等同于 Web 服务器？

结论：**不等同**。`better-call` 更准确的定位是“类型安全的 API 路由与端点执行引擎”，而不是底层 Web 服务器。

可以按三层理解：

1. **Web 服务器层**：Node/Bun/Workers 运行时（负责监听端口、接收 HTTP 请求）
2. **`better-call` 层**：负责路由分发、端点执行、中间件链、输入输出规范化
3. **`better-auth` 层**：在 `better-call` 之上叠加认证语义（Session、OAuth、Hooks、限流、Cookie 策略）

因此，`better-call` 更接近“应用层路由内核”，而不是“底层网络服务器”。

#### 5.3.8 在 NestJS 集成下，谁在监听端口？

在 `better-auth + nestjs` 的集成模式里，**只有 NestJS 在监听端口**（Express/Fastify adapter）。  
`better-call` 与 `better-auth` 都不会单独启动一个新的监听器，它们只是被挂载到 NestJS 请求链中的处理器。

当前项目（`@oksai/nestjs-better-auth`）的集成方式是：

1. 使用 `toNodeHandler(this.options.auth)` 将 Better-Auth 实例转换为 Node handler
2. 通过 Nest 中间件 `consumer.apply(...).forRoutes(this.basePath)` 挂到指定路由（默认 `/api/auth`）

关键代码如下：

```typescript:12:14:libs/shared/nestjs-better-auth/src/auth-module.ts
import { createAuthMiddleware } from "better-auth/api";
import { toNodeHandler } from "better-auth/node";
```

```typescript:137:145:libs/shared/nestjs-better-auth/src/auth-module.ts
const handler = toNodeHandler(this.options.auth);
consumer
  .apply((req: Request, res: Response) => {
    if (this.options.middleware) {
      return this.options.middleware(req, res, () => handler(req, res));
    }
    return handler(req, res);
  })
  .forRoutes(this.basePath);
```

所以对外访问时的真实链路是：

`Client -> NestJS HTTP Server(监听端口) -> Better-Auth handler(内部用 better-call 执行路由/端点)`

#### 5.3.9 NestJS 如何分派请求到 Better-Auth？

在当前集成实现中，NestJS 是通过 **`basePath` 路由前缀** 来分派请求的。

核心机制：

1. `AuthModule` 在初始化时读取 `auth.options.basePath`（默认 `/api/auth`）
2. 通过 `consumer.apply(...).forRoutes(this.basePath)` 仅对该路径挂载 Better-Auth handler
3. 命中 `basePath` 的请求进入 Better-Auth（内部再由 `better-call` 路由到具体 endpoint）
4. 未命中 `basePath` 的请求继续走普通 NestJS controller 路由

`basePath` 初始化代码：

```typescript:64:68:libs/shared/nestjs-better-auth/src/auth-module.ts
// Get basePath from options or use default
// - Ensure basePath starts with /
// - Ensure basePath doesn't end with /
this.basePath = normalizePath(this.options.auth.options.basePath ?? "/api/auth");
```

请求分派挂载代码：

```typescript:137:145:libs/shared/nestjs-better-auth/src/auth-module.ts
const handler = toNodeHandler(this.options.auth);
consumer
  .apply((req: Request, res: Response) => {
    if (this.options.middleware) {
      return this.options.middleware(req, res, () => handler(req, res));
    }
    return handler(req, res);
  })
  .forRoutes(this.basePath);
```

另外，body parser 的“跳过策略”也同样使用 `basePath` 判断，以避免 Better-Auth 路由被 Nest 默认解析干扰。

### 5.4 `signInEmail` 端到端调用链（从路由到会话落库）

本节以 `/sign-in/email` 为样本，展示 Better-Auth 在真实登录场景下的完整执行路径。  
对应代码入口位于：

```typescript:340:347:forks/better-auth/packages/better-auth/src/api/routes/sign-in.ts
export const signInEmail = <O extends BetterAuthOptions>() =>
	createAuthEndpoint(
		"/sign-in/email",
		{
			method: "POST",
			operationId: "signInEmail",
			use: [formCsrfMiddleware],
```

#### 5.4.1 路由装载阶段（启动期）

`router()` 启动时将内置端点 + 插件端点合并，并交给 `createRouter`。  
`signInEmail` 此时已经成为路由表中的一个 Endpoint：

```typescript:230:281:forks/better-auth/packages/better-auth/src/api/index.ts
const baseEndpoints = {
	signInSocial: signInSocial<Option>(),
	callbackOAuth,
	getSession: getSession<Option>(),
	signOut,
	signUpEmail: signUpEmail<Option>(),
	signInEmail: signInEmail<Option>(),
	// ...
};
const endpoints = {
	...baseEndpoints,
	...pluginEndpoints,
	ok,
	error,
} as const;
const api = toAuthEndpoints(endpoints, ctx);
// ...
return createRouter(api, {
	routerContext: ctx,
```

#### 5.4.2 请求进入 Router（运行期）

当客户端发送 `POST /sign-in/email`：

1. Router 先执行全局 `onRequest`（禁用路径检查、插件 `onRequest`、限流）
2. 命中 `signInEmail` endpoint
3. 进入 `toAuthEndpoints` 包装执行器，创建内部上下文并绑定 AsyncLocalStorage
4. 先跑 before hooks，再跑 endpoint handler，再跑 after hooks

这一步保证了所有端点都走同一条“可观测 + 可扩展 + 统一错误语义”的链路。

#### 5.4.3 参数与安全校验

`signInEmail` 在 handler 内依次进行：

- 检查是否启用 `emailAndPassword.enabled`
- 校验邮箱格式
- 查询用户及其账号列表（包含 credential 账号）
- 无用户/无 credential 账号/无密码时执行“伪哈希”以降低时序攻击风险
- 校验密码 hash
- 若配置了必须验证邮箱，则执行验证邮箱流程（可选发送验证邮件）

关键安全分支示例：

```typescript:469:477:forks/better-auth/packages/better-auth/src/api/routes/sign-in.ts
if (!user) {
	// Hash password to prevent timing attacks from revealing valid email addresses
	// By hashing passwords for invalid emails, we ensure consistent response times
	await ctx.context.password.hash(password);
	ctx.context.logger.error("User not found", { email });
	throw APIError.from(
		"UNAUTHORIZED",
		BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD,
	);
}
```

#### 5.4.4 进入 `internalAdapter`：用户查询与会话创建

`signInEmail` 的 DB 操作不是直接调用底层 adapter，而是通过 `internalAdapter` 统一封装：

- 查询用户：`internalAdapter.findUserByEmail(email, { includeAccounts: true })`
- 创建会话：`internalAdapter.createSession(userId, dontRememberMe)`

```typescript:465:468:forks/better-auth/packages/better-auth/src/api/routes/sign-in.ts
const user = await ctx.context.internalAdapter.findUserByEmail(email, {
	includeAccounts: true,
});
```

```typescript:546:549:forks/better-auth/packages/better-auth/src/api/routes/sign-in.ts
const session = await ctx.context.internalAdapter.createSession(
	user.user.id,
	ctx.body.rememberMe === false,
);
```

`internalAdapter` 由 `createAuthContext()` 初始化并注入：

```typescript:353:360:forks/better-auth/packages/better-auth/src/context/create-context.ts
internalAdapter: createInternalAdapter(adapter, {
	options,
	logger,
	hooks: options.databaseHooks
		? [{ source: "user", hooks: options.databaseHooks }]
		: [],
	generateId: generateIdFunc,
}),
```

#### 5.4.5 `createSession` 的内部行为（核心）

`createInternalAdapter.createSession` 会构造完整会话对象并调用 `createWithHooks`：

- 采集 `ipAddress`/`userAgent`
- 按 `rememberMe` 计算 `expiresAt`
- 生成随机 `token`
- 写入 `createdAt`/`updatedAt`
- 合并 session additional fields 默认值

```typescript:311:324:forks/better-auth/packages/better-auth/src/db/internal-adapter.ts
const data = {
	ipAddress: headers ? getIp(headers, options) || "" : "",
	userAgent: headers?.get("user-agent") || "",
	...rest,
	expiresAt: dontRememberMe
		? getDate(60 * 60 * 24, "sec") // 1 day
		: getDate(sessionExpiration, "sec"),
	userId,
	token: generateId(32),
	createdAt: new Date(),
	updatedAt: new Date(),
	...defaultAdditionalFields,
	...(overrideAll ? rest : {}),
} satisfies Partial<Session>;
```

如果配置了 `secondaryStorage`，还会同步维护：

- `active-sessions-{userId}` 列表
- `token -> { session, user }` 缓存映射

并依据 `storeSessionInDatabase` 决定是否同时落数据库。

#### 5.4.6 写 Cookie 与会话缓存

会话创建成功后，`signInEmail` 调用 `setSessionCookie()`：

```typescript:559:566:forks/better-auth/packages/better-auth/src/api/routes/sign-in.ts
await setSessionCookie(
	ctx,
	{
		session,
		user: user.user,
	},
	ctx.body.rememberMe === false,
);
```

`setSessionCookie` 会完成三件事：

1. 写签名 `session_token`
2. `rememberMe=false` 时写 `dont_remember` 标记
3. 若启用 cookie cache，写 `session_data`（支持 `compact/jwt/jwe` 策略）

```typescript:285:306:forks/better-auth/packages/better-auth/src/cookies/index.ts
await ctx.setSignedCookie(
	ctx.context.authCookies.sessionToken.name,
	session.session.token,
	ctx.context.secret,
	{
		...options,
		maxAge,
		...overrides,
	},
);
// ...
await setCookieCache(ctx, session, dontRememberMe);
ctx.context.setNewSession(session);
```

#### 5.4.7 响应返回与重定向语义

最后根据是否提供 `callbackURL` 决定返回语义：

- 有 `callbackURL`：设置 `Location`，返回 `redirect: true`
- 无 `callbackURL`：返回 `redirect: false` + token + user

```typescript:568:576:forks/better-auth/packages/better-auth/src/api/routes/sign-in.ts
if (ctx.body.callbackURL) {
	ctx.setHeader("Location", ctx.body.callbackURL);
}

return ctx.json({
	redirect: !!ctx.body.callbackURL,
	token: session.token,
	url: ctx.body.callbackURL,
	user: parseUserOutput(ctx.context.options, user.user) as User<
```

#### 5.4.8 可扩展点与 NestJS 集成建议

围绕 `signInEmail` 的最佳扩展点：

- **审计与告警**：使用 `options.hooks.before/after` 或插件 hooks
- **数据库审计字段**：使用 `databaseHooks.session.create.before/after`
- **风控策略**：在 route 前置 middleware 或插件 `onRequest` 做 IP/设备策略
- **多存储策略**：结合 `secondaryStorage + storeSessionInDatabase` 做读写分层

在 NestJS 集成层（如 `@oksai/nestjs-better-auth`）建议优先复用这些原生扩展点，而不是在 controller 层重复实现认证核心逻辑。

---

## 六、认证上下文

`AuthContext` 是框架的核心配置对象，包含所有运行时需要的信息：

```typescript:268:412:forks/better-auth/packages/core/src/types/context.ts
export type AuthContext<Options extends BetterAuthOptions> =
  PluginContext<Options> &
  InfoContext & {
    options: Options;
    trustedOrigins: string[];
    trustedProviders: string[];
    isTrustedOrigin: (url: string) => boolean;

    // Session 管理
    session: { session: Session; user: User } | null;
    newSession: { session: Session; user: User } | null;
    setNewSession: (session: {...} | null) => void;

    // 核心组件
    socialProviders: OAuthProvider[];
    authCookies: BetterAuthCookies;
    logger: Logger;
    rateLimit: RateLimitConfig;

    // 数据库
    adapter: DBAdapter<Options>;
    internalAdapter: InternalAdapter<Options>;
    tables: BetterAuthDBSchema;
    secondaryStorage: SecondaryStorage | undefined;

    // 密码处理
    password: {
      hash: (password: string) => Promise<string>;
      verify: (data: { password: string; hash: string }) => Promise<boolean>;
      config: { minPasswordLength: number; maxPasswordLength: number };
      checkPassword: (userId: string, ctx: GenericEndpointContext) => Promise<boolean>;
    };

    // 工具函数
    secret: string;
    secretConfig: string | SecretConfig;
    generateId: (options: { model: ModelNames; size?: number }) => string | false;
    createAuthCookie: (name: string, attributes?: CookieOptions) => BetterAuthCookie;

    // 后台任务
    runInBackground: (promise: Promise<unknown>) => void;
    runInBackgroundOrAwait: (promise: Promise<unknown>) => Awaitable<unknown>;
  };
```

---

## 七、关键设计模式总结

### 7.1 工厂模式

- **数据库适配器**：`createAdapterFactory` 创建不同数据库的适配器
- **OAuth Provider**：每个社交登录提供商都是独立的工厂函数

### 7.2 依赖注入

- 通过 `AuthContext` 注入所有依赖
- 使用 `AsyncLocalStorage` 实现隐式传递

### 7.3 插件架构

- 核心功能最小化
- 所有扩展通过插件实现
- 支持插件间的组合和依赖

### 7.4 Schema 驱动

- 数据模型使用 Zod 定义
- 自动生成数据库迁移
- 支持类型推断

### 7.5 中间件链

- 请求处理通过中间件链式调用
- 支持前置/后置钩子
- 可插拔的中间件系统

---

## 八、关键特性实现

### 8.1 账号关联

Better-Auth 支持自动账号关联：

```typescript:1001:1077:forks/better-auth/packages/core/src/types/init-options.ts
accountLinking?: {
  enabled?: boolean; // 默认 true
  disableImplicitLinking?: boolean; // 禁用隐式关联
  trustedProviders?: string[] | ((request?: Request) => Awaitable<string[]>);
  allowDifferentEmails?: boolean; // 允许不同邮箱的账号关联
  allowUnlinkingAll?: boolean; // 允许解绑所有账号
  updateUserInfoOnLink?: boolean; // 关联时更新用户信息
};
```

### 8.2 密码加密

默认使用 Scrypt 算法，支持自定义：

```typescript:689:695:forks/better-auth/packages/core/src/types/init-options.ts
password?: {
  hash?: (password: string) => Promise<string>;
  verify?: (data: { hash: string; password: string }) => Promise<boolean>;
};
```

### 8.3 Session 策略

```typescript:848:988:forks/better-auth/packages/core/src/types/init-options.ts
session?: {
  expiresIn?: number; // 默认 7 天
  updateAge?: number; // 默认 1 天刷新一次
  disableSessionRefresh?: boolean;
  deferSessionRefresh?: boolean; // POST 刷新，GET 只读

  // Cookie 缓存策略
  cookieCache?: {
    enabled?: boolean;
    maxAge?: number; // 默认 5 分钟
    strategy?: "compact" | "jwt" | "jwe";
    refreshCache?: boolean | { updateAge?: number };
  };
};
```

### 8.4 密钥轮换

支持版本化的密钥轮换：

```typescript:452:462:forks/better-auth/packages/core/src/types/init-options.ts
secrets?: Array<{ version: number; value: string }>;

// 环境变量格式：BETTER_AUTH_SECRETS=2:base64secret,1:base64secret
// 第一个是当前加密密钥，其余用于解密旧数据
```

---

## 九、与 NestJS 集成要点

在你的项目中，`@oksai/nestjs-better-auth` 库封装了 Better-Auth 用于 NestJS：

1. **Module 封装**：使用 NestJS 的模块系统封装 Better-Auth 实例
2. **装饰器支持**：提供 `@CurrentUser()` 等装饰器获取当前用户
3. **Guard 集成**：实现认证守卫保护路由
4. **MikroORM 适配器**：已实现 MikroORM 数据库适配器

---

这份分析涵盖了 Better-Auth 的核心架构和设计原理。如果你想深入了解某个特定部分（如具体的 OAuth 流程、数据库迁移机制、或插件开发），可以告诉我，我可以进一步展开。
