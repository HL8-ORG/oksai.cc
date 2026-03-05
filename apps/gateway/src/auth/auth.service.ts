/**
 * 认证服务
 */

import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
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
import { SessionService } from "./session.service";

/* biome-ignore lint/suspicious/noExplicitAny: Better Auth API 类型复杂,使用 any 简化集成 */
type BetterAuthParams = { body?: any; headers?: any };
/* biome-ignore lint/suspicious/noExplicitAny: Better Auth API 类型复杂,使用 any 简化集成 */
type BetterAuthResult = any;

/**
 * Better Auth API 类型
 *
 * 基于 Better Auth 实际 API 方法
 * @see https://github.com/better-auth/better-auth
 */
interface BetterAuthAPI {
  signUpEmail: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  signInEmail: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  verifyEmail: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  requestPasswordReset: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  resetPassword: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  getSession: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  signOut: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  signInSocial: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  sendVerificationEmail: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  enableTwoFactor: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  verifyTwoFactor: (params: BetterAuthParams) => Promise<BetterAuthResult>;
  disableTwoFactor: (params: BetterAuthParams) => Promise<BetterAuthResult>;
}

/**
 * 认证服务响应
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
  };
  session?: {
    id: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * 认证服务
 *
 * 提供用户注册、登录、邮箱验证、密码重置等功能
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authAPI: BetterAuthAPI;
  private readonly sessionService?: SessionService;

  constructor(authAPI: BetterAuthAPI, sessionService?: SessionService) {
    this.authAPI = authAPI;
    this.sessionService = sessionService;
  }

  /**
   * 用户注册
   */
  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    try {
      this.logger.log(`用户注册: ${dto.email}`);

      const result = await this.authAPI.signUpEmail({
        body: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },
      });

      if (!result) {
        throw new BadRequestException("注册失败");
      }

      this.logger.log(`用户注册成功: ${dto.email}`);

      return {
        success: true,
        message: "注册成功，请查收验证邮件",
        user: result.user,
      };
    } catch (error) {
      this.logger.error(`用户注册失败: ${dto.email}`, error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async signIn(dto: SignInDto): Promise<AuthResponse> {
    try {
      this.logger.log(`用户登录: ${dto.email}`);

      const result = await this.authAPI.signInEmail({
        body: {
          email: dto.email,
          password: dto.password,
        },
      });

      if (!result) {
        throw new UnauthorizedException("邮箱或密码错误");
      }

      this.logger.log(`用户登录成功: ${dto.email}`);

      // 处理并发登录控制
      if (this.sessionService && result.session?.token && result.user?.id) {
        const revokedCount = await this.sessionService.handleConcurrentSessions(
          result.user.id,
          result.session.token
        );
        if (revokedCount > 0) {
          this.logger.log(`已撤销 ${revokedCount} 个其他 Session（并发登录控制）`);
        }
      }

      return {
        success: true,
        message: "登录成功",
        user: result.user,
        session: result.session,
      };
    } catch (error) {
      this.logger.error(`用户登录失败: ${dto.email}`, error);
      throw error;
    }
  }

  /**
   * 邮箱验证
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
    try {
      this.logger.log(`邮箱验证: ${dto.token}`);

      const result = await this.authAPI.verifyEmail({
        body: {
          token: dto.token,
        },
      });

      if (!result) {
        throw new BadRequestException("验证失败，Token 无效或已过期");
      }

      this.logger.log(`邮箱验证成功`);

      return {
        success: true,
        message: "邮箱验证成功",
        user: result.user,
      };
    } catch (error) {
      this.logger.error(`邮箱验证失败`, error);
      throw error;
    }
  }

  /**
   * 忘记密码
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<AuthResponse> {
    try {
      this.logger.log(`忘记密码: ${dto.email}`);

      await this.authAPI.requestPasswordReset({
        body: {
          email: dto.email,
        },
      });

      this.logger.log(`密码重置邮件已发送: ${dto.email}`);

      return {
        success: true,
        message: "密码重置邮件已发送，请查收",
      };
    } catch (error) {
      this.logger.error(`忘记密码失败: ${dto.email}`, error);
      // 为了安全，即使用户不存在也返回成功
      return {
        success: true,
        message: "如果该邮箱已注册，您将收到密码重置邮件",
      };
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(dto: ResetPasswordDto): Promise<AuthResponse> {
    try {
      this.logger.log(`重置密码: ${dto.token}`);

      const result = await this.authAPI.resetPassword({
        body: {
          token: dto.token,
          newPassword: dto.newPassword,
        },
      });

      if (!result) {
        throw new BadRequestException("重置失败，Token 无效或已过期");
      }

      this.logger.log(`密码重置成功`);

      return {
        success: true,
        message: "密码重置成功，请使用新密码登录",
      };
    } catch (error) {
      this.logger.error(`重置密码失败`, error);
      throw error;
    }
  }

  /**
   * 获取当前用户会话
   */
  async getSession(token: string): Promise<AuthResponse> {
    try {
      const result = await this.authAPI.getSession({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!result) {
        throw new UnauthorizedException("未登录或会话已过期");
      }

      return {
        success: true,
        message: "获取会话成功",
        user: result.user,
        session: result.session,
      };
    } catch (error) {
      this.logger.error(`获取会话失败`, error);
      throw error;
    }
  }

  /**
   * 登出
   */
  async signOut(token: string): Promise<AuthResponse> {
    try {
      await this.authAPI.signOut({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      this.logger.log(`用户登出成功`);

      return {
        success: true,
        message: "登出成功",
      };
    } catch (error) {
      this.logger.error(`登出失败`, error);
      throw error;
    }
  }

  /**
   * 发送 Magic Link
   *
   * @description
   * Better Auth 通过 Email OTP 插件支持 Magic Link。
   * 当前实现使用 sendVerificationEmail 作为临时方案。
   * TODO: 集成 Better Auth Email OTP 插件后更新此方法
   */
  async sendMagicLink(dto: MagicLinkDto): Promise<AuthResponse> {
    try {
      this.logger.log(`发送 Magic Link: ${dto.email}`);

      // 临时方案：使用 sendVerificationEmail
      // Better Auth 的 Magic Link 需要 Email OTP 插件
      await this.authAPI.sendVerificationEmail({
        body: {
          email: dto.email,
        },
      });

      this.logger.log(`Magic Link 已发送: ${dto.email}`);

      return {
        success: true,
        message: "Magic Link 已发送到您的邮箱，请查收",
      };
    } catch (error) {
      this.logger.error(`发送 Magic Link 失败: ${dto.email}`, error);
      // 为了安全，即使失败也返回成功
      return {
        success: true,
        message: "如果该邮箱已注册，您将收到 Magic Link",
      };
    }
  }

  /**
   * 启用双因素认证
   *
   * @description
   * 启用 2FA，生成 TOTP secret 和 QR code。
   * 用户需要使用验证器 App 扫描 QR code，然后验证 6 位代码。
   */
  async enableTwoFactor(token: string, dto: EnableTwoFactorDto): Promise<AuthResponse> {
    try {
      this.logger.log(`启用双因素认证`);

      const result = await this.authAPI.enableTwoFactor({
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          password: dto.password,
        },
      });

      if (!result) {
        throw new BadRequestException("启用 2FA 失败");
      }

      this.logger.log(`双因素认证启用成功`);

      return {
        success: true,
        message: "双因素认证已启用",
        user: result.user,
      };
    } catch (error) {
      this.logger.error(`启用双因素认证失败`, error);
      throw error;
    }
  }

  /**
   * 验证双因素认证代码
   *
   * @description
   * 验证用户输入的 TOTP 验证码。
   * 如果验证成功，2FA 将正式启用。
   */
  async verifyTwoFactor(token: string, dto: VerifyTwoFactorDto): Promise<AuthResponse> {
    try {
      this.logger.log(`验证双因素认证代码`);

      const result = await this.authAPI.verifyTwoFactor({
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          code: dto.code,
          trustDevice: dto.trustDevice,
        },
      });

      if (!result) {
        throw new BadRequestException("验证码错误或已过期");
      }

      this.logger.log(`双因素认证验证成功`);

      return {
        success: true,
        message: "双因素认证验证成功",
        user: result.user,
      };
    } catch (error) {
      this.logger.error(`验证双因素认证代码失败`, error);
      throw error;
    }
  }

  /**
   * 禁用双因素认证
   *
   * @description
   * 禁用用户的 2FA 功能。需要用户密码验证。
   */
  async disableTwoFactor(token: string, dto: DisableTwoFactorDto): Promise<AuthResponse> {
    try {
      this.logger.log(`禁用双因素认证`);

      await this.authAPI.disableTwoFactor({
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          password: dto.password,
        },
      });

      this.logger.log(`双因素认证禁用成功`);

      return {
        success: true,
        message: "双因素认证已禁用",
      };
    } catch (error) {
      this.logger.error(`禁用双因素认证失败`, error);
      throw error;
    }
  }

  /**
   * 模拟用户（管理员功能）
   *
   * @description
   * 允许管理员以其他用户的身份登录，用于技术支持和调试
   * - 需要管理员权限
   * - 记录审计日志
   * - 创建模拟会话
   */
  async impersonateUser(
    adminUserId: string,
    dto: import("./impersonation.dto").ImpersonateUserDto
  ): Promise<import("./impersonation.dto").ImpersonateUserResponse> {
    try {
      this.logger.log(`管理员 ${adminUserId} 开始模拟用户 ${dto.userId}`);

      // TODO: 验证管理员权限
      // TODO: 获取目标用户信息
      // TODO: 创建模拟会话
      // TODO: 记录审计日志

      // 临时返回（待实现）
      return {
        success: false,
        message: "用户模拟功能正在开发中",
      };
    } catch (error) {
      this.logger.error(`模拟用户失败: ${dto.userId}`, error);
      throw error;
    }
  }

  /**
   * 停止模拟用户
   *
   * @description
   * 结束当前模拟会话，恢复到原始管理员身份
   */
  async stopImpersonation(sessionToken: string): Promise<AuthResponse> {
    try {
      this.logger.log(`停止模拟用户`);

      // TODO: 验证是否是模拟会话
      // TODO: 恢复到原始管理员会话
      // TODO: 记录审计日志

      return {
        success: false,
        message: "停止模拟功能正在开发中",
      };
    } catch (error) {
      this.logger.error(`停止模拟失败`, error);
      throw error;
    }
  }
}
