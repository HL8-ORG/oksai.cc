/**
 * @description 用户 API 契约
 *
 * 定义用户相关的 API 接口规范：
 * - 请求 DTO
 * - 响应 DTO
 * - 路由常量
 *
 * @module @oksai/constants/contracts/api/user
 */

// ============ 路由常量 ============

/**
 * @description 用户 API 路由前缀
 */
export const USER_API_PREFIX = "/users";

/**
 * @description 用户 API 端点
 */
export const USER_API_ENDPOINTS = {
  /** 列表查询 */
  LIST: "/",
  /** 单个查询 */
  GET: "/:id",
  /** 创建用户 */
  CREATE: "/",
  /** 更新用户 */
  UPDATE: "/:id",
  /** 删除用户 */
  DELETE: "/:id",
  /** 用户资料 */
  PROFILE: "/me/profile",
  /** 修改密码 */
  CHANGE_PASSWORD: "/me/password",
} as const;

// ============ 请求 DTO ============

/**
 * @description 创建用户请求 DTO
 */
export interface CreateUserRequest {
  /** 邮箱地址 */
  email: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 显示名称 */
  displayName?: string;
  /** 手机号 */
  phone?: string;
  /** 头像 URL */
  avatarUrl?: string;
}

/**
 * @description 更新用户请求 DTO
 */
export interface UpdateUserRequest {
  /** 显示名称 */
  displayName?: string;
  /** 手机号 */
  phone?: string;
  /** 头像 URL */
  avatarUrl?: string;
  /** 个人简介 */
  bio?: string;
}

/**
 * @description 用户查询参数 DTO
 */
export interface UserQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 搜索关键词 */
  search?: string;
  /** 用户角色 */
  role?: string;
  /** 排序字段 */
  sortBy?: "createdAt" | "updatedAt" | "username";
  /** 排序方向 */
  sortOrder?: "asc" | "desc";
}

// ============ 响应 DTO ============

/**
 * @description 用户响应 DTO
 */
export interface UserResponse {
  /** 用户 ID */
  id: string;
  /** 邮箱地址 */
  email: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName: string | null;
  /** 手机号 */
  phone: string | null;
  /** 头像 URL */
  avatarUrl: string | null;
  /** 个人简介 */
  bio: string | null;
  /** 用户角色 */
  role: string;
  /** 是否已验证邮箱 */
  emailVerified: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * @description 用户列表响应 DTO
 */
export interface UserListResponse {
  /** 用户列表 */
  items: UserResponse[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * @description 用户资料响应 DTO
 */
export interface UserProfileResponse extends UserResponse {
  /** 发布的文章数 */
  postsCount: number;
  /** 关注者数 */
  followersCount: number;
  /** 关注数 */
  followingCount: number;
}

// ============ 版本控制 ============

/**
 * @description 用户 API 版本
 */
export const USER_API_VERSION = "v1";

/**
 * @description 用户 API 版本前缀
 */
export const USER_API_VERSION_PREFIX = `/api/${USER_API_VERSION}${USER_API_PREFIX}`;
