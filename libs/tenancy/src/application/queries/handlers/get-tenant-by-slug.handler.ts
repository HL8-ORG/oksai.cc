import type { IQueryHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository, Tenant } from "../../../domain/index.js";
import { GetTenantBySlugQuery } from "../get-tenant-by-slug.query.js";

/**
 * GetTenantBySlug 查询处理器
 */
export class GetTenantBySlugHandler
  implements IQueryHandler<GetTenantBySlugQuery, Result<Tenant | null, Error>>
{
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(query: GetTenantBySlugQuery): Promise<Result<Tenant | null, Error>> {
    return this.tenantRepository.findBySlug(query.slug);
  }
}
