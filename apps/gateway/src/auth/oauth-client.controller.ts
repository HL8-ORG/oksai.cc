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
import type { OAuthService } from "./oauth.service";
import type {
  CreateOAuthClientDto,
  OAuthClientCreatedResponse,
  OAuthClientListResponse,
  OAuthClientResponse,
  RotateClientSecretResponse,
  UpdateOAuthClientDto,
} from "./oauth-client.dto";

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
  async createClient(@Body() dto: CreateOAuthClientDto): Promise<OAuthClientCreatedResponse> {
    return this.oauthService.createClient(dto);
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
  async rotateSecret(@Param("id") id: string): Promise<RotateClientSecretResponse> {
    return this.oauthService.rotateClientSecret(id);
  }
}
