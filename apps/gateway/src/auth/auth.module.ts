/**
 * 认证模块
 */

import { Module } from "@nestjs/common";
import { CacheModule } from "../common/cache.module";
import { ApiKeyController } from "./api-key.controller";
import { ApiKeyService } from "./api-key.service";
import { auth } from "./auth";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OAuthController } from "./oauth.controller";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";

/**
 * 认证模块
 *
 * @description
 * 提供用户认证功能：
 * - 用户注册/登录
 * - 邮箱验证
 * - 密码重置
 * - Magic Link 登录
 * - OAuth 社交登录（Google、GitHub）
 * - 2FA 双因素认证
 * - API Key 认证
 * - Session 管理
 * - 组织/团队管理
 */
@Module({
  imports: [CacheModule],
  controllers: [AuthController, OAuthController, ApiKeyController, SessionController, OrganizationController],
  providers: [
    {
      provide: AuthService,
      useFactory: (sessionService: SessionService) => {
        // 类型断言以兼容 Better Auth API
        return new AuthService(auth.api as any, sessionService);
      },
      inject: [SessionService],
    },
    ApiKeyService,
    SessionService,
    {
      provide: OrganizationService,
      useFactory: () => {
        return new OrganizationService(auth.api as any);
      },
    },
  ],
  exports: [AuthService, ApiKeyService, SessionService, OrganizationService],
})
export class AuthFeatureModule {}
