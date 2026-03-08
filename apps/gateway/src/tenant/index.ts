/**
 * 多租户模块
 *
 * 提供租户识别、过滤和权限检查功能。
 *
 * @example
 * ```typescript
 * // 在 app.module.ts 中注册中间件
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(TenantMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 *
 * // 在 controller 中使用守卫
 * @Controller('users')
 * @UseGuards(TenantGuard)
 * export class UserController {
 *   // ...
 * }
 *
 * // 跳过租户守卫（超级管理员）
 * @Controller('admin')
 * @SkipTenantGuard()
 * export class AdminController {
 *   // ...
 * }
 * ```
 */

export { SkipTenantGuard, TenantGuard, TenantResourceGuard } from "./tenant.guard.js";
export { TenantMiddleware } from "./tenant.middleware.js";
