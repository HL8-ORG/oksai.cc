/**
 * 基础认证请求类型定义
 */

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
  image?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
}

export interface EnableTwoFactorRequest {
  password: string;
}

export interface DisableTwoFactorRequest {
  code: string;
}

export interface VerifyTwoFactorRequest {
  code: string;
}
