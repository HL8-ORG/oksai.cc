/**
 * Better Auth 基础认证 API 类型定义
 */

import type { BetterAuthRequestOptions } from "./base.types.js";
import type {
  DisableTwoFactorRequest,
  EnableTwoFactorRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SignInRequest,
  SignUpRequest,
  VerifyEmailRequest,
  VerifyTwoFactorRequest,
} from "./requests/auth.requests";
import type {
  AuthResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  SessionResponse,
  SignInResponse,
  SignOutResponse,
  SignUpResponse,
  TwoFactorResponse,
  TwoFactorVerifyResponse,
} from "./responses/auth.responses";

/**
 * Better Auth 基础认证 API 接口
 */
export interface BaseAuthAPI {
  /**
   * 用户注册
   */
  signUpEmail: (
    options: BetterAuthRequestOptions & {
      body: SignUpRequest;
    }
  ) => Promise<SignUpResponse>;

  /**
   * 用户登录
   */
  signInEmail: (
    options: BetterAuthRequestOptions & {
      body: SignInRequest;
    }
  ) => Promise<SignInResponse>;

  /**
   * 验证邮箱
   */
  verifyEmail: (
    options: BetterAuthRequestOptions & {
      body: VerifyEmailRequest;
    }
  ) => Promise<AuthResponse>;

  /**
   * 请求密码重置
   */
  requestPasswordReset: (
    options: BetterAuthRequestOptions & {
      body: ForgotPasswordRequest;
    }
  ) => Promise<ForgotPasswordResponse>;

  /**
   * 重置密码
   */
  resetPassword: (
    options: BetterAuthRequestOptions & {
      body: ResetPasswordRequest;
    }
  ) => Promise<ResetPasswordResponse>;

  /**
   * 获取会话
   */
  getSession: (options: BetterAuthRequestOptions) => Promise<SessionResponse>;

  /**
   * 登出
   */
  signOut: (options: BetterAuthRequestOptions) => Promise<SignOutResponse>;

  /**
   * 社交登录
   */
  signInSocial: (options: BetterAuthRequestOptions) => Promise<AuthResponse>;

  /**
   * 发送验证邮箱
   */
  sendVerificationEmail: (options: BetterAuthRequestOptions) => Promise<AuthResponse>;

  /**
   * 启用双因素认证
   */
  enableTwoFactor: (
    options: BetterAuthRequestOptions & {
      body: EnableTwoFactorRequest;
    }
  ) => Promise<TwoFactorResponse>;

  /**
   * 验证双因素认证
   */
  verifyTwoFactor: (
    options: BetterAuthRequestOptions & {
      body: VerifyTwoFactorRequest;
    }
  ) => Promise<TwoFactorVerifyResponse>;

  /**
   * 禁用双因素认证
   */
  disableTwoFactor: (
    options: BetterAuthRequestOptions & {
      body: DisableTwoFactorRequest;
    }
  ) => Promise<AuthResponse>;
}
