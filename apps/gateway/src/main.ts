import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

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
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // 必须禁用，由 Better Auth 处理
  });
  const configService = app.get(ConfigService);

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 配置静态文件服务（登录页面等）
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 注意：CORS 由 Better Auth 模块根据 trustedOrigins 自动配置
  // 不要在这里手动配置 CORS，否则会冲突

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Gateway running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api`);
  console.log(`🔐 Auth endpoint: http://localhost:${port}/api/auth`);
  console.log(`🎨 Login page: http://localhost:${port}/login.html`);
}

bootstrap();
