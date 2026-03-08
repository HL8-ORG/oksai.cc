/**
 * 用户模拟插件响应类型定义
 */

export interface ImpersonationSession {
  id: string;
  userId: string;
  impersonatorId: string;
  impersonatorEmail: string;
  targetUserEmail: string;
  reason?: string;
  startedAt: Date;
  expiresAt: Date;
}

export interface ImpersonateUserResponse {
  success: boolean;
  message: string;
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
  impersonatedUser: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface StopImpersonationResponse {
  success: boolean;
  message: string;
}

export interface ImpersonationHistoryResponse {
  history: Array<{
    id: string;
    adminId: string;
    adminEmail: string;
    targetUserId: string;
    targetUserEmail: string;
    startedAt: Date;
    endedAt: Date | null;
    reason: string | null;
  }>;
}

export interface ImpersonationResponse {
  success: boolean;
  message: string;
  session?: ImpersonationSession;
  impersonatedUser?: {
    id: string;
    email: string;
    name: string | null;
  };
}
