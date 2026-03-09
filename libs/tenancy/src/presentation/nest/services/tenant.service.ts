import { EntityManager } from "@mikro-orm/core";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Tenant } from "@oksai/iam-identity";

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: string;
  ownerId: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

export interface UpdateTenantDto {
  name?: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

@Injectable()
export class TenantService {
  constructor(private readonly em: EntityManager) {}

  async list(page = 1, limit = 20): Promise<{ data: Tenant[]; total: number }> {
    const [data, total] = await this.em.findAndCount(Tenant, {}, { limit, offset: (page - 1) * limit });
    return { data, total };
  }

  async getById(id: string): Promise<Tenant> {
    const tenant = await this.em.findOne(Tenant, { id } as any);
    if (!tenant) {
      throw new NotFoundException(`租户 ${id} 不存在`);
    }
    return tenant;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const tenant = new Tenant(dto.name, dto.plan, dto.slug, dto.ownerId);
    (tenant as any).maxOrganizations = dto.maxOrganizations ?? 1;
    (tenant as any).maxMembers = dto.maxMembers ?? 10;
    (tenant as any).maxStorage = dto.maxStorage ?? 1073741824;

    await this.em.persistAndFlush(tenant);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.getById(id);

    if (dto.name) {
      (tenant as any).name = dto.name;
    }
    if (dto.maxOrganizations !== undefined) {
      (tenant as any).maxOrganizations = dto.maxOrganizations;
    }
    if (dto.maxMembers !== undefined) {
      (tenant as any).maxMembers = dto.maxMembers;
    }
    if (dto.maxStorage !== undefined) {
      (tenant as any).maxStorage = dto.maxStorage;
    }

    await this.em.flush();
    return tenant;
  }

  async activate(id: string): Promise<void> {
    const tenant = await this.getById(id);

    if ((tenant as any).status !== "pending") {
      throw new BadRequestException("只有待审核的租户才能激活");
    }

    (tenant as any).status = "active";
    await this.em.flush();
  }

  async suspend(id: string, reason: string): Promise<void> {
    const tenant = await this.getById(id);

    if ((tenant as any).status !== "active") {
      throw new BadRequestException("只有活跃的租户才能停用");
    }

    if (!reason) {
      throw new BadRequestException("停用原因不能为空");
    }

    (tenant as any).status = "suspended";
    (tenant as any).metadata = {
      ...(tenant as any).metadata,
      suspensionReason: reason,
      suspendedAt: new Date(),
    } as Record<string, unknown>;

    await this.em.flush();
  }

  async getUsage(id: string): Promise<{ organizations: number; members: number; storage: number }> {
    const tenant = await this.getById(id);
    return {
      organizations: (tenant as any).maxOrganizations,
      members: (tenant as any).maxMembers,
      storage: (tenant as any).maxStorage,
    };
  }
}
