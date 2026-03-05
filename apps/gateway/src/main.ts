import "tsconfig-paths/register";
import { join } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@oksai/config";
import { OksaiLoggerService } from "@oksai/logger";
import { AppModule } from "./app.module";

/**
 * 应用启动入口
 *
 * @description
 * 配置 NestJS 应用：
 * 1. 设置全局前缀 /api
 * 2. 启用 CORS（允许前端跨域访问）
 * 3. 配置全局验证管道
 * 4. 提供静态文件服务（登录页面）
 * 5. 使用 OksaiLoggerService 作为全局日志器
 *
 * 注意：body parser 由 nestjs-better-auth 模块自动处理，
 * 它会选择性跳过 Better Auth 路由的 body 解析。
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const logger = await app.resolve(OksaiLoggerService);
  app.useLogger(logger);

  app.setGlobalPrefix("api");

  // 启用 CORS，允许前端跨域访问
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useStaticAssets(join(__dirname, "..", "public"));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Gateway running on http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/api`);
  logger.log(`🔐 Auth endpoint: http://localhost:${port}/api/auth`);
  logger.log(`🎨 Login page: http://localhost:${port}/login.html`);
}

bootstrap();
