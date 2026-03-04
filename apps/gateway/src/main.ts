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
 * 1. 禁用内置 body parser（Better Auth 需要处理原始请求体）
 * 2. 设置全局前缀 /api
 * 3. CORS 由 Better Auth 模块自动处理
 * 4. 配置全局验证管道
 * 5. 提供静态文件服务（登录页面）
 * 6. 使用 OksaiLoggerService 作为全局日志器
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // 必须禁用，由 Better Auth 处理
  });

  const configService = app.get(ConfigService);
  const logger = await app.resolve(OksaiLoggerService);
  app.useLogger(logger);

  app.setGlobalPrefix("api");
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
