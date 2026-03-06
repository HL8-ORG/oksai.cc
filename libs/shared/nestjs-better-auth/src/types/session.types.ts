/**
 * Better Auth Session 管理插件 API 类型定义
 */

import type { BetterAuthRequestOptions } from "./base.types";
import type {
  SessionConfigResponse,
  SessionConfigUpdateResponse,
  SessionInfo,
  SessionListResponse,
} from "./responses/session.responses";

/**
 * Better Auth Session 管理插件 API 接口
 */
export interface SessionAPI {
  /**
   * 列出活跃会话
   */
  listActiveSessions: (
    options: BetterAuthRequestOptions & {
      query?: {
        userId?: string;
        currentSessionToken?: string;
      };
    }
  ) => Promise<SessionListResponse>;

  /**
   * 获取会话配置
   */
  getSessionConfig: (
    options: BetterAuthRequestOptions & {
      query?: {
        userId?: string;
      };
    }
  ) => Promise<SessionConfigResponse>;

  /**
   * 更新会话配置
   */
  updateSessionConfig: (
    options: BetterAuthRequestOptions & {
      body: {
        sessionTimeout?: number;
        allowConcurrentSessions?: boolean;
        maxConcurrentSessions?: number;
      };
    }
  ) => Promise<SessionConfigUpdateResponse>;

  /**
   * 撤销会话
   */
  revokeSession: (
    options: BetterAuthRequestOptions & {
      body: {
        sessionToken: string;
      };
    }
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * 撤销所有会话
   */
  revokeAllSessions: (
    options: BetterAuthRequestOptions & {
      body: {
        userId: string;
      };
    }
  ) => Promise<{ success: boolean; message: string }>;
}
