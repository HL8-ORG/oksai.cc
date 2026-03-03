/**
 * API Key 管理控制器
 */

import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import type { ApiKeyListResponse, ApiKeyResponse, CreateApiKeyDto } from "./api-key.dto";
import type { ApiKeyService } from "./api-key.service";

/**
 * API Key 管理控制器
 *
 * @description
 * 提供API Key的创建、查询、撤销接口
 *
 * 所有接口需要用户认证（通过 Bearer Token）
 */
@Controller("api-keys")
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  /**
   * 创建 API Key
   *
   * @description
   * 创建新的 API Key。返回的完整 Key 仅显示一次，请妥善保存。
   *
   * @example
   * POST /api/api-keys
   * Header: Authorization: Bearer <token>
   * Body: { name: "My API Key", expiresAt: "2026-12-31T23:59:59Z" }
   * Response: { id: "...", key: "oks_...", ... }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(
    @Headers("authorization") _authorization: string,
    @Body() dto: CreateApiKeyDto
  ): Promise<ApiKeyResponse> {
    // TODO: 从 token 中提取 userId
    // 临时方案：使用硬编码的 userId
    const userId = "temp-user-id";
    return this.apiKeyService.createApiKey(userId, dto);
  }

  /**
   * 获取 API Key 列表
   *
   * @description
   * 获取当前用户的所有有效 API Key（不包括已撤销的）
   *
   * @example
   * GET /api/api-keys
   * Header: Authorization: Bearer <token>
   * Response: { success: true, apiKeys: [...] }
   */
  @Get()
  async listApiKeys(@Headers("authorization") _authorization: string): Promise<ApiKeyListResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    const apiKeys = await this.apiKeyService.listApiKeys(userId);
    return {
      success: true,
      message: "获取 API Key 列表成功",
      apiKeys,
    };
  }

  /**
   * 撤销 API Key
   *
   * @description
   * 撤销指定的 API Key。撤销后立即失效。
   *
   * @example
   * DELETE /api/api-keys/:id
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "API Key 已撤销" }
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(
    @Headers("authorization") _authorization: string,
    @Param("id") apiKeyId: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.apiKeyService.revokeApiKey(userId, apiKeyId);
    return {
      success: true,
      message: "API Key 已撤销",
    };
  }
}
