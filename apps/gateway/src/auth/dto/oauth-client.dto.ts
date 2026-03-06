/**
 * OAuth Client DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from "class-validator";

/**
 * 创建 OAuth 客户端请求
 */
export class CreateOAuthClientDto {
  @ApiProperty({ description: "客户端名称", example: "My OAuth App" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "回调 URI 列表", type: [String], example: ["http://localhost:3000/callback"] })
  @IsArray()
  @IsUrl({}, { each: true })
  redirectUris!: string[];

  @ApiPropertyOptional({ description: "允许的权限范围", type: [String], example: ["read", "write"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedScopes?: string[];

  @ApiPropertyOptional({
    description: "客户端类型",
    enum: ["public", "confidential"],
    default: "confidential",
  })
  @IsEnum(["public", "confidential"])
  @IsOptional()
  clientType?: string;

  @ApiPropertyOptional({ description: "描述" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "主页 URL" })
  @IsUrl()
  @IsOptional()
  homepageUrl?: string;

  @ApiPropertyOptional({ description: "Logo URL" })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}

/**
 * 更新 OAuth 客户端请求
 */
export class UpdateOAuthClientDto {
  @ApiPropertyOptional({ description: "客户端名称" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "回调 URI 列表", type: [String] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  redirectUris?: string[];

  @ApiPropertyOptional({ description: "允许的权限范围", type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedScopes?: string[];

  @ApiPropertyOptional({ description: "描述" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "主页 URL" })
  @IsUrl()
  @IsOptional()
  homepageUrl?: string;

  @ApiPropertyOptional({ description: "Logo URL" })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ description: "是否激活" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * OAuth 客户端响应
 */
export class OAuthClientResponse {
  @ApiProperty({ description: "客户端 ID" })
  id!: string;

  @ApiProperty({ description: "客户端标识符" })
  clientId!: string;

  @ApiPropertyOptional({ description: "客户端密钥（仅创建时返回）", nullable: true })
  clientSecret!: string | null;

  @ApiProperty({ description: "名称" })
  name!: string;

  @ApiPropertyOptional({ description: "描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "回调 URI 列表", type: [String] })
  redirectUris!: string[];

  @ApiPropertyOptional({ description: "允许的权限范围", type: [String], nullable: true })
  allowedScopes!: string[] | null;

  @ApiProperty({ description: "客户端类型", enum: ["public", "confidential"] })
  clientType!: string;

  @ApiPropertyOptional({ description: "主页 URL", nullable: true })
  homepageUrl!: string | null;

  @ApiPropertyOptional({ description: "Logo URL", nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ description: "是否激活" })
  isActive!: boolean;

  @ApiPropertyOptional({ description: "创建者 ID", nullable: true })
  createdBy!: string | null;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

/**
 * OAuth 客户端创建响应
 */
export class OAuthClientCreatedResponse extends OAuthClientResponse {
  @ApiProperty({ description: "客户端密钥（仅创建时返回）" })
  declare clientSecret: string;
}

/**
 * 旋转客户端密钥响应
 */
export class RotateClientSecretResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "新的客户端密钥" })
  clientSecret!: string;
}

/**
 * OAuth 客户端列表响应
 */
export class OAuthClientListResponse {
  @ApiProperty({ description: "客户端列表", type: [OAuthClientResponse] })
  clients!: OAuthClientResponse[];

  @ApiProperty({ description: "总数" })
  total!: number;
}
