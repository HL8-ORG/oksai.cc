/**
 * API Key 管理控制器（Better Auth 版本）
 *
 * @description
 * 使用 Better Auth API Key 插件提供 API Key 管理功能
 *
 * 支持的特性：
 * - 创建/列出/获取/更新/删除 API Keys
 * - 速率限制
 * - 权限系统
 * - 元数据支持
 * - 过期时间管理
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BetterAuthApiClient } from "@oksai/nestjs-better-auth";
import { auth } from "./auth.js";
import { ApiKeyListResponse, ApiKeyResponse, CreateApiKeyDto } from "./dto/index.js";

/**
 * API Key 管理控制器
 *
 * @description
 * 提供 API Key 的创建、查询、更新、删除接口
 *
 * 所有接口需要用户认证（通过 Bearer Token）
 *
 * @see https://better-auth.com/docs/plugins/api-key
 */
@ApiTags("API Key 管理")
@Controller("api-keys")
export class ApiKeyController {
  private readonly apiClient: BetterAuthApiClient;

  constructor() {
    this.apiClient = new BetterAuthApiClient(auth.api);
  }
  /**
   * 创建 API Key
   *
   * @description
   * 创建新的 API Key。返回的完整 Key 仅显示一次，请妥善保存。
   *
   * 支持的功能：
   * - 自定义名称
   * - 设置过期时间
   * - 速率限制
   * - 权限配置
   * - 元数据
   *
   * @example
   * POST /api/api-keys
   * Header: Authorization: Bearer <token>
   * Body: {
   *   "name": "My API Key",
   *   "expiresIn": 31536000,  // 1 年（秒）
   *   "permissions": { "user": ["read", "write"] },
   *   "metadata": { "project": "demo" }
   * }
   * Response: {
   *   "id": "xxx",
   *   "key": "api-key_xxx",  // 仅此一次显示
   *   "name": "My API Key",
   *   ...
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建 API Key", description: "创建新的 API Key，完整 Key 仅显示一次" })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({ status: 201, description: "创建成功", type: ApiKeyResponse })
  async createApiKey(@Body() dto: CreateApiKeyDto): Promise<ApiKeyResponse> {
    // TODO: 从 session 中提取 userId
    // 临时方案：使用硬编码的 userId
    const userId = "temp-user-id";

    // 使用 Better Auth API 创建 API Key
    const result = await this.apiClient.createApiKey(
      userId,
      {
        name: dto.name,
        expiresIn: dto.expiresIn,
        permissions: dto.permissions,
        metadata: dto.metadata,
        // 速率限制（可选）
        rateLimitEnabled: dto.rateLimitEnabled,
        rateLimitTimeWindow: dto.rateLimitTimeWindow,
        rateLimitMax: dto.rateLimitMax,
        // Refill 机制（可选）
        remaining: dto.remaining,
        refillAmount: dto.refillAmount,
        refillInterval: dto.refillInterval,
      },
      "temp-session-token"
    );

    return {
      id: result.id,
      name: result.name || null,
      prefix: result.prefix || result.start || "",
      createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
      expiresAt: result.expiresAt ? new Date(result.expiresAt) : null,
      lastUsedAt: result.lastRequest ? new Date(result.lastRequest) : null,
      // 仅创建时返回完整 key
      key: result.key,
      // Better Auth 特有字段
      isActive: result.isActive,
      remaining: result.remaining,
      rateLimitEnabled: result.rateLimitEnabled,
      permissions: result.permissions,
      metadata: result.metadata,
    };
  }

  /**
   * 获取 API Key 列表
   *
   * @description
   * 获取当前用户的所有 API Keys（支持分页和排序）
   *
   * @example
   * GET /api/api-keys?limit=10&offset=0&sortBy=createdAt&sortDirection=desc
   * Header: Authorization: Bearer <token>
   * Response: {
   *   "success": true,
   *   "message": "获取 API Key 列表成功",
   *   "apiKeys": [...],
   *   "total": 25
   * }
   */
  @Get()
  @ApiOperation({
    summary: "获取 API Key 列表",
    description: "获取当前用户的所有 API Keys（支持分页和排序）",
  })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({
    status: 200,
    description: "成功",
    type: ApiKeyListResponse,
  })
  async listApiKeys(
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortDirection") sortDirection?: "asc" | "desc"
  ): Promise<ApiKeyListResponse> {
    // 使用 Better Auth API 列出 API Keys
    const result = await this.apiClient.listApiKeys(
      {
        limit: limit || 100,
        offset: offset || 0,
        sortBy: sortBy || "createdAt",
        sortDirection: sortDirection || "desc",
      },
      "temp-session-token"
    );

    return {
      success: true,
      message: "获取 API Key 列表成功",
      total: result.total || result.apiKeys.length,
      apiKeys: result.keys.map(
        (key: {
          id: string;
          name?: string;
          prefix?: string;
          start?: string;
          createdAt?: string;
          expiresAt?: string;
          lastRequest?: string;
          enabled: boolean;
          remaining: number;
          rateLimitEnabled: boolean;
        }) => ({
          id: key.id,
          name: key.name || null,
          prefix: key.prefix || key.start || "",
          createdAt: key.createdAt ? new Date(key.createdAt) : new Date(),
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
          lastUsedAt: key.lastRequest ? new Date(key.lastRequest) : null,
          // Better Auth 特有字段
          isActive: key.enabled,
          enabled: key.enabled,
          remaining: key.remaining,
          rateLimitEnabled: key.rateLimitEnabled,
        })
      ),
      keys: result.keys.map(
        (key: {
          id: string;
          name?: string;
          prefix?: string;
          start?: string;
          createdAt?: string;
          expiresAt?: string;
          lastRequest?: string;
          enabled: boolean;
          remaining: number;
          rateLimitEnabled: boolean;
        }) => ({
          id: key.id,
          name: key.name || null,
          prefix: key.prefix || key.start || "",
          createdAt: key.createdAt ? new Date(key.createdAt) : new Date(),
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
          lastUsedAt: key.lastRequest ? new Date(key.lastRequest) : null,
          // Better Auth 特有字段
          enabled: key.enabled,
          remaining: key.remaining,
          rateLimitEnabled: key.rateLimitEnabled,
        })
      ),
    };
  }

