/**
 * 基础使用示例
 * 展示如何将 Better Auth 集成到 NestJS 应用中
 */

import { Module } from '@nestjs/common';
import { AuthModule, AllowAnonymous, Session } from '@oksai/nestjs-better-auth';
import { betterAuth } from 'better-auth';

// 1. 创建 Better Auth 实例
const auth = betterAuth({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  emailAndPassword: {
    enabled: true,
  },
  // 其他配置...
});

// 2. 在 NestJS 模块中导入 AuthModule
@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      isGlobal: true, // 全局模块
    }),
  ],
})
export class AppModule {}

// 3. 在控制器中使用装饰器
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // 公开路由 - 不需要认证
  @Get('public')
  @AllowAnonymous()
  getPublicData() {
    return { message: 'This is public data' };
  }

  // 受保护路由 - 需要认证
  @Get('profile')
  getProfile(@Session() session: any) {
    return {
      user: session.user,
      session: session.session,
    };
  }

  // 可选认证 - 有会话则提供，无会话也允许访问
  @Get('optional')
  @OptionalAuth()
  getOptionalData(@Session() session: any) {
    if (session) {
      return { message: `Hello, ${session.user.name}!` };
    }
    return { message: 'Hello, guest!' };
  }
}

// 4. 在 main.ts 中启动应用
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
