import type { EntityManager } from "@mikro-orm/core";
import { Result, UniqueEntityID } from "@oksai/domain-core";
import type { EventStorePort } from "@oksai/event-store";
import type { ITenantRepository } from "../../domain/index.js";
import { Tenant } from "../../domain/index.js";

/**
 * 租户仓储实现
 *
 * 实现 ITenantRepository 接口，自动处理：
 * - 实体持久化
 * - 领域事件发布
 * - 事件存储
 */
export class MikroOrmTenantRepository implements ITenantRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly eventStore: EventStorePort
  ) {}

  async findById(id: string): Promise<Result<Tenant | null>> {
    try {
      const tenant = await this.em.findOne(Tenant, {
        id: new UniqueEntityID(id),
      } as any);
      return Result.ok(tenant);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async save(tenant: Tenant): Promise<Result<void>> {
    try {
      this.em.persist(tenant);

      const events = tenant.domainEvents;
      if (events.length > 0) {
        await this.eventStore.append(tenant.id.toString(), events as any);
        tenant.clearDomainEvents();
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findBySlug(slug: string): Promise<Result<Tenant | null>> {
    try {
      const tenant = await this.em.findOne(Tenant, { slug });
      return Result.ok(tenant);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findByOwnerId(ownerId: string): Promise<Result<Tenant[]>> {
    try {
      const tenants = await this.em.find(Tenant, {
        ownerId: new UniqueEntityID(ownerId),
      } as any);
      return Result.ok(tenants);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const tenant = await this.em.findOne(Tenant, {
        id: new UniqueEntityID(id),
      } as any);
      if (tenant) {
        await this.em.removeAndFlush(tenant);
      }
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.em.count(Tenant, { slug });
    return count > 0;
  }
}
