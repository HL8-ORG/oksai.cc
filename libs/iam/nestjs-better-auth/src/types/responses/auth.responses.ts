/**
 * 基础认证响应类型定义
 */

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified: boolean;
  role: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserInfo;
  session?: SessionInfo;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  session: SessionInfo;
}

export interface SignUpResponse extends AuthResponse {
  user: UserInfo;
  session: SessionInfo;
}

export interface SignInResponse extends AuthResponse {
  user: UserInfo;
  session: SessionInfo;
}

export interface SignOutResponse {
  success: boolean;
  message: string;
}

export interface TwoFactorResponse {
  backupCodes: string[];
  totpURI: string;
}

export interface TwoFactorVerifyResponse {
  valid: boolean;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
