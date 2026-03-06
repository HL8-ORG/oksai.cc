/**
 * Better Auth 用户模拟插件 API 类型定义
 */

import type { BetterAuthRequestOptions } from "./base.types";
import type {
  ImpersonateUserResponse,
  ImpersonationHistoryResponse,
  ImpersonationSession,
  StopImpersonationResponse,
} from "./responses/impersonation.responses";

/**
 * Better Auth 用户模拟插件 API 接口
 */
export interface ImpersonationAPI {
  /**
   * 模拟用户
   */
  impersonateUser: (
    options: BetterAuthRequestOptions & {
      body: {
        email: string;
        reason?: string;
      };
    }
  ) => Promise<ImpersonateUserResponse>;

  /**
   * 停止模拟
   */
  stopImpersonating: (
    options: BetterAuthRequestOptions & {
      headers: {
        authorization: string;
      };
    }
  ) => Promise<StopImpersonationResponse>;

  /**
   * 获取模拟历史
   */
  getImpersonationHistory: (
    options: BetterAuthRequestOptions & {
      query?: {
        adminId?: string;
        targetUserId?: string;
        limit?: number;
        offset?: number;
      };
    }
  ) => Promise<ImpersonationHistoryResponse>;

  /**
   * 获取活跃模拟会话
   */
  getActiveImpersonations: (
    options: BetterAuthRequestOptions & {
      query?: {
        adminId?: string;
      };
    }
  ) => Promise<ImpersonationSession[]>;
}
