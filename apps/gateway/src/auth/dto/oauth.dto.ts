/**
 * OAuth DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from "class-validator";

/**
 * 注册 OAuth 客户端请求
 */
export class RegisterOAuthClientDto {
  @ApiProperty({ description: "客户端名称", example: "My App" })
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
