/**
 * Better Auth 插件 API 类型定义
 *
 * @description
 * 为 Better Auth 插件提供完整的 TypeScript 类型定义
 * 这些类型基于 Better Auth 官方插件 API
 */

export * from "./types/admin.types";
export * from "./types/api-key.types";
export * from "./types/auth.types";
// 导出所有类型定义
export * from "./types/base.types";
export * from "./types/complete-api.types";
export * from "./types/impersonation.types";
// 导出请求类型
export * from "./types/requests/admin.requests";
export * from "./types/requests/api-key.requests";
export * from "./types/requests/auth.requests";
// Admin 响应类型
// 也导出 Admin 的 RevokeSessionResponse 以避免冲突
export type {
  AdminPermissionResponse,
  AdminSessionListResponse,
  AdminSessionResponse,
  AdminUserListResponse,
  AdminUserResponse,
  BanUserResponse,
  ImpersonateUserResponse as AdminImpersonateUserResponse,
  RevokeSessionResponse,
  SetRoleResponse,
  StopImpersonatingResponse as AdminStopImpersonatingResponse,
  UnbanUserResponse,
} from "./types/responses/admin.responses";
// 导出响应类型（逐个导出以避免冲突）
export * from "./types/responses/api-key.responses";
// Auth 响应类型
// 解决 SessionInfo 冲突 - 重新导出 Auth 的 SessionInfo
export type {
  AuthResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  SessionInfo,
  SessionResponse,
  SignInResponse,
  SignOutResponse,
  SignUpResponse,
  TwoFactorResponse,
  TwoFactorVerifyResponse,
  UserInfo,
} from "./types/responses/auth.responses";
// Impersonation 响应类型
export type {
  ImpersonateUserResponse as ImpersonationImpersonateUserResponse,
  ImpersonationHistoryResponse,
  ImpersonationResponse,
  ImpersonationSession,
  StopImpersonationResponse as ImpersonationStopImpersonationResponse,
} from "./types/responses/impersonation.responses";
// Session 响应类型
export type {
  SessionConfigResponse,
  SessionListResponse,
} from "./types/responses/session.responses";
export * from "./types/session.types";
