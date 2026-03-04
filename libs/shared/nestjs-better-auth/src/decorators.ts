import type { CustomDecorator, ExecutionContext } from "@nestjs/common";
import { createParamDecorator, SetMetadata } from "@nestjs/common";
import type { createAuthMiddleware } from "better-auth/api";
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from "./symbols";
import { getRequestFromContext } from "./utils";

/**
 * Allows unauthenticated (anonymous) access to a route or controller.
 * When applied, the AuthGuard will not perform authentication checks.
 */
export const AllowAnonymous = (): CustomDecorator<string> => SetMetadata("PUBLIC", true);

/**
 * Marks a route or controller as having optional authentication.
 * When applied, the AuthGuard allows the request to proceed
 * even if no session is present.
 */
export const OptionalAuth = (): CustomDecorator<string> => SetMetadata("OPTIONAL", true);

/**
 * Specifies the user-level roles required to access a route or controller.
 * Checks ONLY the `user.role` field (from Better Auth's admin plugin).
 * Does NOT check organization member roles.
 *
 * Use this for system-wide admin protection (e.g., superadmin routes).
 *
 * @param roles - The roles required for access
 * @example
 * ```ts
 * @Roles(['admin'])  // Only users with user.role = 'admin' can access
 * ```
 */
export const Roles = (roles: string[]): CustomDecorator => SetMetadata("ROLES", roles);

/**
 * Specifies the organization-level roles required to access a route or controller.
 * Checks ONLY the organization member role (from Better Auth's organization plugin).
 * Requires an active organization (`activeOrganizationId` in session).
 *
 * Use this for organization-scoped protection (e.g., org admin routes).
 *
 * @param roles - The organization roles required for access
 * @example
 * ```ts
 * @OrgRoles(['owner', 'admin'])  // Only org owners/admins can access
 * ```
 */
export const OrgRoles = (roles: string[]): CustomDecorator => SetMetadata("ORG_ROLES", roles);

/**
 * @deprecated Use AllowAnonymous() instead.
 */
export const Public = AllowAnonymous;

/**
 * @deprecated Use OptionalAuth() instead.
 */
export const Optional = OptionalAuth;

/**
 * Parameter decorator that extracts the user session from the request.
 * Provides easy access to the authenticated user's session data in controller methods.
 * Works with both HTTP and GraphQL execution contexts.
 */
export const Session: ReturnType<typeof createParamDecorator> = createParamDecorator(
  (_data: unknown, context: ExecutionContext): unknown => {
    const request = getRequestFromContext(context);
    return request.session;
  }
);

// ============================================================================
// 组合装饰器（便捷方法）
// ============================================================================

/**
 * 限制只有系统管理员才能访问的路由。
 * 等同于 @Roles(['admin'])
 *
 * 用于系统级管理功能（如用户管理、系统配置等）。
 *
 * @example
 * ```ts
 * @AdminOnly()
 * @Get('admin/users')
 * getUsers() {
 *   // 只有 admin 角色可以访问
 * }
 * ```
 */
export const AdminOnly = (): CustomDecorator => Roles(["admin"]);

/**
 * 限制只有超级管理员才能访问的路由。
 * 等同于 @Roles(['superadmin'])
 *
 * 用于最高权限的功能（如系统设置、权限分配等）。
 *
 * @example
 * ```ts
 * @SuperAdminOnly()
 * @Delete('admin/dangerous')
 * dangerousAction() {
 *   // 只有 superadmin 角色可以访问
 * }
 * ```
 */
export const SuperAdminOnly = (): CustomDecorator => Roles(["superadmin"]);

/**
 * 限制只有组织所有者才能访问的路由。
 * 等同于 @OrgRoles(['owner'])
 *
 * 用于组织级管理功能（如删除组织、转让所有权等）。
 *
 * @example
 * ```ts
 * @OwnerOnly()
 * @Delete('organization')
 * deleteOrganization() {
 *   // 只有组织 owner 可以访问
 * }
 * ```
 */
export const OwnerOnly = (): CustomDecorator => OrgRoles(["owner"]);

/**
 * 限制只有组织管理员及以上才能访问的路由。
 * 等同于 @OrgRoles(['owner', 'admin'])
 *
 * 用于组织级管理功能（如成员管理、组织设置等）。
 *
 * @example
 * ```ts
 * @OrgAdminOnly()
 * @Post('organization/members')
 * addMember() {
 *   // 只有组织 owner 或 admin 可以访问
 * }
 * ```
 */
export const OrgAdminOnly = (): CustomDecorator => OrgRoles(["owner", "admin"]);

/**
 * 限制只有组织成员及以上才能访问的路由。
 * 等同于 @OrgRoles(['owner', 'admin', 'member'])
 *
 * 用于组织内部功能（如查看组织信息、访问组织资源等）。
 *
 * @example
 * ```ts
 * @MemberOnly()
 * @Get('organization/resources')
 * getResources() {
 *   // 所有组织成员都可以访问
 * }
 * ```
 */
export const MemberOnly = (): CustomDecorator => OrgRoles(["owner", "admin", "member"]);

// ============================================================================
// 钩子装饰器
// ============================================================================

/**
 * Represents the context object passed to hooks.
 * This type is derived from the parameters of the createAuthMiddleware function.
 */
export type AuthHookContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

/**
 * Registers a method to be executed before a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const BeforeHook = (path?: `/${string}`): CustomDecorator<symbol> =>
  SetMetadata(BEFORE_HOOK_KEY, path);

/**
 * Registers a method to be executed after a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const AfterHook = (path?: `/${string}`): CustomDecorator<symbol> => SetMetadata(AFTER_HOOK_KEY, path);

/**
 * Class decorator that marks a provider as containing hook methods.
 * Must be applied to classes that use BeforeHook or AfterHook decorators.
 */
export const Hook = (): ClassDecorator => SetMetadata(HOOK_KEY, true);
