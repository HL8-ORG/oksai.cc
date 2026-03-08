/**
 * 租户管理控制器
 *
 * @description
 * 提供管理员使用的租户管理 API
 *
 * 所有接口需要超级管理员权限
 */

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Tenant } from "@oksai/iam-infrastructure";
import type { UserSession } from "@oksai/nestjs-better-auth";
import { Session } from "@oksai/nestjs-better-auth";
import {
  CreateTenantDto,
  ListTenantsDto,
  SuspendTenantDto,
  TenantActionResponse,
  TenantListResponse,
  TenantQuotaResponse,
  TenantResponse,
  TenantUsageDetailResponse,
  TenantUsageResponse,
  UpdateTenantDto,
} from "./dto/index.js";
import { TenantService } from "./tenant.service.js";

/**
 * 租户管理控制器
 *
 * @description
 * 提供完整的租户管理功能接口
 *
 * 所有接口需要超级管理员权限
 */
@ApiTags("租户管理")
@Controller("admin/tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ============================================
  // 租户 CRUD
  // ============================================

  /**
   * 创建租户
   *
   * @example
   * POST /api/admin/tenants
   * Body: {
   *   "name": "企业A",
   *   "slug": "enterprise-a",
   *   "plan": "PRO",
   *   "ownerId": "user-123",
   *   "maxOrganizations": 10,
   *   "maxMembers": 100
   * }
   */
  @ApiOperation({ summary: "创建租户", description: "创建新租户" })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({
    status: 201,
    description: "创建成功",
    type: TenantActionResponse,
  })
  @ApiResponse({ status: 400, description: "参数错误或 slug 已存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Session() session: UserSession, @Body() dto: CreateTenantDto): Promise<TenantActionResponse> {
    this.requireSuperAdminRole(session);

    const tenant = await this.tenantService.create({
      name: dto.name,
      slug: dto.slug,
      plan: dto.plan,
      ownerId: dto.ownerId,
      maxOrganizations: dto.maxOrganizations,
      maxMembers: dto.maxMembers,
      maxStorage: dto.maxStorage,
    });

    return {
      success: true,
      message: "租户创建成功",
      tenant: this.mapToResponse(tenant),
    };
  }

  /**
   * 列出所有租户
   *
   * @example
   * GET /api/admin/tenants?page=1&limit=20&status=active
   */
  @ApiOperation({
    summary: "列出所有租户",
    description: "支持搜索、分页、筛选",
  })
  @ApiQuery({
    name: "search",
    description: "搜索关键词",
    type: "string",
    required: false,
  })
  @ApiQuery({
    name: "status",
    description: "租户状态",
    enum: ["PENDING", "ACTIVE", "SUSPENDED", "DELETED"],
    required: false,
  })
  @ApiQuery({
    name: "plan",
    description: "租户套餐",
    enum: ["FREE", "STARTER", "PRO", "ENTERPRISE"],
    required: false,
  })
  @ApiQuery({
    name: "page",
    description: "页码",
    type: "number",
    required: false,
  })
  @ApiQuery({
    name: "limit",
    description: "每页数量",
    type: "number",
    required: false,
  })
  @ApiResponse({ status: 200, description: "成功", type: TenantListResponse })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Get()
  async list(@Session() session: UserSession, @Query() query: ListTenantsDto): Promise<TenantListResponse> {
    this.requireSuperAdminRole(session);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.tenantService.list(page, limit);

    // TODO: 根据 query.status 和 query.plan 进行过滤
    // TODO: 根据 query.search 进行搜索

    return {
      data: data.map((t) => this.mapToResponse(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * 获取租户详情
   *
   * @example
   * GET /api/admin/tenants/:id
   */
  @ApiOperation({
    summary: "获取租户详情",
    description: "获取指定租户的详细信息",
  })
  @ApiParam({ name: "id", description: "租户 ID", type: "string" })
  @ApiResponse({ status: 200, description: "成功", type: TenantResponse })
  @ApiResponse({ status: 404, description: "租户不存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Get(":id")
  async getOne(@Session() session: UserSession, @Param("id") id: string): Promise<TenantResponse> {
    this.requireSuperAdminRole(session);

    const tenant = await this.tenantService.getById(id);
    const usage = await this.tenantService.getUsage(id);

    return {
      ...this.mapToResponse(tenant),
      usage: {
        organizations: usage.organizations,
        members: usage.members,
        storage: usage.storage,
      },
    };
  }

  /**
   * 更新租户
   *
   * @example
   * PUT /api/admin/tenants/:id
   * Body: {
   *   "name": "企业A（更新）",
   *   "maxMembers": 200
   * }
   */
  @ApiOperation({ summary: "更新租户", description: "更新租户信息" })
  @ApiParam({ name: "id", description: "租户 ID", type: "string" })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: TenantActionResponse,
  })
  @ApiResponse({ status: 404, description: "租户不存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Put(":id")
  async update(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: UpdateTenantDto
  ): Promise<TenantActionResponse> {
    this.requireSuperAdminRole(session);

    const tenant = await this.tenantService.update(id, {
      name: dto.name,
      maxOrganizations: dto.maxOrganizations,
      maxMembers: dto.maxMembers,
      maxStorage: dto.maxStorage,
    });

    return {
      success: true,
      message: "租户更新成功",
      tenant: this.mapToResponse(tenant),
    };
  }

  // ============================================
  // 租户生命周期管理
  // ============================================

  /**
   * 激活租户
   *
   * @example
   * POST /api/admin/tenants/:id/activate
   */
  @ApiOperation({ summary: "激活租户", description: "激活待审核的租户" })
  @ApiParam({ name: "id", description: "租户 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "激活成功",
    type: TenantActionResponse,
  })
  @ApiResponse({ status: 400, description: "租户状态不允许激活" })
  @ApiResponse({ status: 404, description: "租户不存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Post(":id/activate")
  async activate(@Session() session: UserSession, @Param("id") id: string): Promise<TenantActionResponse> {
    this.requireSuperAdminRole(session);

    await this.tenantService.activate(id);

    const tenant = await this.tenantService.getById(id);

    return {
      success: true,
      message: "租户激活成功",
      tenant: this.mapToResponse(tenant),
    };
  }

  /**
   * 停用租户
   *
   * @example
   * POST /api/admin/tenants/:id/suspend
   * Body: { "reason": "违反服务条款" }
   */
  @ApiOperation({ summary: "停用租户", description: "停用租户" })
  @ApiParam({ name: "id", description: "租户 ID", type: "string" })
  @ApiBody({ type: SuspendTenantDto })
  @ApiResponse({
    status: 200,
    description: "停用成功",
    type: TenantActionResponse,
  })
  @ApiResponse({ status: 400, description: "租户状态不允许停用" })
  @ApiResponse({ status: 404, description: "租户不存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Post(":id/suspend")
  async suspend(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() dto: SuspendTenantDto
  ): Promise<TenantActionResponse> {
    this.requireSuperAdminRole(session);

    await this.tenantService.suspend(id, dto.reason);

    const tenant = await this.tenantService.getById(id);

    return {
      success: true,
      message: "租户停用成功",
      tenant: this.mapToResponse(tenant),
    };
  }

  // ============================================
  // 租户使用情况
  // ============================================

  /**
   * 获取租户使用情况
   *
   * @example
   * GET /api/admin/tenants/:id/usage
   */
  @ApiOperation({
    summary: "获取租户使用情况",
    description: "获取租户的配额和使用情况",
  })
  @ApiParam({ name: "id", description: "租户 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "成功",
    type: TenantUsageDetailResponse,
  })
  @ApiResponse({ status: 404, description: "租户不存在" })
  @ApiResponse({ status: 403, description: "需要超级管理员权限" })
  @Get(":id/usage")
  async getUsage(
    @Session() session: UserSession,
    @Param("id") id: string
  ): Promise<TenantUsageDetailResponse> {
    this.requireSuperAdminRole(session);

    const tenant = await this.tenantService.getById(id);
    const usage = await this.tenantService.getUsage(id);

    const quota: TenantQuotaResponse = {
      maxOrganizations: tenant.maxOrganizations,
      maxMembers: tenant.maxMembers,
      maxStorage: tenant.maxStorage,
    };

    const usageResponse: TenantUsageResponse = {
      organizations: usage.organizations,
      members: usage.members,
      storage: usage.storage,
    };

    return {
      quota,
      usage: usageResponse,
      available: {
        organizations: Math.max(0, quota.maxOrganizations - usageResponse.organizations),
        members: Math.max(0, quota.maxMembers - usageResponse.members),
        storage: Math.max(0, quota.maxStorage - usageResponse.storage),
      },
    };
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 检查是否是超级管理员
   */
  private requireSuperAdminRole(session: UserSession): void {
    if (session.user.role !== "superadmin") {
      throw new ForbiddenException("需要超级管理员权限");
    }
  }

  /**
   * 映射实体到响应
   */
  private mapToResponse(tenant: Tenant): TenantResponse {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      ownerId: tenant.ownerId ?? "",
      quota: {
        maxOrganizations: tenant.maxOrganizations,
        maxMembers: tenant.maxMembers,
        maxStorage: tenant.maxStorage,
      },
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
