/**
 * Session 管理插件响应类型定义
 */

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  isCurrent?: boolean;
}

export interface SessionListResponse {
  success: boolean;
  message?: string;
  currentSessionId?: string | null;
  sessions: SessionInfo[];
}

export interface SessionConfigResponse {
  success: boolean;
  message: string;
  sessionTimeout: number;
  allowConcurrentSessions: boolean;
  maxConcurrentSessions: number;
}

export interface SessionConfigUpdateResponse {
  success: boolean;
  message: string;
  config: {
    sessionTimeout: number;
    allowConcurrentSessions: boolean;
    maxConcurrentSessions: number;
  };
}
