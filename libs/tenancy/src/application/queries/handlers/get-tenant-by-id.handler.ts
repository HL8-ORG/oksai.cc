import type { IQueryHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository, Tenant } from "../../../domain/index.js";
import { GetTenantByIdQuery } from "../get-tenant-by-id.query.js";

/**
 * 根据 ID 查询租户处理器
 */
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery, Result<Tenant | null, Error>> {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(query: GetTenantByIdQuery): Promise<Result<Tenant | null, Error>> {
    return this.tenantRepository.findById(query.tenantId);
  }
}
