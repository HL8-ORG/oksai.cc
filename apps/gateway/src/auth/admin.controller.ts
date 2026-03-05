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

import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
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
@ApiTags("Admin 管理")
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
  @ApiOperation({ summary: "列出所有用户", description: "支持搜索、分页、排序" })
  @ApiQuery({ name: "searchValue", description: "搜索关键词", type: "string", required: false })
  @ApiQuery({ name: "limit", description: "每页数量", type: "number", required: false })
  @ApiQuery({ name: "offset", description: "偏移量", type: "number", required: false })
  @ApiResponse({ status: 200, description: "成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "获取用户详情", description: "获取指定用户的详细信息" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "成功" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "创建用户", description: "创建新用户" })
  @ApiResponse({ status: 201, description: "创建成功" })
  @ApiResponse({ status: 400, description: "参数错误" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "更新用户", description: "更新用户信息" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "删除用户", description: "删除用户（仅超级管理员）" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "删除成功" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
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
  @ApiOperation({ summary: "设置用户角色", description: "设置用户的角色权限" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "设置成功" })
  @ApiResponse({ status: 403, description: "无权限" })
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
  @ApiOperation({ summary: "检查权限", description: "检查用户是否拥有指定权限" })
  @ApiResponse({ status: 200, description: "检查成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "封禁用户", description: "封禁指定用户" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "封禁成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "解封用户", description: "解除用户的封禁状态" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "解封成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "列出用户会话", description: "获取用户的所有活动会话" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "撤销会话", description: "强制撤销用户会话" })
  @ApiParam({ name: "token", description: "会话 Token", type: "string" })
  @ApiResponse({ status: 200, description: "撤销成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "模拟用户", description: "管理员以其他用户身份登录" })
  @ApiParam({ name: "id", description: "用户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "模拟登录成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
  @ApiOperation({ summary: "停止模拟", description: "停止用户模拟，恢复管理员身份" })
  @ApiResponse({ status: 200, description: "停止模拟成功" })
  @ApiResponse({ status: 403, description: "需要管理员权限" })
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
