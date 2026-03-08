/**
 * Better Auth 基础类型定义
 *
 * @description
 * 定义 Better Auth API 的基础类型和通用接口
 */

/**
 * Better Auth 请求选项
 */
export interface BetterAuthRequestOptions {
  body?: Record<string, any>;
  query?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * Better Auth 统一响应类型
 */
export interface BetterAuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * 搜索查询参数
 */
export interface SearchQuery extends PaginationQuery {
  searchValue?: string;
  searchField?: string;
  searchOperator?: "contains" | "startsWith" | "endsWith";
}

/**
 * 认证头信息
 */
export interface AuthHeaders {
  authorization: string;
  cookie?: string;
}
