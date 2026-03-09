import process from "node:process";
import { MikroORM } from "@mikro-orm/core";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ApiExtraModels } from "@nestjs/swagger";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule, CacheMonitorController } from "@oksai/cache";
import { ConfigModule, ConfigService } from "@oksai/config";
import { MikroOrmDatabaseModule } from "@oksai/database";
import { GlobalExceptionFilter } from "@oksai/exceptions";
import {
  Account,
  ApiKey,
  DomainEventEntity,
  OAuthAccessToken,
  OAuthAuthorizationCode,
  OAuthClient,
  OAuthRefreshToken,
  Session,
  Tenant,
  User,
  Webhook,
  WebhookDelivery,
} from "@oksai/iam-identity";
import { LoggerModule } from "@oksai/logger";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { createAuthInstance } from "./auth/auth.js";
import { AuthFeatureModule } from "./auth/auth.module.js";
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
} from "./auth/dto/index.js";
import { CustomThrottlerGuard } from "./common/custom-throttler.guard.js";
import { ExceptionExampleController } from "./examples/exception-example.controller.js";
import { HealthController } from "./health/health.controller.js";
import { RootController } from "./root.controller.js";
import { TenantMiddleware } from "./tenant/tenant.middleware.js";
import { TenantModule } from "./tenant/tenant.module.js";

const isProduction = process.env.NODE_ENV === "production";
const shouldPrettyLog = process.env.LOG_PRETTY ? process.env.LOG_PRETTY === "true" : !isProduction;

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
 * - TenantMiddleware: 租户识别与上下文注入
 *
 * 注意：AuthModule 默认注册全局 AuthGuard
 * 所有路由默认需要认证，使用 @AllowAnonymous() 或 @OptionalAuth() 开放访问
 *
 * 租户隔离：
 * - TenantMiddleware 自动识别租户（JWT/Header/子域名）
 * - TenantFilter 自动过滤数据（MikroORM）
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
      pretty: shouldPrettyLog,
      level: process.env.LOG_LEVEL || "info",
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    /**
     * MikroORM 数据库模块
     *
     * 配置数据库连接并注册实体：
     * - OAuth 实体（来自 @oksai/database）
     * - Webhook 实体（来自 @oksai/database）
     * - IAM 实体（通过 extraEntities 注入）
     */
    MikroOrmDatabaseModule.forRoot({
      entities: [
        // IAM 实体
        Tenant,
        User,
        Session,
        Account,
        ApiKey,
        DomainEventEntity,
        // OAuth 实体
        OAuthClient,
        OAuthAccessToken,
        OAuthRefreshToken,
        OAuthAuthorizationCode,
        // Webhook 实体
        Webhook,
        WebhookDelivery,
      ],
    }),

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

    TenantModule,
  ],
  controllers: [
    RootController,
    AppController,
    HealthController,
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