  /**
   * 获取单个 API Key
   *
   * @description
   * 获取指定 API Key 的详细信息
   *
   * @example
   * GET /api/api-keys/:id
   * Header: Authorization: Bearer <token>
   * Response: {
   *   "id": "xxx",
   *   "name": "My API Key",
   *   "enabled": true,
   *   ...
   * }
   */
  @Get(":id")
  @ApiOperation({ summary: "获取单个 API Key", description: "获取指定 API Key 的详细信息" })
  @ApiParam({ name: "id", description: "API Key ID" })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({
    status: 200,
    description: "成功",
    type: ApiKeyResponse,
  })
  @ApiResponse({ status: 404, description: "API Key 不存在" })
  async getApiKey(@Param("id") apiKeyId: string): Promise<ApiKeyResponse> {
    // 使用 Better Auth API 获取 API Key
    const result = await this.apiClient.getApiKey(apiKeyId, "temp-session-token");

    if (!result) {
      throw new Error("API Key 不存在");
    }

    return {
      id: result.id,
      name: result.name || null,
      prefix: result.prefix || result.start || "",
      createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
      expiresAt: result.expiresAt ? new Date(result.expiresAt) : null,
      lastUsedAt: result.lastRequest ? new Date(result.lastRequest) : null,
      // Better Auth 特有字段
      isActive: result.enabled,
      enabled: result.enabled,
      remaining: result.remaining,
      rateLimitEnabled: result.rateLimitEnabled,
      permissions: result.permissions,
      metadata: result.metadata,
    };
  }

  /**
   * 删除 API Key
   *
   * @description
   * 删除（撤销）指定的 API Key。删除后立即失效。
   *
   * @example
   * DELETE /api/api-keys/:id
   * Header: Authorization: Bearer <token>
   * Response: {
   *   "success": true,
   *   "message": "API Key 已删除"
   * }
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "删除 API Key", description: "删除（撤销）指定的 API Key，删除后立即失效" })
  @ApiParam({ name: "id", description: "API Key ID" })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({
    status: 201,
    description: "创建成功",
    type: ApiKeyResponse,
  })
  async deleteApiKey(@Param("id") apiKeyId: string): Promise<{ success: boolean; message: string }> {
    // 使用 Better Auth API 删除 API Key
    await this.apiClient.deleteApiKey(apiKeyId, "temp-session-token");

    return {
      success: true,
      message: "API Key 已删除",
    };
  }
}
