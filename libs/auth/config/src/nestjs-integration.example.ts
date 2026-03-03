/**
 * Better Auth 配置在 NestJS Gateway 中的集成示例
 *
 * 文件位置: apps/gateway/src/auth/auth.module.ts
 */

import { Module } from "@nestjs/common";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { auth } from "./auth.config"; // 上面的 example-usage.ts

@Module({
  imports: [
    // 集成 Better Auth 到 NestJS
    AuthModule.forRoot({
      auth,
      isGlobal: true, // 全局模块
      disableGlobalAuthGuard: false, // 启用全局认证守卫
    }),
  ],
  exports: [AuthModule],
})
export class AuthFeatureModule {}
