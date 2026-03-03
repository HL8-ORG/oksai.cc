/**
 * 用户模拟 DTO
 */

import { IsNotEmpty, IsString } from "class-validator";

/**
 * 模拟用户请求
 */
export class ImpersonateUserDto {
  /**
   * 要模拟的目标用户 ID
   */
  @IsString()
  @IsNotEmpty()
  userId!: string;

  /**
   * 模拟原因（用于审计）
   */
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

/**
 * 模拟用户响应
 */
export interface ImpersonateUserResponse {
  success: boolean;
  message: string;
  impersonatedUser?: {
    id: string;
    email: string;
    name?: string;
  };
  session?: {
    id: string;
    token: string;
    expiresAt: Date;
  };
  impersonator?: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * 模拟会话信息
 */
export interface ImpersonationSession {
  impersonatorId: string;
  impersonatorEmail: string;
  impersonatorName?: string;
  targetUserId: string;
  targetUserEmail: string;
  targetUserName?: string;
  reason: string;
  startedAt: Date;
  sessionId: string;
}
