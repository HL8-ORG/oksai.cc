/**
 * 认证 DTO（数据传输对象）
 */

import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * 用户注册 DTO
 */
export class SignUpDto {
  /**
   * 用户邮箱
   */
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;

  /**
   * 用户密码
   */
  @IsString()
  @MinLength(8, { message: "密码至少需要 8 个字符" })
  @MaxLength(128, { message: "密码不能超过 128 个字符" })
  password!: string;

  /**
   * 用户名称（可选）
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "名称不能超过 100 个字符" })
  name?: string;

  /**
   * 用户名（可选）
   */
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "用户名不能超过 50 个字符" })
  username?: string;
}

/**
 * 用户登录 DTO
 */
export class SignInDto {
  /**
   * 用户邮箱
   */
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;

  /**
   * 用户密码
   */
  @IsString()
  password!: string;
}

/**
 * 邮箱验证 DTO
 */
export class VerifyEmailDto {
  /**
   * 验证 Token
   */
  @IsString()
  token!: string;
}

/**
 * 忘记密码 DTO
 */
export class ForgotPasswordDto {
  /**
   * 用户邮箱
   */
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;
}

/**
 * 重置密码 DTO
 */
export class ResetPasswordDto {
  /**
   * 重置 Token
   */
  @IsString()
  token!: string;

  /**
   * 新密码
   */
  @IsString()
  @MinLength(8, { message: "密码至少需要 8 个字符" })
  @MaxLength(128, { message: "密码不能超过 128 个字符" })
  newPassword!: string;
}

/**
 * Magic Link 登录 DTO
 */
export class MagicLinkDto {
  /**
   * 用户邮箱
   */
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;
}

/**
 * OAuth Provider 响应
 */
export interface OAuthProviderStatus {
  provider: string;
  enabled: boolean;
  callbackURL: string;
}

/**
 * 启用 2FA DTO
 */
export class EnableTwoFactorDto {
  /**
   * 用户当前密码
   */
  @IsString()
  password!: string;
}

/**
 * 验证 2FA TOTP 代码 DTO
 */
export class VerifyTwoFactorDto {
  /**
   * 6 位 TOTP 验证码
   */
  @IsString()
  @MinLength(6, { message: "验证码必须是 6 位" })
  @MaxLength(6, { message: "验证码必须是 6 位" })
  code!: string;

  /**
   * 是否信任此设备（可选）
   */
  @IsOptional()
  trustDevice?: boolean;
}

/**
 * 禁用 2FA DTO
 */
export class DisableTwoFactorDto {
  /**
   * 用户当前密码
   */
  @IsString()
  password!: string;
}
