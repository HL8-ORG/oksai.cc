import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env/client";

/**
 * Better Auth React 客户端
 *
 * @description
 * 连接到 Gateway 的 Better Auth API
 * - API 地址: http://localhost:3000/api/auth
 * - 提供完整的认证功能（登录、注册、会话管理等）
 * - 集成 TanStack Query 进行状态管理
 * - 支持 2FA 功能
 *
 * @see https://better-auth.com/docs/integrations/react
 */
export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/2fa-verify";
      },
    }),
  ],
});

/**
 * 用户会话类型定义
 */
export type Session = typeof authClient.$Infer.Session.session;
export type User = typeof authClient.$Infer.Session.user;
