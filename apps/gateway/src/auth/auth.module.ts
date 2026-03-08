/**
 * 认证模块
 *
 * @description
 * 使用 Better Auth 插件生态提供认证功能：
 * - Admin 插件：用户管理、角色权限
 * - API Key 插件：API Key 管理
 * - Organization 插件：组织/团队管理
 * - 2FA 插件：双因素认证
 * - 原生 OAuth：社交登录（GitHub、Google）
 * - 原生会话管理：会话 CRUD
 *
 * 已移除的重复功能：
 * - SessionController（Better Auth 原生支持）
 * - UserController（Better Auth 原生支持）
 * - OAuthController（Better Auth 原生支持）
 * - OAuthV2Controller（Better Auth 提供 OAuth 2.1 Provider 插件）
 */

import { Module } from "@nestjs/common";
import { BetterAuthApiClient, AuthService as BetterAuthService } from "@oksai/nestjs-better-auth";
import { AdminController } from "./admin.controller.js";
import { ApiKeyController } from "./api-key.controller.js";
import { AuthService } from "./auth.service.js";
import { OrganizationController } from "./organization.controller.js";
import { OrganizationService } from "./organization.service.js";
import { TokenBlacklistService } from "./token-blacklist.service.js";
import { WebhookController } from "./webhook.controller.js";
import { WebhookService } from "./webhook.service.js";

@Module({
  imports: [],
  controllers: [
    // Better Auth 插件包装器
    AdminController,
    ApiKeyController,
    OrganizationController,

    // 业务特定的控制器
    WebhookController,
    // OAuthClientController, // ⚠️ 暂时禁用：依赖缓存服务，需要后续优化

    // 已禁用的重复控制器：
    // AuthController,        // Better Auth 原生 API
    // SessionController,     // Better Auth 原生支持
    // UserController,        // Better Auth 原生支持
    // OAuthController,       // Better Auth 原生支持
    // OAuthV2Controller,     // Better Auth 提供 OAuth 2.1 Provider 插件
  ],
  providers: [
    {
      provide: AuthService,
      useFactory: (betterAuthService: BetterAuthService) => {
        return new AuthService(betterAuthService.api as any);
      },
      inject: [BetterAuthService],
    },
    {
      provide: OrganizationService,
      useFactory: (betterAuthService: BetterAuthService) => {
        const apiClient = new BetterAuthApiClient(betterAuthService.api as any);

        return new OrganizationService(apiClient);
      },
      inject: [BetterAuthService],
    },
    // OAuthService, // ⚠️ 暂时禁用：依赖缓存服务
    TokenBlacklistService,
    WebhookService,
  ],
  exports: [
    AuthService,
    OrganizationService,
    // OAuthService, // ⚠️ 暂时禁用：依赖缓存服务
    WebhookService,
    TokenBlacklistService,
  ],
})
export class AuthFeatureModule {}
