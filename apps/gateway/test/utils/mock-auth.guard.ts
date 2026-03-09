/**
 * Mock AuthGuard for E2E Tests
 *
 * 在测试环境中模拟认证，注入 mock session 到请求中
 */

import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { UserSession } from "@oksai/nestjs-better-auth";

/**
 * Mock AuthGuard - 用于测试环境
 *
 * 自动注入 mock session 到请求中，绕过真实的 Better Auth 认证
 */
@Injectable()
export class MockAuthGuard implements CanActivate {
  private mockSession: UserSession | null = null;

  /**
   * 设置 mock session
   */
  setMockSession(session: UserSession): void {
    this.mockSession = session;
  }

  /**
   * 清除 mock session
   */
  clearMockSession(): void {
    this.mockSession = null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 注入 mock session 到请求中
    if (this.mockSession) {
      request.session = this.mockSession;
      request.user = this.mockSession.user;
      console.log("[MockAuthGuard] Session injected:", {
        userId: this.mockSession.user.id,
        role: this.mockSession.user.role,
      });
    } else {
      console.log("[MockAuthGuard] WARNING: No mock session set!");
    }

    return true;
  }
}
