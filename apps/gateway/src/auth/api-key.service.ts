/**
 * API Key 管理服务
 *
 * TODO: 此服务暂时保留使用 Drizzle，待后续迁移到 MikroORM
 * 当前 API Key 管理主要由 Better Auth 的 API Key 插件处理（见 api-key.controller.ts）
 */

import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { apiKeys, db } from "@oksai/database";
import { and, eq, isNull } from "drizzle-orm";
import type { ApiKeyResponse, CreateApiKeyDto } from "./api-key.dto";

/**
 * API Key 管理服务
 *
 * @description
 * 提供API Key的创建、查询、撤销功能
 *
 * 注意：当前此服务未被使用，API Key 管理由 Better Auth 处理
 */
@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  /**
   * 创建 API Key
   */
  async createApiKey(userId: string, dto: CreateApiKeyDto): Promise<ApiKeyResponse> {
    try {
      this.logger.log(`创建 API Key: ${dto.name || "未命名"}`);

      const randomString = randomBytes(32).toString("hex");
      const apiKey = `oks_${randomString}`;
      const hashedKey = createHash("sha256").update(apiKey).digest("hex");
      const prefix = apiKey.substring(0, 11);
      const expiresAt = dto.expiresIn ? new Date(Date.now() + dto.expiresIn * 1000) : null;

      const result = await db
        .insert(apiKeys)
        .values({
          userId,
          name: dto.name || null,
          prefix,
          hashedKey,
          expiresAt,
        } as any)
        .returning();

      const keyRecord = result[0];
      if (!keyRecord) {
        throw new Error("创建 API Key 失败");
      }

      this.logger.log(`API Key 创建成功: ${keyRecord.id}`);

      return {
        id: keyRecord.id,
        name: keyRecord.name,
        prefix: (keyRecord as any).prefix,
        createdAt: keyRecord.createdAt,
        expiresAt: keyRecord.expiresAt,
        lastUsedAt: keyRecord.lastUsedAt,
        key: apiKey,
      };
    } catch (error) {
      this.logger.error(`创建 API Key 失败`, error);
      throw error;
    }
  }

  /**
   * 获取用户的 API Key 列表
   */
  async listApiKeys(userId: string): Promise<ApiKeyResponse[]> {
    try {
      const result = await db
        .select()
        .from(apiKeys)
        .where(and(eq((apiKeys as any).userId, userId), isNull((apiKeys as any).revokedAt)))
        .orderBy(apiKeys.createdAt);

      return result.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: (key as any).prefix,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
      }));
    } catch (error) {
      this.logger.error(`获取 API Key 列表失败`, error);
      throw error;
    }
  }

  /**
   * 撤销 API Key
   */
  async revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
    try {
      const result = await db
        .update(apiKeys)
        .set({ revokedAt: new Date() } as any)
        .where(and(eq(apiKeys.id, apiKeyId), eq((apiKeys as any).userId, userId)))
        .returning();

      if (!result[0]) {
        throw new NotFoundException("API Key 不存在或无权访问");
      }

      this.logger.log(`API Key 已撤销: ${apiKeyId}`);
    } catch (error) {
      this.logger.error(`撤销 API Key 失败`, error);
      throw error;
    }
  }
}
