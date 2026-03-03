/**
 * 认证控制器
 */

import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AllowAnonymous } from "@oksai/nestjs-better-auth";
import type {
  DisableTwoFactorDto,
  EnableTwoFactorDto,
  ForgotPasswordDto,
  MagicLinkDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
  VerifyTwoFactorDto,
} from "./auth.dto";
import type { AuthResponse, AuthService } from "./auth.service";

/**
 * 认证控制器
 *
 * 提供用户认证相关的 API 端点：
 * - POST /auth/sign-up/email - 邮箱注册
 * - POST /auth/sign-in/email - 邮箱登录
 * - POST /auth/verify-email - 邮箱验证
 * - POST /auth/forgot-password - 忘记密码
 * - POST /auth/reset-password - 重置密码
 * - GET /auth/session - 获取当前会话
 * - POST /auth/sign-out - 登出
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   *
   * @description
   * 使用邮箱和密码注册新用户。注册成功后会发送验证邮件。
   *
   * @example
   * POST /api/auth/sign-up/email
   * Body: { email: "user@example.com", password: "password123", name: "张三" }
   * Response: { success: true, message: "注册成功", user: {...} }
   */
  @Post("sign-up/email")
  @AllowAnonymous()
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(dto);
  }

  /**
   * 用户登录
   *
   * @description
   * 使用邮箱和密码登录。登录成功后返回用户信息和 Session Token。
   *
   * @example
   * POST /api/auth/sign-in/email
   * Body: { email: "user@example.com", password: "password123" }
   * Response: { success: true, message: "登录成功", user: {...}, session: {...} }
   */
  @Post("sign-in/email")
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto);
  }

  /**
   * 邮箱验证
   *
   * @description
   * 验证用户邮箱地址。用户点击邮件中的验证链接后调用此接口。
   *
   * @example
   * POST /api/auth/verify-email
   * Body: { token: "verification-token" }
   * Response: { success: true, message: "邮箱验证成功", user: {...} }
   */
  @Post("verify-email")
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<AuthResponse> {
    return this.authService.verifyEmail(dto);
  }

  /**
   * 忘记密码
   *
   * @description
   * 发送密码重置邮件。即使用户不存在也返回成功（安全考虑）。
   *
   * @example
   * POST /api/auth/forgot-password
   * Body: { email: "user@example.com" }
   * Response: { success: true, message: "密码重置邮件已发送" }
   */
  @Post("forgot-password")
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<AuthResponse> {
    return this.authService.forgotPassword(dto);
  }

  /**
   * 重置密码
   *
   * @description
   * 使用 Token 重置密码。用户点击邮件中的重置链接后调用此接口。
   *
   * @example
   * POST /api/auth/reset-password
   * Body: { token: "reset-token", newPassword: "newpassword123" }
   * Response: { success: true, message: "密码重置成功" }
   */
  @Post("reset-password")
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<AuthResponse> {
    return this.authService.resetPassword(dto);
  }

  /**
   * 获取当前会话
   *
   * @description
   * 获取当前已认证用户的会话信息。需要在 Header 中携带 Authorization Token。
   *
   * @example
   * GET /api/auth/session
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "获取会话成功", user: {...}, session: {...} }
   */
  @Get("session")
  @AllowAnonymous()
  async getSession(@Headers("authorization") authorization: string): Promise<AuthResponse> {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        message: "未提供认证 Token",
      };
    }
    return this.authService.getSession(token);
  }

  /**
   * 用户登出
   *
   * @description
   * 登出当前用户，使 Session Token 失效。
   *
   * @example
   * POST /api/auth/sign-out
   * Header: Authorization: Bearer <token>
   * Response: { success: true, message: "登出成功" }
   */
  @Post("sign-out")
  @HttpCode(HttpStatus.OK)
  async signOut(@Headers("authorization") authorization: string): Promise<AuthResponse> {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        message: "未提供认证 Token",
      };
    }
    return this.authService.signOut(token);
  }

  /**
   * Magic Link 登录
   *
   * @description
   * 发送 Magic Link 到用户邮箱，用户点击链接即可登录。
   *
   * @example
   * POST /api/auth/magic-link
   * Body: { email: "user@example.com" }
   * Response: { success: true, message: "Magic Link 已发送" }
   */
  @Post("magic-link")
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async sendMagicLink(@Body() dto: MagicLinkDto): Promise<AuthResponse> {
    return this.authService.sendMagicLink(dto);
  }

  /**
   * 启用双因素认证
   *
   * @description
   * 启用 2FA，生成 TOTP secret 和 QR code。
   * 用户需要使用验证器 App 扫描 QR code，然后验证 6 位代码。
   *
   * @example
   * POST /api/auth/2fa/enable
   * Header: Authorization: Bearer <token>
   * Body: { password: "currentPassword123" }
   * Response: { success: true, message: "双因素认证已启用", qrCode: "...", secret: "..." }
   */
  @Post("2fa/enable")
  @HttpCode(HttpStatus.OK)
  async enableTwoFactor(
    @Headers("authorization") authorization: string,
    @Body() dto: EnableTwoFactorDto
  ): Promise<AuthResponse> {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        message: "未提供认证 Token",
      };
    }
    return this.authService.enableTwoFactor(token, dto);
  }

  /**
   * 验证双因素认证代码
   *
   * @description
   * 验证用户输入的 TOTP 验证码。
   * 如果验证成功，2FA 将正式启用。
   *
   * @example
   * POST /api/auth/2fa/verify
   * Header: Authorization: Bearer <token>
   * Body: { code: "123456", trustDevice: true }
   * Response: { success: true, message: "双因素认证验证成功", backupCodes: [...] }
   */
  @Post("2fa/verify")
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(
    @Headers("authorization") authorization: string,
    @Body() dto: VerifyTwoFactorDto
  ): Promise<AuthResponse> {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        message: "未提供认证 Token",
      };
    }
    return this.authService.verifyTwoFactor(token, dto);
  }

  /**
   * 禁用双因素认证
   *
   * @description
   * 禁用用户的 2FA 功能。需要用户密码验证。
   *
   * @example
   * POST /api/auth/2fa/disable
   * Header: Authorization: Bearer <token>
   * Body: { password: "currentPassword123" }
   * Response: { success: true, message: "双因素认证已禁用" }
   */
  @Post("2fa/disable")
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(
    @Headers("authorization") authorization: string,
    @Body() dto: DisableTwoFactorDto
  ): Promise<AuthResponse> {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        message: "未提供认证 Token",
      };
    }
    return this.authService.disableTwoFactor(token, dto);
  }
}
