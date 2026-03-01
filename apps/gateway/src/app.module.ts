import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@oksai/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { UserController } from './auth/user.controller';
import { auth } from './auth/auth';

/**
 * 根模块
 *
 * @description
 * 应用根模块，配置：
 * - ConfigModule: 全局配置管理
 * - ThrottlerModule: API 限流保护
 * - AuthModule: Better Auth 认证集成
 *
 * 注意：AuthModule 默认注册全局 AuthGuard
 * 所有路由默认需要认证，使用 @AllowAnonymous() 或 @OptionalAuth() 开放访问
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 限流保护
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 秒
        limit: 100, // 最多 100 次请求
      },
    ]),

    // Better Auth 集成
    AuthModule.forRoot({
      auth,
      // isGlobal: true (默认值，全局模块)
      // disableGlobalAuthGuard: false (默认值，启用全局守卫)
      // disableTrustedOriginsCors: false (默认值，自动配置 CORS)
    }),
  ],
  controllers: [AppController, HealthController, UserController],
  providers: [AppService],
})
export class AppModule {}
