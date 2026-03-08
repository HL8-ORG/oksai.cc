import type { Result } from "@oksai/kernel";
import type { Tenant } from "./tenant.aggregate.js";

/**
 * Tenant 仓储接口
 *
 * 定义租户聚合根的持久化操作契约
 * 实现应在 infrastructure 层
 */
export interface ITenantRepository {
  /**
   * 根据 ID 查找租户
   */
  findById(id: string): Promise<Result<Tenant | null>>;

  /**
   * 根据 slug 查找租户
   */
  findBySlug(slug: string): Promise<Result<Tenant | null>>;

  /**
   * 根据所有者 ID 查找租户列表
   */
  findByOwnerId(ownerId: string): Promise<Result<Tenant[]>>;

  /**
   * 保存租户（新增或更新）
   */
  save(tenant: Tenant): Promise<Result<void>>;

  /**
   * 删除租户
   */
  delete(id: string): Promise<Result<void>>;
}
