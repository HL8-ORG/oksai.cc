/**
 * Better Auth API 完整类型定义
 *
 * @description
 * 整合所有 Better Auth 插件的类型定义，提供完整的 API 类型支持
 */

import type { AdminAPI } from "./admin.types.js";
import type { ApiKeyAPI } from "./api-key.types.js";
import type { BaseAuthAPI } from "./auth.types.js";
import type { ImpersonationAPI } from "./impersonation.types.js";
import type { SessionAPI } from "./session.types.js";

/**
 * 完整的 Better Auth API 类型
 *
 * 包含所有插件的 API 方法
 */
export interface BetterAuthAPI extends BaseAuthAPI {
  // Admin 插件
  listUsers: AdminAPI["listUsers"];
  getUser: AdminAPI["getUser"];
  createUser: AdminAPI["createUser"];
  updateUser: AdminAPI["updateUser"];
  removeUser: AdminAPI["removeUser"];
  setRole: AdminAPI["setRole"];
  userHasPermission: AdminAPI["userHasPermission"];
  banUser: AdminAPI["banUser"];
  unbanUser: AdminAPI["unbanUser"];
  listUserSessions: AdminAPI["listUserSessions"];
  revokeUserSession: AdminAPI["revokeUserSession"];
  impersonateUser: AdminAPI["impersonateUser"];
  stopImpersonating: AdminAPI["stopImpersonating"];

  // API Key 插件
  createApiKey: ApiKeyAPI["createApiKey"];
  listApiKeys: ApiKeyAPI["listApiKeys"];
  getApiKey: ApiKeyAPI["getApiKey"];
  updateApiKey: ApiKeyAPI["updateApiKey"];
  deleteApiKey: ApiKeyAPI["deleteApiKey"];
  verifyApiKey: ApiKeyAPI["verifyApiKey"];

  // Session 插件
  listActiveSessions: SessionAPI["listActiveSessions"];
  getSessionConfig: SessionAPI["getSessionConfig"];
  updateSessionConfig: SessionAPI["updateSessionConfig"];
  revokeSession: SessionAPI["revokeSession"];
  revokeAllSessions: SessionAPI["revokeAllSessions"];

  // Impersonation 插件
  impersonateUserImpersonation: ImpersonationAPI["impersonateUser"];
  stopImpersonatingImpersonation: ImpersonationAPI["stopImpersonating"];
  getImpersonationHistoryImpersonation: ImpersonationAPI["getImpersonationHistory"];
  getActiveImpersonationsImpersonation: ImpersonationAPI["getActiveImpersonations"];
}

/**
 * 类型守卫函数
 */
export function hasAdminAPI(api: any): api is BetterAuthAPI & AdminAPI {
  return typeof (api as any)?.listUsers === "function";
}

export function hasApiKeyAPI(api: any): api is BetterAuthAPI & ApiKeyAPI {
  return typeof (api as any)?.createApiKey === "function";
}

export function hasSessionAPI(api: any): api is BetterAuthAPI & SessionAPI {
  return typeof (api as any)?.listActiveSessions === "function";
}

export function hasImpersonationAPI(api: any): api is BetterAuthAPI & ImpersonationAPI {
  return typeof (api as any)?.impersonateUserImpersonation === "function";
}
