import process from "node:process";
import { MikroORM } from "@mikro-orm/core";
import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ApiExtraModels } from "@nestjs/swagger";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule, ConfigService } from "@oksai/config";
import { MikroOrmDatabaseModule } from "@oksai/database";
import { GlobalExceptionFilter } from "@oksai/exceptions";
import { LoggerModule } from "@oksai/logger";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { createAuthInstance } from "./auth/auth";
import { AuthFeatureModule } from "./auth/auth.module";
import {
  AdminImpersonateResponse,
  AdminSessionListResponse,
  AdminUserListResponse,
  AdminUserResponse,
  ApiKeyListResponse,
  ApiKeyResponse,
  BanUserDto,
  CheckPermissionDto,
  CheckPermissionResponse,
  CreateAdminUserDto,
  CreateApiKeyDto,
  CreateOrganizationDto,
  CreateWebhookDto,
  DisableTwoFactorDto,
  EnableTwoFactorDto,
  ForgotPasswordDto,
  ImpersonateUserDto,
  InviteMemberDto,
  ListUsersDto,
  MagicLinkDto,
  OAuthClientCreatedResponse,
  OAuthClientListResponse,
  OAuthClientResponse,
  OrganizationListResponse,
  OrganizationResponse,
  RegisterOAuthClientDto,
  ResetPasswordDto,
  RotateClientSecretResponse,
  SessionConfigResponse,
  SessionListResponse,
  SetUserRoleDto,
  SignInDto,
  SignUpDto,
  StopImpersonatingResponse,
  UnbanUserResponse,
  UpdateApiKeyDto,
  UpdateMemberRoleDto,
  UpdateOAuthClientDto,
  UpdateOrganizationDto,
  UpdateSessionConfigDto,
  UpdateWebhookDto,
  VerifyEmailDto,
  VerifyTwoFactorDto,
  WebhookDeliveryResponse,
  WebhookResponse,
} from "./auth/dto";
import { UserController } from "./auth/user.controller";
import { CacheModule } from "./common/cache.module";
import { CacheMonitorController } from "./common/cache-monitor.controller";
import { CustomThrottlerGuard } from "./common/custom-throttler.guard";
import { ExceptionExampleController } from "./examples/exception-example.controller";
import { HealthController } from "./health/health.controller";

/**
 * 根模块
 *
 * @description
 * 应用根模块，配置：
 * - ConfigModule: 全局配置管理（基于 @oksai/config）
 * - LoggerModule: 全局日志管理（基于 @oksai/logger）
 * - ThrottlerModule: API 限流保护
 * - AuthModule: Better Auth 认证集成
 * - AuthFeatureModule: 认证功能模块（注册/登录/邮箱验证等）
 *
 * 注意：AuthModule 默认注册全局 AuthGuard
 * 所有路由默认需要认证，使用 @AllowAnonymous() 或 @OptionalAuth() 开放访问
 */
@ApiExtraModels(
  AdminImpersonateResponse,
  AdminSessionListResponse,
  AdminUserListResponse,
  AdminUserResponse,
  ApiKeyListResponse,
  ApiKeyResponse,
  BanUserDto,
  CheckPermissionDto,
  CheckPermissionResponse,
  CreateAdminUserDto,
  CreateApiKeyDto,
  CreateOrganizationDto,
  CreateWebhookDto,
  DisableTwoFactorDto,
  EnableTwoFactorDto,
  ForgotPasswordDto,
  ImpersonateUserDto,
  InviteMemberDto,
  ListUsersDto,
  MagicLinkDto,
  OAuthClientCreatedResponse,
  OAuthClientListResponse,
  OAuthClientResponse,
  OrganizationListResponse,
  OrganizationResponse,
  RegisterOAuthClientDto,
  ResetPasswordDto,
  RotateClientSecretResponse,
  SessionConfigResponse,
  SessionListResponse,
  SetUserRoleDto,
  SignInDto,
  SignUpDto,
  StopImpersonatingResponse,
  UnbanUserResponse,
  UpdateApiKeyDto,
  UpdateMemberRoleDto,
  UpdateOAuthClientDto,
  UpdateOrganizationDto,
  UpdateSessionConfigDto,
  UpdateWebhookDto,
  VerifyEmailDto,
  VerifyTwoFactorDto,
  WebhookDeliveryResponse,
  WebhookResponse
)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    LoggerModule.forRoot({
      isGlobal: true,
      pretty: process.env.NODE_ENV !== "production",
      level: process.env.LOG_LEVEL || "info",
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    MikroOrmDatabaseModule,

    AuthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService, orm: MikroORM) => {
        const auth = createAuthInstance(orm, configService);
        return {
          auth,
          // 禁用内置 CORS，因为我们在 main.ts 中已经配置了
          disableTrustedOriginsCors: true,
        };
      },
      inject: [ConfigService, MikroORM],
    }),

    AuthFeatureModule,

    CacheModule.forRoot({
      redisEnabled: process.env.REDIS_ENABLED === "true",
      redisUrl: process.env.REDIS_URL,
      max: 10000,
      ttl: 60000,
      enableStats: true,
    }),
  ],
  controllers: [
    AppController,
    HealthController,
    UserController,
    CacheMonitorController,
    ExceptionExampleController,
  ],
  providers: [
    AppService,
    CustomThrottlerGuard,
    {
      provide: APP_GUARD,
      useExisting: CustomThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
