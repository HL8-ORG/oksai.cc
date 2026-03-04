/**
 * @description 租户 API 契约
 *
 * 定义租户相关的 API 接口规范
 *
 * @module @oksai/constants/contracts/api/tenant
 */

// ============ 路由常量 ============

/**
 * @description 租户 API 路由前缀
 */
export const TENANT_API_PREFIX = "/tenants";

/**
 * @description 租户 API 端点
 */
export const TENANT_API_ENDPOINTS = {
  /** 列表查询 */
  LIST: "/",
  /** 单个查询 */
  GET: "/:id",
  /** 创建租户 */
  CREATE: "/",
  /** 更新租户 */
  UPDATE: "/:id",
  /** 删除租户 */
  DELETE: "/:id",
  /** 租户设置 */
  SETTINGS: "/:id/settings",
  /** 租户成员 */
  MEMBERS: "/:id/members",
  /** 邀请成员 */
  INVITE: "/:id/invite",
} as const;

// ============ 请求 DTO ============

/**
 * @description 创建租户请求 DTO
 */
export interface CreateTenantRequest {
  /** 租户名称 */
  name: string;
  /** 租户标识（唯一） */
  slug: string;
  /** 租户描述 */
  description?: string;
  /** 租户 Logo URL */
  logoUrl?: string;
  /** 租户计划 */
  plan?: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
}

/**
 * @description 更新租户请求 DTO
 */
export interface UpdateTenantRequest {
  /** 租户名称 */
  name?: string;
  /** 租户描述 */
  description?: string;
  /** 租户 Logo URL */
  logoUrl?: string;
  /** 租户设置 */
  settings?: TenantSettings;
}

/**
 * @description 租户设置
 */
export interface TenantSettings {
  /** 是否启用双因素认证 */
  enableMFA?: boolean;
  /** 是否启用 SSO */
  enableSSO?: boolean;
  /** 允许的邮箱域名 */
  allowedEmailDomains?: string[];
  /** 会话超时（分钟） */
  sessionTimeout?: number;
  /** 最大成员数 */
  maxMembers?: number;
}

// ============ 响应 DTO ============

/**
 * @description 租户响应 DTO
 */
export interface TenantResponse {
  /** 租户 ID */
  id: string;
  /** 租户名称 */
  name: string;
  /** 租户标识 */
  slug: string;
  /** 租户描述 */
  description: string | null;
  /** 租户 Logo URL */
  logoUrl: string | null;
  /** 租户计划 */
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  /** 租户设置 */
  settings: TenantSettings;
  /** 成员数量 */
  membersCount: number;
  /** 是否激活 */
  isActive: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * @description 租户列表响应 DTO
 */
export interface TenantListResponse {
  /** 租户列表 */
  items: TenantResponse[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}
