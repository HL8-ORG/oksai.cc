/**
 * @description 认证 API 契约
 *
 * 定义认证相关的 API 接口规范
 *
 * @module @oksai/constants/contracts/api/auth
 */

// ============ 路由常量 ============

/**
 * @description 认证 API 路由前缀
 */
export const AUTH_API_PREFIX = "/auth";

/**
 * @description 认证 API 端点
 */
export const AUTH_API_ENDPOINTS = {
  /** 登录 */
  LOGIN: "/login",
  /** 注册 */
  REGISTER: "/register",
  /** 登出 */
  LOGOUT: "/logout",
  /** 刷新令牌 */
  REFRESH: "/refresh",
  /** 当前用户 */
  ME: "/me",
  /** 修改密码 */
  CHANGE_PASSWORD: "/change-password",
  /** 忘记密码 */
  FORGOT_PASSWORD: "/forgot-password",
  /** 重置密码 */
  RESET_PASSWORD: "/reset-password",
  /** 验证邮箱 */
  VERIFY_EMAIL: "/verify-email",
  /** 重新发送验证邮件 */
  RESEND_VERIFICATION: "/resend-verification",
  /** OAuth 登录 */
  OAUTH: "/oauth/:provider",
  /** OAuth 回调 */
  OAUTH_CALLBACK: "/oauth/:provider/callback",
  /** API Keys */
  API_KEYS: "/api-keys",
} as const;

// ============ OAuth 提供商常量 ============

/**
 * @description OAuth 提供商
 */
export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
  MICROSOFT: "microsoft",
  APPLE: "apple",
} as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[keyof typeof OAUTH_PROVIDERS];

// ============ 请求 DTO ============

/**
 * @description 登录请求 DTO
 */
export interface LoginRequest {
  /** 邮箱地址 */
  email: string;
  /** 密码 */
  password: string;
  /** 记住我 */
  rememberMe?: boolean;
  /** MFA 代码 */
  mfaCode?: string;
}

/**
 * @description 注册请求 DTO
 */
export interface RegisterRequest {
  /** 邮箱地址 */
  email: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 租户 ID（可选，用于加入租户） */
  tenantId?: string;
  /** 邀请码（可选） */
  inviteCode?: string;
}

/**
 * @description 修改密码请求 DTO
 */
export interface ChangePasswordRequest {
  /** 当前密码 */
  currentPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmNewPassword: string;
}

/**
 * @description 忘记密码请求 DTO
 */
export interface ForgotPasswordRequest {
  /** 邮箱地址 */
  email: string;
}

/**
 * @description 重置密码请求 DTO
 */
export interface ResetPasswordRequest {
  /** 重置令牌 */
  token: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmNewPassword: string;
}

// ============ 响应 DTO ============

/**
 * @description 认证响应 DTO
 */
export interface AuthResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: "Bearer";
  /** 过期时间（秒） */
  expiresIn: number;
  /** 用户信息 */
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

/**
 * @description 当前用户响应 DTO
 */
export interface CurrentUserResponse {
  /** 用户 ID */
  id: string;
  /** 邮箱地址 */
  email: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName: string | null;
  /** 用户角色 */
  role: string;
  /** 是否已验证邮箱 */
  emailVerified: boolean;
  /** 租户信息 */
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  /** 会话信息 */
  session: {
    id: string;
    expiresAt: string;
  };
}
