# NestJS Better Auth 集成提示词

## 同步实现状态

审查 `nestjs-better-auth` 已实现内容，并更新 `specs/nestjs-better-auth/implementation.md`。

**检查要点：**
- 模块配置功能
- 装饰器系统完整性
- 多执行上下文支持
- 测试覆盖率和通过率

---

## 开始开发新功能

按照工作流程开发 `nestjs-better-auth`：

1. **用户故事**：在 `specs/nestjs-better-auth/design.md` 中定义用户故事（使用 INVEST 原则）
2. **BDD 场景**：在 `features/nestjs-better-auth.feature` 中编写验收场景
3. **TDD 循环**：
   - 🔴 Red: 编写失败的单元测试
   - 🟢 Green: 用最简代码让测试通过
   - 🔵 Refactor: 优化代码结构
4. **代码实现**：按照 NestJS 最佳实践实现

详见 `specs/_templates/workflow.md`。

---

## 生成测试

为 `nestjs-better-auth` 的 `{component}` 编写测试，遵循现有测试模式（使用 Vitest）。

**测试模式：**
```bash
# 单元测试
pnpm vitest run libs/auth/nestjs-better-auth/src/**/*.spec.ts

# 集成测试
pnpm vitest run libs/auth/nestjs-better-auth/test/**/*.spec.ts

# 所有测试
pnpm vitest run libs/auth/nestjs-better-auth/
```

**测试覆盖：**
- 正常流程（Happy Path）
- 异常流程（Error Cases）
- 边界条件（Edge Cases）
- 多执行上下文（HTTP、GraphQL、WebSocket、RPC）

---

## 代码审查

从以下角度审查 `nestjs-better-auth` 改动：

1. **与 Better Auth 兼容性**：是否与 Better Auth 插件兼容
2. **可选依赖处理**：是否正确懒加载可选依赖
3. **错误处理**：边界情况和错误处理是否完善
4. **TSDoc 注释**：公共 API 是否有完整注释

**审查清单：**
- [ ] 是否破坏与 Better Auth 插件的兼容性
- [ ] 可选依赖是否懒加载
- [ ] 错误信息是否清晰
- [ ] 是否有足够的测试
- [ ] TSDoc 注释是否完整

---

## 继续开发功能

继续处理 `nestjs-better-auth`。请先阅读 `specs/nestjs-better-auth/implementation.md` 了解当前状态。

**当前状态：** Phase 1 已完成 ✅，Phase 2 可选增强

**下一步任务：**
- 提升测试覆盖率到 80%+
- 添加 E2E 测试示例项目
- Fastify 适配器支持
- 缓存组织角色查询结果

---

## 生成 BDD 场景

为 `nestjs-better-auth` 编写 BDD 场景：

1. 分析 `specs/nestjs-better-auth/design.md` 中的用户故事
2. 识别正常流程（Happy Path）
3. 识别异常流程（Error Cases）
4. 识别边界条件（Edge Cases）
5. 编写 `features/nestjs-better-auth.feature` 文件

**场景示例：**
```gherkin
Feature: NestJS Better Auth 集成

  Scenario: 开发者配置并使用 AuthModule
    Given NestJS 应用需要集成 Better Auth
    When 开发者使用 AuthModule.forRoot({ auth }) 配置模块
    Then 模块成功注册并启用全局认证守卫
    And 所有路由默认需要认证
```

---

## TDD 开发

使用 TDD 方式开发 `nestjs-better-auth` 组件：

1. 🔴 **Red**: 先编写失败的单元测试
2. 🟢 **Green**: 用最简单的方式让测试通过
3. 🔵 **Refactor**: 优化代码，保持测试通过

**示例：**
```typescript
// 🔴 Red
describe('AuthGuard', () => {
  describe('canActivate', () => {
    it('should allow access with valid session', () => {
      const context = createMockExecutionContext({ session: mockSession });
      const guard = new AuthGuard(authService);
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(true);
    });
  });
});

// 🟢 Green
canActivate(context: ExecutionContext): boolean {
  const request = this.getRequestFromContext(context);
  if (request.session) {
    return true;
  }
  throw new UnauthorizedException();
}

// 🔵 Refactor
// 优化：提取 getRequestFromContext，添加装饰器检查
```

---

## 添加新装饰器

为 `nestjs-better-auth` 添加新的装饰器：

**实现步骤：**
1. 在 `decorators.ts` 中定义装饰器
2. 在 `symbols.ts` 中定义元数据 Symbol
3. 在 `auth-guard.ts` 中添加装饰器检查逻辑
4. 编写单元测试（至少 3 个测试：正常、异常、边界）
5. 添加使用示例
6. 更新 README.md

