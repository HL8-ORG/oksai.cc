/**
 * 组织管理 DTO
 */

import { IsOptional, IsString, Length } from "class-validator";

/**
 * 创建组织请求
 */
export class CreateOrganizationDto {
  /**
   * 组织名称
   */
  @IsString()
  @Length(1, 100)
  name!: string;

  /**
   * 组织 Slug（URL 友好标识）
   */
  @IsString()
  @Length(1, 50)
  @IsOptional()
  slug?: string;

  /**
   * 组织 Logo URL
   */
  @IsString()
  @IsOptional()
  logo?: string;
}

/**
 * 更新组织请求
 */
export class UpdateOrganizationDto {
  /**
   * 组织名称
   */
  @IsString()
  @Length(1, 100)
  @IsOptional()
  name?: string;

  /**
   * 组织 Slug
   */
  @IsString()
  @Length(1, 50)
  @IsOptional()
  slug?: string;

  /**
   * 组织 Logo URL
   */
  @IsString()
  @IsOptional()
  logo?: string;
}

/**
 * 邀请成员请求
 */
export class InviteMemberDto {
  /**
   * 成员邮箱
   */
  @IsString()
  email!: string;

  /**
   * 成员角色
   */
  @IsString()
  role!: string;
}

/**
 * 更新成员角色请求
 */
export class UpdateMemberRoleDto {
  /**
   * 成员角色
   */
  @IsString()
  role!: string;
}

/**
 * 组织响应
 */
export interface OrganizationResponse {
  success: boolean;
  message: string;
  organization?: {
    id: string;
    name: string;
    slug?: string;
    logo?: string;
    createdAt: Date;
    memberId?: string;
    role?: string;
  };
}

/**
 * 组织列表响应
 */
export interface OrganizationListResponse {
  success: boolean;
  message: string;
  organizations: Array<{
    id: string;
    name: string;
    slug?: string;
    logo?: string;
    createdAt: Date;
    memberId?: string;
    role?: string;
    memberCount?: number;
  }>;
}

/**
 * 成员响应
 */
export interface MemberResponse {
  success: boolean;
  message: string;
  member?: {
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt: Date;
    user?: {
      id: string;
      email: string;
      name?: string;
      image?: string;
    };
  };
}

/**
 * 成员列表响应
 */
export interface MemberListResponse {
  success: boolean;
  message: string;
  members: Array<{
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt: Date;
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
    };
  }>;
}
