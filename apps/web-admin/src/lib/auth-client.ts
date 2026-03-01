import { createAuthClient } from "better-auth/react";
import { env } from "@/env/client";

/**
 * Better Auth 客户端
 *
 * @description
 * 连接到 Gateway 的 Better Auth API
 * API 地址: http://localhost:3000/api/auth
 *
 * @see https://better-auth.com/docs/integrations/tanstack
 */
export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
});
