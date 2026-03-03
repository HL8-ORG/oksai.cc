/**
 * OAuth 认证控制器
 *
 * 提供 OAuth Provider 状态信息和配置
 */

import process from "node:process";
import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "@oksai/nestjs-better-auth";
import type { OAuthProviderStatus } from "./auth.dto";

/**
 * OAuth 认证控制器
 *
 * 提供以下功能：
 * - GET /auth/oauth/providers - 获取可用的 OAuth Provider 列表
 */
@Controller("auth/oauth")
export class OAuthController {
  /**
   * 获取可用的 OAuth Provider 列表
   *
   * @description
   * 返回所有已配置的 OAuth Provider 及其状态
   *
   * @example
   * GET /api/auth/oauth/providers
   * Response: {
   *   providers: [
   *     { provider: "google", enabled: true, callbackURL: "/api/auth/callback/google" },
   *     { provider: "github", enabled: false, callbackURL: "/api/auth/callback/github" }
   *   ]
   * }
   */
  @Get("providers")
  @AllowAnonymous()
  getProviders(): { providers: OAuthProviderStatus[] } {
    const providers: OAuthProviderStatus[] = [
      {
        provider: "google",
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        callbackURL: "/api/auth/callback/google",
      },
      {
        provider: "github",
        enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        callbackURL: "/api/auth/callback/github",
      },
    ];

    return { providers };
  }
}
