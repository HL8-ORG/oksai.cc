/**
 * 认证模块
 */

import { Module } from "@nestjs/common";
import { MikroOrmDatabaseModule } from "@oksai/database";
import { AuthService as BetterAuthService } from "@oksai/nestjs-better-auth";
import { CacheModule } from "../common/cache.module";
import { CacheService } from "../common/cache.service";
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
  imports: [MikroOrmDatabaseModule, CacheModule.forRoot()],
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
      useFactory: (cacheService: CacheService) => {
        return new OAuthService(cacheService);
      },
      inject: [CacheService],
    },
    {
      provide: SessionService,
      useFactory: (cacheService: CacheService) => {
        return new SessionService(cacheService);
      },
      inject: [CacheService],
    },
    WebhookService,
    {
      provide: OrganizationService,
      useFactory: (betterAuthService: BetterAuthService) => {
        return new OrganizationService(betterAuthService.api as any);
      },
      inject: [BetterAuthService],
    },
  ],
  exports: [AuthService, OAuthService, SessionService, OrganizationService, WebhookService],
})
export class AuthFeatureModule {}
