/**
 * 组织管理 DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator";

/**
 * 创建组织请求
 */
export class CreateOrganizationDto {
  @ApiProperty({ description: "组织名称", example: "My Organization" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: "组织标识", example: "my-org" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "组织 Logo URL", example: "https://example.com/logo.png" })
  @IsUrl()
  @IsOptional()
  logo?: string;
}

/**
 * 更新组织请求
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: "组织名称" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "组织标识" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "组织 Logo URL" })
  @IsUrl()
  @IsOptional()
  logo?: string;
}

/**
 * 邀请成员请求
 */
export class InviteMemberDto {
  @ApiProperty({ description: "成员邮箱", example: "user@example.com" })
  @IsString()
  email!: string;

  @ApiProperty({ description: "成员角色", enum: ["member", "admin", "owner"], default: "member" })
  @IsEnum(["member", "admin", "owner"])
  role!: string;
}

/**
 * 更新成员角色请求
 */
export class UpdateMemberRoleDto {
  @ApiProperty({ description: "成员角色", enum: ["member", "admin", "owner"] })
  @IsEnum(["member", "admin", "owner"])
  role!: string;
}

/**
 * 组织响应
 */
export class OrganizationResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "组织信息" })
  organization!: {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    createdAt: Date;
  };
}

/**
 * 组织列表响应
 */
export class OrganizationListResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "组织列表" })
  organizations!: Array<{
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    createdAt: Date;
    memberId: string;
    role: string;
  }>;
}
