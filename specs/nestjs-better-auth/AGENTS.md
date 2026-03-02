# AGENTS.md — NestJS Better Auth 集成

## 项目背景

将 Better Auth 认证框架集成到 NestJS 应用程序中，提供开箱即用的认证模块、守卫、装饰器和中间件，支持 HTTP、GraphQL、WebSocket 等多种执行上下文。

## 开始前

1. **阅读设计文档**
   - 阅读 `specs/nestjs-better-auth/design.md` 了解完整的技术设计、用户故事和 BDD 场景
   - 阅读 `specs/nestjs-better-auth/implementation.md` 了解当前实现进度
   - 阅读 `specs/nestjs-better-auth/decisions.md` 了解架构决策

2. **了解现有实现**
   - 查看 `libs/auth/nestjs-better-auth/src/` 中的实现代码
   - 查看 `libs/auth/nestjs-better-auth/examples/` 中的使用示例
   - 参考 Better Auth 官方文档了解插件能力

3. **学习相关技术**
   - [NestJS 动态模块](https://docs.nestjs.com/modules/dynamic-modules)
   - [NestJS 守卫](https://docs.nestjs.com/guards)
   - [NestJS 装饰器](https://docs.nestjs.com/custom-decorators)
   - [Better Auth 官方文档](https://www.better-auth.com)

4. **准备开发环境**
   - 确保依赖已安装（`pnpm install`）
   - 确保 Better Auth 已配置
   - 确保测试环境就绪

## 开发工作流程

遵循 `specs/_templates/workflow.md` 中的标准流程：

1. **用户故事**：在 `design.md` 中定义用户故事（符合 INVEST 原则）
2. **BDD 场景**：编写验收场景（Given-When-Then）
3. **TDD 循环**：
   - 🔴 Red: 编写失败的测试
   - 🟢 Green: 最简实现
   - 🔵 Refactor: 优化代码
4. **代码实现**：按照 NestJS 最佳实践实现

### Phase 1: 核心功能 - 已完成 ✅

**完成时间：** 2024-03-02

- ✅ 动态模块（forRoot/forRootAsync）
- ✅ 全局认证守卫
- ✅ 装饰器系统（8 个装饰器）
- ✅ 中间件（SkipBodyParsingMiddleware）
- ✅ 多执行上下文支持
- ✅ 单元测试（86 个测试，100% 通过）
- ✅ 集成测试
- ✅ 使用示例（5 个示例）
- ✅ 完整文档

### Phase 2: 增强功能 - 可选

**预计时间：** 1-2 周

**任务：**
1. 提升测试覆盖率到 80%+
2. 添加 E2E 测试示例项目
3. Fastify 适配器支持
4. 缓存组织角色查询结果
5. 装饰器组合（如 @AdminOnly）

## 代码模式

### 动态模块模式

```typescript
// auth-module-definition.ts
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AuthModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
```

### 装饰器模式

```typescript
// decorators.ts
import { SetMetadata } from '@nestjs/common';
import { ALLOW_ANONYMOUS_KEY } from './symbols';

export function AllowAnonymous(): MethodDecorator & ClassDecorator {
  return SetMetadata(ALLOW_ANONYMOUS_KEY, true);
}
```

### 守卫模式

```typescript
// auth-guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // 1. 检查 @AllowAnonymous()
    if (this.isAllowAnonymous(context)) {
      return true;
    }

    // 2. 获取会话
    const request = this.getRequestFromContext(context);
    const session = request.session;

    // 3. 检查 @OptionalAuth()
    if (this.isOptionalAuth(context) && !session) {
      return true;
    }

    // 4. 验证会话
    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    // 5. 检查角色
    this.checkRoles(context, session.user);
    this.checkOrgRoles(context, session.user);

    return true;
  }
}
```

### 懒加载可选依赖模式

```typescript
// utils.ts
export function getRequestFromGraphQLContext(context: ExecutionContext): Request {
  let GqlExecutionContext: any;
  try {
    // 懒加载 @nestjs/graphql
    GqlExecutionContext = require('@nestjs/graphql').GqlExecutionContext;
  } catch (error) {
    throw new Error(
      '@nestjs/graphql is not installed. Please install it to use GraphQL context: npm install @nestjs/graphql graphql'
    );
  }

  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req;
}
```

### 测试模式

```typescript
// auth-guard.spec.ts
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let authService: AuthService;

  beforeEach(() => {
    reflector = new Reflector();
    authService = { api: {} } as any;
    guard = new AuthGuard(reflector, authService);
  });

  describe('canActivate', () => {
    it('should allow access with @AllowAnonymous()', () => {
      const context = createMockExecutionContext();
      jest.spyOn(reflector, 'get').mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access without session', () => {
      const context = createMockExecutionContext({ session: null });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
```

## 不要做

### 不要偏离技术规格

- ❌ 不要添加 `design.md` 之外的功能
- ❌ 不要破坏与 Better Auth 插件的兼容性
- ❌ 不要引入强依赖可选包（graphql, websockets）
- ❌ 不要跳过单元测试和集成测试

### 不要破坏现有功能

- ❌ 不要修改已发布的 API 签名
- ❌ 不要删除已使用的装饰器
- ❌ 不要改变守卫的默认行为

### 不要忽视代码质量

- ❌ 不要跳过 TSDoc 注释（公共 API 必须有文档）
- ❌ 不要使用 any 类型（使用 unknown 或具体类型）
- ❌ 不要忽略 TypeScript 错误
- ❌ 不要跳过 lint 检查

### 不要忘记文档

- ❌ 不要忘记更新 README.md
- ❌ 不要忘记更新 CHANGELOG.md
- ❌ 不要忘记添加使用示例

## 测试策略

### 单元测试（70%）
- 核心功能：AuthGuard、装饰器、工具函数
- 覆盖率目标：核心功能 100%，整体 80%+
- 测试命名：`should {behavior} when {condition}`

**重点测试：**
- AuthGuard 的认证逻辑
- 装饰器的元数据设置
- 多执行上下文的支持
- 边界情况和错误处理

### 集成测试（20%）
- AuthModule 完整集成
- 多执行上下文测试
- 钩子系统测试
- Better Auth 插件集成

### E2E 测试（10%）
- 完整认证流程测试
- GraphQL 集成测试
- WebSocket 集成测试

**测试命令：**
```bash
# 运行单元测试
pnpm vitest run libs/auth/nestjs-better-auth/src/**/*.spec.ts

# 运行集成测试
pnpm vitest run libs/auth/nestjs-better-auth/test/**/*.spec.ts

# 运行所有测试
pnpm vitest run libs/auth/nestjs-better-auth/

# 运行测试并生成覆盖率
pnpm vitest run --coverage libs/auth/nestjs-better-auth/
```

## 常见问题

### Q: 如何添加新的装饰器？

**A:** 遵循以下步骤：

1. 在 `decorators.ts` 中定义装饰器
2. 在 `symbols.ts` 中定义元数据 Symbol
3. 在 `auth-guard.ts` 中添加检查逻辑
4. 编写单元测试（至少 3 个）
5. 添加使用示例
6. 更新 README.md

### Q: 如何支持新的执行上下文？

**A:** 遵循以下步骤：

1. 在 `utils.ts` 的 `getRequestFromContext()` 中添加新类型
2. 使用懒加载处理可选依赖
3. 在 `auth-guard.ts` 中添加适配逻辑
4. 编写单元测试（Mock 可选依赖）
5. 添加集成测试
6. 编写使用示例

### Q: 如何保证与 Better Auth 插件兼容？

**A:**

1. 使用 Better Auth 官方 API，不依赖内部实现
2. 测试与 admin 和 organization 插件的集成
3. 参考 Better Auth 官方文档和示例
4. 关注 Better Auth 版本更新

### Q: 如何处理可选依赖？

**A:**

1. 使用 `require()` 懒加载
2. 捕获加载错误，抛出明确的错误信息
3. 在 README 中说明可选依赖
4. 编写测试时 Mock 可选依赖

### Q: 如何提升测试覆盖率？

**A:**

1. 识别未覆盖的代码（`pnpm vitest run --coverage`）
2. 为边界情况添加测试
3. 为错误处理路径添加测试
4. 为中间件和钩子添加集成测试
5. 考虑 E2E 测试覆盖复杂场景

### Q: 如何调试认证问题？

**A:**

1. 启用 NestJS 日志（设置 `logger: ['log', 'error', 'warn', 'debug']`）
2. 在守卫中添加调试日志
3. 检查请求头中的 session token
4. 检查数据库中的 session 表
5. 使用 Better Auth 的调试模式

## 参考资源

- [Better Auth 官方文档](https://www.better-auth.com)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [NestJS 官方文档](https://docs.nestjs.com)
- [NestJS 动态模块](https://docs.nestjs.com/modules/dynamic-modules)
- [NestJS 守卫](https://docs.nestjs.com/guards)
- [NestJS 装饰器](https://docs.nestjs.com/custom-decorators)
- [开发工作流程](../_templates/workflow.md)
