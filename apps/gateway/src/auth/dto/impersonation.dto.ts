/**
 * 用户模拟 DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

/**
 * 模拟用户请求
 */
export class ImpersonateUserDto {
  @ApiProperty({ description: "目标用户邮箱" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "模拟原因" })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * 模拟用户会话
 */
export interface ImpersonationSession {
  id: string;
  userId: string;
  impersonatorId: string;
  impersonatorEmail: string;
  targetUserEmail: string;
  startedAt: Date;
  expiresAt: Date;
  reason?: string;
}

/**
 * 模拟用户响应
 */
export class ImpersonationUserResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "模拟会话信息" })
  session!: {
    id: string;
    token: string;
    expiresAt: Date;
  };

  @ApiProperty({ description: "被模拟用户信息" })
  impersonatedUser!: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 模拟用户响应
 */
export class ImpersonationResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "模拟会话信息" })
  session!: {
    id: string;
    token: string;
    expiresAt: Date;
  };

  @ApiProperty({ description: "被模拟用户信息" })
  impersonatedUser!: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 停止模拟响应
 */
export class StopImpersonationResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;
}

/**
 * 模拟历史记录
 */
export class ImpersonationHistoryResponse {
  @ApiProperty({ description: "历史记录列表" })
  history!: Array<{
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
