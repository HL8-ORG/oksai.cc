/**
 * 组织管理控制器
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateOrganizationDto,
  InviteMemberDto,
  OrganizationListResponse,
  OrganizationResponse,
  UpdateMemberRoleDto,
  UpdateOrganizationDto,
} from "./dto";
import { OrganizationService } from "./organization.service";

/**
 * 组织管理控制器
 *
 * @description
 * 提供组织管理、成员管理接口
 *
 * 所有接口需要用户认证（通过 Bearer Token）
 */
@ApiTags("组织管理")
@ApiHeader({
  name: "authorization",
  description: "Bearer Token（用于认证）",
  required: true,
})
@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * 创建组织
   *
   * @description
   * 创建新组织，创建者自动成为 owner
   *
   * @example
   * POST /api/organizations
   * Header: Authorization: Bearer <token>
   * Body: { name: "My Organization", slug: "my-org", logo: "https://..." }
   * Response: { success: true, organization: { id, name, ... } }
   */
  @Post()
  @ApiOperation({ summary: "创建组织", description: "创建新组织，创建者自动成为 owner" })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: "创建成功",
    type: OrganizationResponse,
  })
  @ApiResponse({ status: 400, description: "参数错误" })
  @ApiResponse({ status: 401, description: "未认证" })
  async createOrganization(
    @Headers("authorization") _authorization: string,
    @Body() dto: CreateOrganizationDto
  ): Promise<OrganizationResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    const organization = await this.organizationService.createOrganization(userId, dto);

    return {
      success: true,
      message: "组织创建成功",
      organization: {
        id: organization.id,
        name: organization.name,
        slug: (organization as any).slug,
        logo: (organization as any).logo,
        createdAt: organization.createdAt,
      },
    };
  }

  /**
   * 获取组织详情
   *
   * @description
   * 获取指定组织的详细信息
   *
   * @example
   * GET /api/organizations/:id
   * Header: Authorization: Bearer <token>
   * Response: { success: true, organization: { id, name, ... } }
   */
  @Get(":id")
  @ApiOperation({ summary: "获取组织详情", description: "获取指定组织的详细信息" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "成功",
    type: OrganizationResponse,
  })
  @ApiResponse({ status: 404, description: "组织不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async getOrganization(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string
  ): Promise<OrganizationResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    const organization = await this.organizationService.getOrganization(organizationId, userId);

    return {
      success: true,
      message: "获取组织成功",
      organization: {
        id: organization.id,
        name: organization.name,
        slug: (organization as any).slug,
        logo: (organization as any).logo,
        createdAt: organization.createdAt,
      },
    };
  }

  /**
   * 获取用户的所有组织
   *
   * @description
   * 获取当前用户所属的所有组织
   *
   * @example
   * GET /api/organizations
   * Header: Authorization: Bearer <token>
   * Response: { success: true, organizations: [...] }
   */
  @Get()
  @ApiOperation({ summary: "获取组织列表", description: "获取当前用户所属的所有组织" })
  @ApiResponse({
    status: 200,
    description: "成功",
    type: OrganizationListResponse,
  })
  @ApiResponse({ status: 401, description: "未认证" })
  async listOrganizations(
    @Headers("authorization") _authorization: string
  ): Promise<OrganizationListResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    const organizations = await this.organizationService.listOrganizations(userId);

    return {
      success: true,
      message: "获取组织列表成功",
      organizations: organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        createdAt: org.createdAt,
        memberId: org.memberId,
        role: org.role,
      })),
    };
  }

  /**
   * 更新组织
   *
   * @description
   * 更新组织信息（需要 owner 权限）
   *
   * @example
   * PUT /api/organizations/:id
   * Header: Authorization: Bearer <token>
   * Body: { name: "New Name" }
   * Response: { success: true, organization: { id, name, ... } }
   */
  @Put(":id")
  @ApiOperation({ summary: "更新组织", description: "更新组织信息（需要 owner 权限）" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: OrganizationResponse,
  })
  @ApiResponse({ status: 404, description: "组织不存在" })
  @ApiResponse({ status: 403, description: "无权限（需要 owner）" })
  @ApiResponse({ status: 401, description: "未认证" })
  async updateOrganization(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string,
    @Body() dto: UpdateOrganizationDto
  ): Promise<OrganizationResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    const organization = await this.organizationService.updateOrganization(organizationId, userId, dto);

    return {
      success: true,
      message: "组织更新成功",
      organization: {
        id: organization.id,
        name: organization.name,
        slug: (organization as any).slug,
        logo: (organization as any).logo,
        createdAt: organization.createdAt,
      },
    };
  }

  /**
   * 删除组织
   *
   * @description
   * 删除组织（需要 owner 权限）
   *
   * @example
   * DELETE /api/organizations/:id
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "组织已删除" }
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "删除组织", description: "删除组织（需要 owner 权限）" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "删除成功",
    schema: { example: { success: true, message: "组织已删除" } },
  })
  @ApiResponse({ status: 404, description: "组织不存在" })
  @ApiResponse({ status: 403, description: "无权限（需要 owner）" })
  @ApiResponse({ status: 401, description: "未认证" })
  async deleteOrganization(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.organizationService.deleteOrganization(organizationId, userId);

    return {
      success: true,
      message: "组织已删除",
    };
  }

  /**
   * 邀请成员
   *
   * @description
   * 邀请新成员加入组织（需要 owner 或 admin 权限）
   *
   * @example
   * POST /api/organizations/:id/invite
   * Header: Authorization: Bearer <token>
   * Body: { email: "user@example.com", role: "member" }
   * Response: { success: true, message: "邀请已发送" }
   */
  @Post(":id/invite")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "邀请成员", description: "邀请新成员加入组织（需要 owner 或 admin 权限）" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({
    status: 200,
    description: "邀请成功",
    schema: { example: { success: true, message: "邀请已发送" } },
  })
  @ApiResponse({ status: 404, description: "组织不存在" })
  @ApiResponse({ status: 403, description: "无权限（需要 owner 或 admin）" })
  @ApiResponse({ status: 401, description: "未认证" })
  async inviteMember(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string,
    @Body() dto: InviteMemberDto
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.organizationService.inviteMember(organizationId, userId, dto.email, dto.role);

    return {
      success: true,
      message: "邀请已发送",
    };
  }

  /**
   * 获取组织成员列表
   *
   * @description
   * 获取指定组织的所有成员
   *
   * @example
   * GET /api/organizations/:id/members
   * Header: Authorization: Bearer <token>
   * Response: { success: true, members: [...] }
   */
  @Get(":id/members")
  @ApiOperation({ summary: "获取成员列表", description: "获取指定组织的所有成员" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: {
      example: {
        success: true,
        message: "获取成员列表成功",
        members: [
          {
            id: "xxx",
            userId: "xxx",
            organizationId: "xxx",
            role: "owner",
            createdAt: "2026-03-06T05:30:00Z",
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: "组织不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async listMembers(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string
  ): Promise<{ success: boolean; message: string; members: any[] }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    const members = await this.organizationService.listMembers(organizationId, userId);

    return {
      success: true,
      message: "获取成员列表成功",
      members,
    };
  }

  /**
   * 移除成员
   *
   * @description
   * 从组织中移除成员（需要 owner 或 admin 权限）
   *
   * @example
   * DELETE /api/organizations/:id/members/:memberId
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "成员已移除" }
   */
  @Delete(":id/members/:memberId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "移除成员", description: "从组织中移除成员（需要 owner 或 admin 权限）" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiParam({ name: "memberId", description: "成员 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "移除成功",
    schema: { example: { success: true, message: "成员已移除" } },
  })
  @ApiResponse({ status: 404, description: "组织或成员不存在" })
  @ApiResponse({ status: 403, description: "无权限（需要 owner 或 admin）" })
  @ApiResponse({ status: 401, description: "未认证" })
  async removeMember(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string,
    @Param("memberId") memberId: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.organizationService.removeMember(organizationId, memberId, userId);

    return {
      success: true,
      message: "成员已移除",
    };
  }

  /**
   * 更新成员角色
   *
   * @description
   * 更新成员在组织中的角色（需要 owner 权限）
   *
   * @example
   * PUT /api/organizations/:id/members/:memberId/role
   * Header: Authorization: Bearer <token>
   * Body: { role: "admin" }
   * Response: { success: true, message: "角色已更新" }
   */
  @Put(":id/members/:memberId/role")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "更新成员角色", description: "更新成员在组织中的角色（需要 owner 权限）" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiParam({ name: "memberId", description: "成员 ID", type: "string" })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    schema: { example: { success: true, message: "角色已更新" } },
  })
  @ApiResponse({ status: 404, description: "组织或成员不存在" })
  @ApiResponse({ status: 403, description: "无权限（需要 owner）" })
  @ApiResponse({ status: 401, description: "未认证" })
  async updateMemberRole(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberRoleDto
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.organizationService.updateMemberRole(organizationId, memberId, dto.role, userId);

    return {
      success: true,
      message: "角色已更新",
    };
  }

  /**
   * 设置当前活动组织
   *
   * @description
   * 设置用户当前活动的组织（用于多租户场景）
   *
   * @example
   * POST /api/organizations/:id/set-active
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "活动组织已设置" }
   */
  @Post(":id/set-active")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "设置活动组织", description: "设置用户当前活动的组织（用于多租户场景）" })
  @ApiParam({ name: "id", description: "组织 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "设置成功",
    schema: { example: { success: true, message: "活动组织已设置" } },
  })
  @ApiResponse({ status: 404, description: "组织不存在" })
  @ApiResponse({ status: 401, description: "未认证" })
  async setActiveOrganization(
    @Headers("authorization") _authorization: string,
    @Param("id") organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.organizationService.setActiveOrganization(organizationId, userId);

    return {
      success: true,
      message: "活动组织已设置",
    };
  }
}
