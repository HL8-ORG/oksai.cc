/**
 * 认证 DTO（数据传输对象）
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * 用户注册 DTO
 */
export class SignUpDto {
  @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;

  @ApiProperty({ description: "用户密码", example: "SecurePass123!" })
  @IsString()
  @MinLength(8, { message: "密码至少需要 8 个字符" })
  @MaxLength(128, { message: "密码不能超过 128 个字符" })
  password!: string;

  @ApiPropertyOptional({ description: "用户名称", example: "John Doe" })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "名称不能超过 100 个字符" })
  name?: string;

  @ApiPropertyOptional({ description: "用户名", example: "johndoe" })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "用户名不能超过 50 个字符" })
  username?: string;
}

/**
 * 用户登录 DTO
 */
export class SignInDto {
  @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;

  @ApiProperty({ description: "用户密码", example: "SecurePass123!" })
  @IsString()
  password!: string;
}

/**
 * 邮箱验证 DTO
 */
export class VerifyEmailDto {
  @ApiProperty({ description: "验证 Token" })
  @IsString()
  token!: string;
}

/**
 * 忘记密码 DTO
 */
export class ForgotPasswordDto {
  @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;
}

/**
 * 重置密码 DTO
 */
export class ResetPasswordDto {
  @ApiProperty({ description: "重置 Token" })
  @IsString()
  token!: string;

  @ApiProperty({ description: "新密码", example: "NewSecurePass123!" })
  @IsString()
  @MinLength(8, { message: "密码至少需要 8 个字符" })
  @MaxLength(128, { message: "密码不能超过 128 个字符" })
  newPassword!: string;
}

/**
 * Magic Link 登录 DTO
 */
export class MagicLinkDto {
  @ApiProperty({ description: "用户邮箱", example: "user@example.com" })
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email!: string;
}

/**
 * OAuth Provider 状态
 */
export class OAuthProviderStatus {
  @ApiProperty({ description: "Provider 名称", example: "google" })
  provider!: string;

  @ApiProperty({ description: "是否启用", example: true })
  enabled!: boolean;

  @ApiProperty({ description: "回调 URL", example: "/api/auth/callback/google" })
  callbackURL!: string;
}

/**
 * 启用 2FA DTO
 */
export class EnableTwoFactorDto {
  @ApiProperty({ description: "用户当前密码" })
  @IsString()
  password!: string;
}

/**
 * 验证 2FA TOTP 代码 DTO
 */
export class VerifyTwoFactorDto {
  @ApiProperty({ description: "6 位 TOTP 验证码", example: "123456" })
  @IsString()
  @MinLength(6, { message: "验证码必须是 6 位" })
  @MaxLength(6, { message: "验证码必须是 6 位" })
  code!: string;

  @ApiPropertyOptional({ description: "是否信任此设备", default: false })
  @IsOptional()
  trustDevice?: boolean;
}

/**
 * 禁用 2FA DTO
 */
export class DisableTwoFactorDto {
  @ApiProperty({ description: "用户当前密码" })
  @IsString()
  password!: string;
}
