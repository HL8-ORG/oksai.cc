/**
 * OAuth Client 管理 Controller
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateOAuthClientDto,
  OAuthClientCreatedResponse,
  OAuthClientListResponse,
  OAuthClientResponse,
  RotateClientSecretResponse,
  UpdateOAuthClientDto,
} from "./dto/index.js";
import { OAuthService } from "./oauth.service.js";

/**
 * OAuth Client 管理 Controller
 *
 * @description
 * 提供 OAuth 客户端管理 API 端点
 *
 * 端点列表：
 * - POST /oauth/clients - 创建 OAuth 客户端
 * - GET /oauth/clients - 获取客户端列表
 * - GET /oauth/clients/:id - 获取客户端详情
 * - PUT /oauth/clients/:id - 更新客户端
 * - DELETE /oauth/clients/:id - 删除客户端
 * - POST /oauth/clients/:id/rotate-secret - 轮换客户端密钥
 */
@ApiTags("OAuth Client 管理")
@Controller("oauth/clients")
export class OAuthClientController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * 创建 OAuth 客户端
   *
   * @description
   * 注册新的 OAuth 客户端应用
   *
   * @example
   * POST /api/oauth/clients
   * Body: { name: "My App", redirectUris: ["http://localhost:3000/callback"], allowedScopes: ["read", "write"] }
   * Response: { id: "...", clientId: "...", clientSecret: "...", ... }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建 OAuth 客户端", description: "注册新的 OAuth 客户端应用" })
  @ApiBody({ type: CreateOAuthClientDto })
  @ApiResponse({ status: 201, description: "客户端注册成功", type: OAuthClientCreatedResponse })
  @ApiResponse({ status: 400, description: "参数错误" })
  async createClient(@Body() dto: CreateOAuthClientDto): Promise<OAuthClientCreatedResponse> {
    const result = await this.oauthService.createClient({
      ...dto,
      allowedScopes: dto.allowedScopes || [],
      clientType: (dto.clientType as "confidential" | "public" | undefined) || "confidential",
    });

    // 确保返回有 clientSecret
    return {
      ...result,
      clientSecret: result.clientSecret || "",
    };
  }

  /**
   * 获取 OAuth 客户端列表
   *
   * @description
   * 获取所有 OAuth 客户端（需要认证）
   *
   * @example
   * GET /api/oauth/clients?includeInactive=false
   * Response: { clients: [...], total: 10 }
   */
  @Get()
  @ApiOperation({ summary: "获取 OAuth 客户端列表", description: "获取所有 OAuth 客户端（需要认证）" })
  @ApiQuery({
    name: "includeInactive",
    description: "是否包含已禁用的客户端",
    type: "boolean",
    required: false,
  })
  @ApiResponse({ status: 200, description: "成功", type: OAuthClientListResponse })
  async listClients(
    @Query("includeInactive", new ParseBoolPipe({ optional: true })) includeInactive?: boolean
  ): Promise<OAuthClientListResponse> {
    return this.oauthService.listClients(includeInactive ?? false);
  }

  /**
   * 获取 OAuth 客户端详情
   *
   * @description
   * 获取指定客户端的详细信息
   *
   * @example
   * GET /api/oauth/clients/:id
   * Response: { id: "...", clientId: "...", ... }
   */
  @Get(":id")
  @ApiOperation({ summary: "获取 OAuth 客户端详情", description: "获取指定客户端的详细信息" })
  @ApiParam({ name: "id", description: "客户端 ID", type: "string" })
  @ApiResponse({ status: 200, description: "成功", type: OAuthClientResponse })
  @ApiResponse({ status: 404, description: "客户端不存在" })
  async getClient(@Param("id") id: string): Promise<OAuthClientResponse> {
    const client = await this.oauthService.getClientById(id);

    if (!client) {
      throw new NotFoundException("客户端不存在");
    }

    return client;
  }

  /**
   * 更新 OAuth 客户端
   *
   * @description
   * 更新客户端配置信息
   *
   * @example
   * PUT /api/oauth/clients/:id
   * Body: { name: "Updated App", redirectUris: ["http://localhost:3000/callback"] }
   * Response: { id: "...", ... }
   */
  @Put(":id")
  @ApiOperation({ summary: "更新 OAuth 客户端", description: "更新客户端配置信息" })
  @ApiParam({ name: "id", description: "客户端 ID", type: "string" })
  @ApiBody({ type: UpdateOAuthClientDto })
  @ApiResponse({ status: 200, description: "成功", type: OAuthClientResponse })
  @ApiResponse({ status: 404, description: "客户端不存在" })
  async updateClient(
    @Param("id") id: string,
    @Body() dto: UpdateOAuthClientDto
  ): Promise<OAuthClientResponse> {
    const client = await this.oauthService.updateClient(id, dto);

    if (!client) {
      throw new NotFoundException("客户端不存在");
    }

    return client;
  }

  /**
   * 删除 OAuth 客户端
   *
   * @description
   * 删除（撤销）指定的 OAuth 客户端
   *
   * @example
   * DELETE /api/oauth/clients/:id
   * Response: { success: true }
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "删除 OAuth 客户端", description: "删除（撤销）指定的 OAuth 客户端" })
  @ApiParam({ name: "id", description: "客户端 ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "删除成功",
    schema: { example: { success: true, message: "客户端已删除" } },
  })
  @ApiResponse({ status: 404, description: "客户端不存在" })
  async deleteClient(@Param("id") id: string): Promise<{ success: boolean; message: string }> {
    await this.oauthService.deleteClient(id);

    return {
      success: true,
      message: "客户端已删除",
    };
  }

  /**
   * 轮换客户端密钥
   *
   * @description
   * 生成新的客户端密钥（仅机密客户端）
   *
   * @example
   * POST /api/oauth/clients/:id/rotate-secret
   * Response: { clientId: "...", clientSecret: "new-secret", message: "..." }
   */
  @Post(":id/rotate-secret")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "轮换客户端密钥", description: "生成新的客户端密钥（仅机密客户端）" })
  @ApiParam({ name: "id", description: "客户端 ID", type: "string" })
  @ApiResponse({ status: 200, description: "轮换成功", type: RotateClientSecretResponse })
  @ApiResponse({ status: 404, description: "客户端不存在" })
  async rotateSecret(@Param("id") id: string): Promise<RotateClientSecretResponse> {
    const result = await this.oauthService.rotateClientSecret(id);
    return {
      success: true,
      message: result.message,
      clientSecret: result.clientSecret,
    };
  }
}
