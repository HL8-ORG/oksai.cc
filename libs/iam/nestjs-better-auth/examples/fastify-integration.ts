/**
 * Fastify 平台集成示例
 *
 * 本示例展示如何在 NestJS Fastify 应用中集成 Better Auth
 */

import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AuthModule } from "@oksai/iam/nestjs-better-auth";
import { betterAuth } from "better-auth";

// 1. 创建 Better Auth 实例
const auth = betterAuth({
  database: {
    // 数据库配置
  },
  emailAndPassword: {
    enabled: true,
  },
  // 其他配置...
});

// 2. 配置 AuthModule (Fastify 平台)
@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      platform: "fastify", // 明确指定 Fastify 平台
      // 其他选项...
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Fastify 平台的 body parser 中间件会自动配置
    // 无需手动配置
  }
}

// 3. 启动 Fastify 应用
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

/**
 * 可选：手动配置 Fastify body parser
 *
 * 如果需要自定义配置，可以这样做：
 */
@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      platform: "fastify",
      disableBodyParser: true, // 禁用自动配置
    }),
  ],
})
export class AppModuleWithManualConfig implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 手动应用 Fastify 中间件
    consumer
      .apply(
        SkipBodyParsingMiddlewareFastify({
          basePath: "/api/auth",
        })
      )
      .forRoutes("*path");
  }
}

/**
 * 注意事项：
 *
 * 1. Fastify 的 body parser 在应用级别配置，不在路由级别
 * 2. AuthModule 会自动检测平台类型（如果未指定）
 * 3. 推荐明确指定 platform: 'fastify' 以避免歧义
 * 4. Fastify 需要安装：@nestjs/platform-fastify 和 fastify
 *
 * 可选依赖：
 * - @nestjs/platform-fastify
 * - fastify
 */
