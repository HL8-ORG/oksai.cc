/**
 * Admin 管理控制器
 *
 * @description
 * 使用 Better Auth Admin 插件提供用户管理、角色权限、会话管理、用户模拟等功能
 *
 * 支持的特性：
 * - 用户管理（创建/列出/获取/更新/删除）
 * - 角色与权限（设置角色/检查权限）
 * - 用户状态管理（封禁/解封）
 * - 会话管理（列出/撤销）
 * - 用户模拟（模拟登录/停止模拟）
 */

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import type { UserSession } from "@oksai/nestjs-better-auth";
import { Session } from "@oksai/nestjs-better-auth";
import type {
  AdminImpersonateResponse,
  AdminSessionListResponse,
  AdminUserListResponse,
  AdminUserResponse,
  BanUserDto,
  CheckPermissionDto,
  CheckPermissionResponse,
  CreateAdminUserDto,
  ListUsersDto,
  RevokeSessionResponse,
  SetUserRoleDto,
  StopImpersonatingResponse,
  UnbanUserResponse,
  UpdateAdminUserDto,
} from "./admin.dto";
import { auth } from "./auth";
import { hasPermission } from "./user-role.enum";

/**
 * Admin 管理控制器
 *
 * @description
 * 提供完整的管理功能接口
 *
 * 所有接口需要管理员权限（admin 或 superadmin 角色）
 *
 * @see https://better-auth.com/docs/plugins/admin
 */
@Controller("admin")
export class AdminController {
  // ============================================
  // 用户管理
  // ============================================

  /**
   * 列出所有用户
   *
   * @description
   * 支持搜索、分页、排序
   *
   * @example
   * GET /api/admin/users?searchValue=john&limit=10&offset=0
   * Response: {
   *   "users": [...],
   *   "total": 100,
   *   "limit": 10,
   *   "offset": 0
   * }
   */
  @Get("users")
  async listUsers(
    @Session() session: UserSession,
    @Query() query: ListUsersDto
  ): Promise<AdminUserListResponse> {
    // 检查权限
    this.requireAdminRole(session);

    // 使用 Better Auth API 列出用户
    const result = await (auth.api as any).listUsers({
      query: {
        searchValue: query.searchValue,
        searchField: query.searchField || "email",
        searchOperator: query.searchOperator || "contains",
        limit: query.limit || 100,
        offset: query.offset || 0,
        sortBy: query.sortBy || "createdAt",
        sortDirection: query.sortDirection || "desc",
      },
      headers: this.getHeaders(session),
    });

    return {
      users: result.users || [],
      total: result.total || 0,
      limit: query.limit || 100,
      offset: query.offset || 0,
    };
  }

  /**
   * 获取用户详情
   *
   * @example
   * GET /api/admin/users/:id
   * Response: {
   *   "id": "xxx",
   *   "email": "user@example.com",
   *   "role": "user",
   *   ...
   * }
   */
  @Get("users/:id")
  async getUser(@Session() session: UserSession, @Param("id") userId: string): Promise<AdminUserResponse> {
    this.requireAdminRole(session);

    const result = await (auth.api as any).getUser({
      query: { userId },
      headers: this.getHeaders(session),
    });

    if (!result) {
      throw new NotFoundException("用户不存在");
    }

    return result;
  }

