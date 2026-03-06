import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { SessionConfigResponse, SessionListResponse, UpdateSessionConfigDto } from "./dto";
import { SessionService } from "./session.service";

/**
 * Session 管理控制器
 *
 * @description
 * 提供 Session 管理、配置接口
 *
 * 所有接口需要用户认证（通过 Bearer Token）
 */
@ApiTags("会话管理")
@Controller("sessions")
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * 获取所有活跃 Session
   *
   * @description
   * 获取当前用户的所有活跃 Session（包括其他设备）
   *
   * @example
   * GET /api/sessions
   * Header: Authorization: Bearer <token>
   * Response: { success: true, sessions: [...], currentSessionId: "..." }
   */
  @Get()
  @ApiOperation({
    summary: "获取所有活跃 Session",
    description: "获取当前用户的所有活跃会话（包括其他设备）",
  })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({ status: 200, description: "成功", schema: { example: { success: true, sessions: [] } } })
  async listSessions(@Headers("authorization") _authorization: string): Promise<SessionListResponse> {
    // TODO: 从 token 中提取 userId 和 sessionToken
    const userId = "temp-user-id";
    const sessionToken = "temp-session-token";
    return this.sessionService.listActiveSessions(userId, sessionToken);
  }

  /**
   * 获取 Session 配置
   *
   * @description
   * 获取当前用户的 Session 超时配置
   *
   * @example
   * GET /api/sessions/config
   * Header: Authorization: Bearer <token>
   * Response: { success: true, sessionTimeout: 604800, sessionTimeoutDays: 7 }
   */
  @Get("config")
  @ApiOperation({ summary: "获取 Session 配置", description: "获取当前用户的会话超时配置" })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: { example: { success: true, sessionTimeout: 604800 } },
  })
  async getConfig(@Headers("authorization") _authorization: string): Promise<SessionConfigResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    return this.sessionService.getSessionConfig(userId);
  }

  /**
   * 更新 Session 配置
   *
   * @description
   * 更新当前用户的 Session 超时配置和并发登录设置
   *
   * @example
   * PUT /api/sessions/config
   * Header: Authorization: Bearer <token>
   * Body: { sessionTimeout: 86400, allowConcurrentSessions: false }
   * Response: { success: true, sessionTimeout: 86400, sessionTimeoutDays: 1, allowConcurrentSessions: false }
   */
  @Put("config")
  @ApiOperation({ summary: "更新 Session 配置", description: "更新当前用户的会话超时配置和并发登录设置" })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: { example: { success: true, sessionTimeout: 86400 } },
  })
  async updateConfig(
    @Headers("authorization") _authorization: string,
    @Body() dto: UpdateSessionConfigDto
  ): Promise<SessionConfigResponse> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    return this.sessionService.updateSessionConfig(userId, dto);
  }

  /**
   * 撤销指定 Session（登出特定设备）
   *
   * @description
   * 撤销指定的 Session，使其立即失效
   *
   * @example
   * DELETE /api/sessions/:id
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "Session 已撤销" }
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "撤销指定 Session", description: "撤销指定的会话，使其立即失效（登出特定设备）" })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: { example: { success: true, message: "Session 已撤销" } },
  })
  async revokeSession(
    @Headers("authorization") _authorization: string,
    @Param("id") sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: 从 token 中提取 userId
    const userId = "temp-user-id";
    await this.sessionService.revokeSession(userId, sessionId);
    return {
      success: true,
      message: "Session 已撤销",
    };
  }

  /**
   * 撤销所有其他 Session（登出其他设备）
   *
   * @description
   * 撤销除当前 Session 外的所有其他 Session
   *
   * @example
   * POST /api/sessions/revoke-others
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "已撤销 N 个其他 Session", count: N }
   */
  @Post("revoke-others")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "撤销所有其他 Session",
    description: "撤销除当前会话外的所有其他会话（登出其他设备）",
  })
  @ApiHeader({ name: "authorization", description: "Bearer Token", required: true })
  @ApiResponse({ status: 200, description: "成功", schema: { example: { success: true, count: 3 } } })
  async revokeOtherSessions(
    @Headers("authorization") _authorization: string
  ): Promise<{ success: boolean; message: string; count: number }> {
    // TODO: 从 token 中提取 userId 和 sessionToken
    const userId = "temp-user-id";
    const sessionToken = "temp-session-token";
    const count = await this.sessionService.revokeOtherSessions(userId, sessionToken);
    return {
      success: true,
      message: `已撤销 ${count} 个其他 Session`,
      count,
    };
  }
}
