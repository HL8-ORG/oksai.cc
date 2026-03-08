/**
 * 租户过滤器
 *
 * 自动为所有支持租户隔离的实体添加 WHERE tenantId = ? 过滤条件。
 * 这是多租户数据隔离的核心机制。
 *
 * @example
 * ```typescript
 * // 在 MikroORM 配置中启用
 * {
 *   filters: {
 *     tenant: TenantFilter,
 *   },
 * }
 *
 * // 查询时自动过滤
 * const users = await em.find(User, {}); // 自动添加 WHERE tenantId = ?
 * ```
 */
import { type EntityManager } from "@mikro-orm/core";
import type { TenantContext } from "@oksai/context";
import { AsyncLocalStorageProvider } from "@oksai/context";

/**
 * 租户过滤器定义
 *
 * 动态获取当前租户 ID 并添加过滤条件。
 */
export const TenantFilter = {
  name: "tenant",
  cond: (_args: any, _type: any, _em: EntityManager) => {
    try {
      // 从 AsyncLocalStorage 获取当前租户上下文
      const provider = new AsyncLocalStorageProvider();
      const tenantContext = provider.get() as TenantContext | undefined;
      const tenantId = tenantContext?.tenantId;

      if (!tenantId) {
        // 如果没有租户上下文，不应用过滤器
        // 这样超级管理员可以查询所有数据
        return {};
      }

      // 返回过滤条件
      return { tenantId };
    } catch {
      // 如果获取失败，不应用过滤器
      return {};
    }
  },
  default: true, // 默认启用
  entity: [
    "User",
    "Organization",
    "Webhook",
    "WebhookDelivery",
    "Session",
    "Account",
    "ApiKey",
    "OAuthClient",
    "OAuthAccessToken",
    "OAuthRefreshToken",
    "OAuthAuthorizationCode",
  ],
};

/**
 * 禁用租户过滤器的辅助函数
 *
 * 用于超级管理员操作或数据迁移场景。
 *
 * @example
 * ```typescript
 * await em.transactional(async (em) => {
 *   em.disableFilter('tenant');
 *   const allUsers = await em.find(User, {}); // 查询所有租户的用户
 *   return allUsers;
 * });
 * ```
 */
export function disableTenantFilter(em: any): void {
  (em as any).disableFilter("tenant");
}
// ... existing code ...
/**
 * 启用租户过滤器的辅助函数
 *
 * @example
 * ```typescript
 * await em.transactional(async (em) => {
 *   em.enableFilter('tenant');
 *   const tenantUsers = await em.find(User, {}); // 只查询当前租户的用户
 *   return tenantUsers;
 * });
 * ```
 */
export function enableTenantFilter(em: any): void {
  (em as any).enableFilter("tenant");
}
