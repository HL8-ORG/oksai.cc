/**
 * 认证模块
 */

import { EntityManager } from "@mikro-orm/core";
import { Module } from "@nestjs/common";
import { CacheModule, TwoLayerCacheService } from "@oksai/cache";
import { AuthService as BetterAuthService } from "@oksai/nestjs-better-auth";
import { AdminController } from "./admin.controller";
import { ApiKeyController } from "./api-key.controller";
import { AuthService } from "./auth.service";
import { OAuthController } from "./oauth.controller";
import { OAuthService } from "./oauth.service";
import { OAuthV2Controller } from "./oauth-v2.controller";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { TokenBlacklistService } from "./token-blacklist.service";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";

/**
 * 认证模块
 *
 * @description
 * 提供用户认证功能：
 * - 用户注册/登录（由 Better Auth 原生 API 处理）
 * - 邮箱验证
 * - 密码重置
 * - Magic Link 登录
 * - OAuth 社交登录（Google、GitHub）
 * - 2FA 双因素认证
 * - API Key 认证（使用 Better Auth 插件）
 * - Session 管理
 * - 组织/团队管理
 * - Webhook 事件通知
 * - Admin 管理（使用 Better Auth Admin 插件）
 *
 * 注意：AuthController 已禁用，因为前端使用 Better Auth 客户端直接调用原生 API。
 * 如需自定义认证端点，请使用不同的路由前缀（如 /auth-v2）避免冲突。
 */
@Module({
  imports: [CacheModule.forRoot()],
  controllers: [
    // AuthController, // 已禁用：与 Better Auth 原生 API 冲突
    OAuthController,
    OAuthV2Controller,
    ApiKeyController,
    SessionController,
    OrganizationController,
    WebhookController,
    AdminController,
  ],
  providers: [
    {
      provide: AuthService,
      useFactory: (betterAuthService: BetterAuthService, sessionService: SessionService) => {
        return new AuthService(betterAuthService.api as any, sessionService);
      },
      inject: [BetterAuthService, SessionService],
    },
    {
      provide: OAuthService,
      useFactory: (em: EntityManager, cacheService: TwoLayerCacheService) => {
        return new OAuthService(em, cacheService);
      },
      inject: [EntityManager, TwoLayerCacheService],
    },
    {
      provide: SessionService,
      useFactory: (
        em: EntityManager,
        betterAuthService: BetterAuthService,
        cacheService: TwoLayerCacheService
      ) => {
        // 创建 BetterAuthApiClient 实例
        const { BetterAuthApiClient } = require("@oksai/nestjs-better-auth");
        const apiClient = new BetterAuthApiClient(betterAuthService.api);

        return new SessionService(em, apiClient, cacheService);
      },
      inject: [EntityManager, BetterAuthService, TwoLayerCacheService],
    },
    TokenBlacklistService,
    WebhookService,
    {
      provide: OrganizationService,
      useFactory: (betterAuthService: BetterAuthService) => {
        // 创建 BetterAuthApiClient 实例
        const { BetterAuthApiClient } = require("@oksai/nestjs-better-auth");
        const apiClient = new BetterAuthApiClient(betterAuthService.api);

        return new OrganizationService(apiClient);
      },
      inject: [BetterAuthService],
    },
  ],
  exports: [
    AuthService,
    OAuthService,
    SessionService,
    OrganizationService,
    WebhookService,
    TokenBlacklistService,
  ],
})
export class AuthFeatureModule {}
