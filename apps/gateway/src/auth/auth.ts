import { MikroORM } from "@mikro-orm/core";
import type { ConfigService } from "@oksai/config";
import { createAuth } from "./auth.config.js";

/**
 * Better Auth 实例管理
 *
 * @description
 * 提供全局的 Better Auth 实例访问
 * 通过 createAuthInstance 创建实例，通过 auth 导出
 */

let authInstance: any = null;

/**
 * 创建并设置 Better Auth 实例
 *
 * @description
 * 使用 ConfigService 和 MikroORM 创建配置好的 Better Auth 实例
 * 此函数由 AuthModule.forRootAsync 调用
 *
 * @param orm - MikroORM 实例
 * @param configService - 配置服务实例
 * @returns Better Auth 实例
 */
// biome-ignore lint/suspicious/noExplicitAny: Better Auth 类型过于复杂
export function createAuthInstance(orm: MikroORM, configService: ConfigService): any {
  authInstance = createAuth(orm, configService);
  return authInstance;
}

/**
 * Better Auth 实例
 *
 * @description
 * 全局的 Better Auth 实例，供其他模块使用
 * 注意：必须通过 createAuthInstance 初始化后才能访问
 */
// biome-ignore lint/suspicious/noExplicitAny: Better Auth 类型过于复杂
export const auth: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!authInstance) {
      throw new Error("Auth 实例未初始化。请确保 AuthModule.forRootAsync 已正确配置。");
    }
    return authInstance[prop];
  },
});

export type AuthInstance = ReturnType<typeof createAuthInstance>;