  /**
   * 创建用户
   *
   * @example
   * POST /api/admin/users
   * Body: {
   *   "email": "new@example.com",
   *   "password": "SecurePass123",
   *   "name": "New User",
   *   "role": "user"
   * }
   */
  @Post("users")
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Session() session: UserSession,
    @Body() dto: CreateAdminUserDto
  ): Promise<AdminUserResponse> {
    this.requireAdminRole(session);

    const result = await (auth.api as any).createUser({
      body: {
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role || "user",
        emailVerified: dto.emailVerified || false,
      },
      headers: this.getHeaders(session),
    });

    return result;
  }

  /**
   * 更新用户
   *
   * @example
   * PUT /api/admin/users/:id
   * Body: {
   *   "name": "Updated Name",
   *   "role": "admin"
   * }
   */
  @Put("users/:id")
  async updateUser(
    @Session() session: UserSession,
    @Param("id") userId: string,
    @Body() dto: UpdateAdminUserDto
  ): Promise<AdminUserResponse> {
    this.requireAdminRole(session);

    const result = await (auth.api as any).updateUser({
      body: {
        userId,
        ...dto,
      },
      headers: this.getHeaders(session),
    });

    return result;
  }

  /**
   * 删除用户
   *
   * @description
   * 只有 superadmin 可以删除用户
   *
   * @example
   * DELETE /api/admin/users/:id
   * Response: { "success": true }
   */
  @Delete("users/:id")
  async deleteUser(
    @Session() session: UserSession,
    @Param("id") userId: string
  ): Promise<{ success: boolean }> {
    this.requireSuperAdminRole(session);

    await (auth.api as any).removeUser({
      body: { userId },
      headers: this.getHeaders(session),
    });

    return { success: true };
  }

  // ============================================
  // 角色与权限
  // ============================================

  /**
   * 设置用户角色
   *
   * @example
   * POST /api/admin/users/:id/role
   * Body: { "role": "admin" }
   * Response: { "success": true }
   */
  @Post("users/:id/role")
  async setUserRole(
    @Session() session: UserSession,
    @Param("id") userId: string,
    @Body() dto: SetUserRoleDto
  ): Promise<{ success: boolean }> {
    this.requireAdminRole(session);

    // 检查权限：只有 superadmin 可以设置 superadmin 角色
    if (dto.role === "superadmin" && session.user.role !== "superadmin") {
      throw new ForbiddenException("只有超级管理员可以设置超级管理员角色");
    }

    await (auth.api as any).setRole({
      body: {
        userId,
        role: dto.role,
      },
      headers: this.getHeaders(session),
    });

    return { success: true };
  }

  /**
   * 检查权限
   *
   * @example
   * POST /api/admin/check-permission
   * Body: {
   *   "userId": "xxx",
   *   "permissions": { "user": ["create", "list"] }
   * }
   * Response: {
   *   "hasPermission": true,
   *   "userId": "xxx",
   *   "permissions": { "user": ["create", "list"] }
   * }
   */
  @Post("check-permission")
  async checkPermission(
    @Session() session: UserSession,
    @Body() dto: CheckPermissionDto
  ): Promise<CheckPermissionResponse> {
    this.requireAdminRole(session);

    const result = await (auth.api as any).userHasPermission({
      body: {
        userId: dto.userId,
        permissions: dto.permissions,
      },
      headers: this.getHeaders(session),
    });

    return {
      hasPermission: result,
      userId: dto.userId,
      permissions: dto.permissions,
    };
  }

  // ============================================
  // 用户状态管理（封禁）
  // ============================================

  /**
   * 封禁用户
   *
   * @example
   * POST /api/admin/users/:id/ban
   * Body: {
   *   "banReason": "违反服务条款",
   *   "banExpiresIn": 86400  // 1 天（秒）
   * }
   * Response: { "success": true }
   */
  @Post("users/:id/ban")
  async banUser(
    @Session() session: UserSession,
    @Param("id") userId: string,
    @Body() dto: BanUserDto
  ): Promise<{ success: boolean }> {
    this.requireAdminRole(session);

    await (auth.api as any).banUser({
      body: {
        userId,
        banReason: dto.banReason || "违反服务条款",
        banExpiresIn: dto.banExpiresIn,
      },
      headers: this.getHeaders(session),
    });

    return { success: true };
  }

  /**
   * 解封用户
   *
   * @example
   * POST /api/admin/users/:id/unban
   * Response: {
   *   "success": true,
   *   "message": "用户已解封",
   *   "userId": "xxx"
   * }
   */
  @Post("users/:id/unban")
  async unbanUser(@Session() session: UserSession, @Param("id") userId: string): Promise<UnbanUserResponse> {
    this.requireAdminRole(session);

    await (auth.api as any).unbanUser({
      body: { userId },
      headers: this.getHeaders(session),
    });

    return {
      success: true,
      message: "用户已解封",
      userId,
    };
  }

  // ============================================
  // 会话管理
  // ============================================

  /**
   * 列出用户会话
   *
   * @example
   * GET /api/admin/users/:id/sessions
   * Response: {
   *   "sessions": [...],
   *   "total": 3
   * }
   */
  @Get("users/:id/sessions")
  async listUserSessions(
    @Session() session: UserSession,
    @Param("id") userId: string
  ): Promise<AdminSessionListResponse> {
    this.requireAdminRole(session);

    const result = await (auth.api as any).listUserSessions({
      body: { userId },
      headers: this.getHeaders(session),
    });

    return {
      sessions: result || [],
      total: result?.length || 0,
    };
  }

  /**
   * 撤销会话
   *
   * @example
   * POST /api/admin/sessions/:token/revoke
   * Response: {
   *   "success": true,
   *   "message": "会话已撤销",
   *   "sessionToken": "xxx"
   * }
   */
  @Post("sessions/:token/revoke")
  async revokeUserSession(
    @Session() session: UserSession,
    @Param("token") sessionToken: string
  ): Promise<RevokeSessionResponse> {
    this.requireAdminRole(session);

    await (auth.api as any).revokeUserSession({
      body: { sessionToken },
      headers: this.getHeaders(session),
    });

    return {
      success: true,
      message: "会话已撤销",
      sessionToken,
    };
  }

  // ============================================
  // 用户模拟
  // ============================================

  /**
   * 模拟用户
   *
   * @description
   * 允许管理员以其他用户身份登录，用于技术支持和调试
   *
   * 安全措施：
   * - 只有 admin 和 superadmin 可以模拟用户
   * - 禁止模拟其他管理员（可配置）
   * - 自动记录审计日志
   *
   * @example
   * POST /api/admin/impersonate/:id
   * Response: {
   *   "success": true,
   *   "message": "模拟登录成功",
   *   "session": { "id": "xxx", "token": "xxx", "expiresAt": "..." },
   *   "impersonatedUser": { "id": "xxx", "email": "user@example.com", ... }
   * }
   */
  @Post("impersonate/:id")
  async impersonateUser(
    @Session() session: UserSession,
    @Param("id") userId: string
  ): Promise<AdminImpersonateResponse> {
    this.requireAdminRole(session);

    const result = await (auth.api as any).impersonateUser({
      body: { userId },
      headers: this.getHeaders(session),
    });

    return {
      success: true,
      message: "模拟登录成功",
      session: result.session,
      impersonatedUser: result.user,
    };
  }

  /**
   * 停止模拟
   *
   * @example
   * POST /api/admin/stop-impersonating
   * Response: {
   *   "success": true,
   *   "message": "已停止模拟"
   * }
   */
  @Post("stop-impersonating")
  async stopImpersonating(@Session() session: UserSession): Promise<StopImpersonatingResponse> {
    await (auth.api as any).stopImpersonating({
      headers: this.getHeaders(session),
    });

    return {
      success: true,
      message: "已停止模拟",
    };
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 检查是否是管理员
   */
  private requireAdminRole(session: UserSession): void {
    if (!hasPermission(session.user.role as any, "user:list")) {
      throw new ForbiddenException("需要管理员权限");
    }
  }

  /**
   * 检查是否是超级管理员
   */
  private requireSuperAdminRole(session: UserSession): void {
    if (session.user.role !== "superadmin") {
      throw new ForbiddenException("需要超级管理员权限");
    }
  }

  /**
   * 获取请求头（用于 Better Auth API）
   */
  private getHeaders(session: UserSession) {
    return {
      authorization: `Bearer ${session.session.token}`,
    };
  }
}