**示例：**
```typescript
// 装饰器定义
export function AdminOnly(): MethodDecorator {
  return SetMetadata(ROLES_KEY, ['admin']);
}

// 守卫检查
const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
if (requiredRoles && !requiredRoles.includes(user.role)) {
  throw new ForbiddenException('Insufficient permissions');
}
```

---

## 添加新的执行上下文支持

为 `nestjs-better-auth` 添加新的执行上下文支持（如 gRPC）：

**实现步骤：**
1. 在 `utils.ts` 的 `getRequestFromContext()` 中添加新上下文类型
2. 使用懒加载处理可选依赖
3. 在 `auth-guard.ts` 中添加上下文适配逻辑
4. 编写单元测试（Mock 可选依赖）
5. 添加集成测试
6. 编写使用示例
7. 更新 README.md

**示例：**
```typescript
// utils.ts
if (context.getType() === 'rpc') {
  const grpcContext = context.switchToRpc();
  const metadata = grpcContext.getContext();
  return metadata.get('request') as Request;
}

// 测试
it('should extract request from RPC context', () => {
  const mockRequest = { session: mockSession };
  const context = createMockRpcContext({ request: mockRequest });
  
  const request = getRequestFromContext(context);
  
  expect(request).toBe(mockRequest);
});
```

---

## 实现 Fastify 适配器支持

为 `nestjs-better-auth` 添加 Fastify 适配器支持：

**实现步骤：**
1. 检查当前代码是否依赖 Express 特定 API
2. 创建 Fastify 适配器抽象层
3. 修改中间件以支持 Fastify
4. 更新 AuthModule 配置选项
5. 编写 Fastify 集成测试
6. 添加 Fastify 使用示例
7. 更新 README.md

**注意事项：**
- Fastify 的 request/response 对象与 Express 不同
- 中间件签名不同
- 错误处理方式不同

---

## 生成带截图的文档

为 `nestjs-better-auth` 生成带截图的文档：

1. 创建使用示例项目
2. 对关键功能截图：
   - 模块配置示例
   - 装饰器使用效果
   - 认证流程图
   - 错误处理示例
3. 将截图保存到 `specs/nestjs-better-auth/docs/screenshots/`
4. 创建/更新 `specs/nestjs-better-auth/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

---

## 提升文档为公开版本

将内部文档提升为公开的 NPM 包文档：

1. 审阅 `libs/auth/nestjs-better-auth/README.md`
2. 确保包含：
   - 安装指南
   - 快速开始
   - API 文档
   - 使用示例
   - 常见问题
3. 添加 Badge（npm version、downloads、license）
4. 确保文案适合开源社区阅读

---

## 验证工作流程完成度

检查 `nestjs-better-auth` 是否完成所有开发步骤：

- [x] 用户故事已定义（符合 INVEST 原则）
- [x] BDD 场景已编写
- [x] TDD 循环已完成（Red-Green-Refactor）
- [x] 单元测试覆盖率 67.5%（目标 80%+）
- [x] 集成测试已编写
- [x] 代码已 Review
- [ ] 文档已生成（待补充截图）

---

## 性能优化

优化 `nestjs-better-auth` 性能：

**优化要点：**
1. 组织角色查询缓存：使用 LRU Cache 缓存组织角色
2. 元数据读取优化：缓存 Reflector 结果
3. 会话提取优化：避免重复的 session 查询
4. 懒加载优化：仅在首次使用时加载可选依赖

**示例：**
```typescript
// 缓存组织角色
private orgRolesCache = new LRUCache<string, string[]>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 分钟
});

private async getOrgRoles(userId: string, orgId: string): Promise<string[]> {
  const cacheKey = `${userId}:${orgId}`;
  const cached = this.orgRolesCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const roles = await this.fetchOrgRoles(userId, orgId);
  this.orgRolesCache.set(cacheKey, roles);
  return roles;
}
```

---

## 故障排除

`nestjs-better-auth` 常见问题排查：

### 问题 1：GraphQL 上下文认证失败

**排查步骤：**
1. 检查是否安装了 `@nestjs/graphql`
2. 检查 GraphQL 模块配置
3. 确认请求头中包含正确的 session token
4. 查看守卫日志（设置 `logger.debug`）

### 问题 2：组织角色检查失败

**排查步骤：**
1. 确认 Better Auth organization 插件已启用
2. 检查用户是否已加入组织
3. 确认组织 ID 正确传递
4. 查看数据库中的组织成员关系

### 问题 3：装饰器不生效

**排查步骤：**
1. 确认装饰器导入正确
2. 检查装饰器顺序（类装饰器 → 方法装饰器）
3. 确认 AuthModule 已正确配置
4. 检查全局守卫是否启用

---

**文档版本：** 2.0.0  
**最后更新：** 2026年3月3日
