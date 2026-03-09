/**
 * 租户管理服务
 *
 * 提供租户的 CRUD 操作、激活、停用和配额检查功能。
 */

import { EntityManager } from "@mikro-orm/core";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Tenant } from "@oksai/iam-identity";

/**
 * 创建租户 DTO
 */
export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  ownerId: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

/**
 * 更新租户 DTO
 */
export interface UpdateTenantDto {
  name?: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

/**
 * 租户使用情况
 */
export interface TenantUsage {
  organizations: number;
  members: number;
  storage: number;
}

/**
 * 租户管理服务
 */
@Injectable()
export class TenantService {
  constructor(private readonly em: EntityManager) {}

  /**
   * 创建租户
   *
   * @param dto - 创建租户参数
   * @returns 创建的租户
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    // 1. 验证 slug 是否已存在
    const existing = await this.em.findOne(Tenant, { slug: dto.slug });
    if (existing) {
      throw new BadRequestException(`租户 slug "${dto.slug}" 已存在`);
    }

    // 2. 使用 Tenant 构造函数创建实体（以正确初始化领域事件）
    const tenant = new Tenant(dto.name, dto.plan, dto.slug, dto.ownerId);

    // 设置配额相关属性（使用默认值或 DTO 中提供的值）
    tenant.maxOrganizations = dto.maxOrganizations ?? 1;
    tenant.maxMembers = dto.maxMembers ?? 10;
    tenant.maxStorage = dto.maxStorage ?? 1073741824; // 1GB

    // 3. 保存到数据库
    await this.em.persistAndFlush(tenant);

    return tenant;
  }

  /**
   * 根据 ID 查询租户
   *
   * @param id - 租户 ID
   * @returns 租户实体
   */
  async getById(id: string): Promise<Tenant> {
    const tenant = await this.em.findOne(Tenant, { id });

    if (!tenant) {
      throw new NotFoundException(`租户 ${id} 不存在`);
    }

    return tenant;
  }

  /**
   * 根据 slug 查询租户
   *
   * @param slug - 租户 slug
   * @returns 租户实体或 null
   */
  async getBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.em.findOne(Tenant, { slug });
    return tenant;
  }

  /**
   * 列出所有租户
   *
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 租户列表
   */
  async list(page = 1, limit = 20): Promise<{ data: Tenant[]; total: number }> {
    const [data, total] = await this.em.findAndCount(
      Tenant,
      {},
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: "DESC" },
      }
    );

    return { data, total };
  }

  /**
   * 更新租户
   *
   * @param id - 租户 ID
   * @param dto - 更新参数
   * @returns 更新后的租户
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.getById(id);

    // 更新字段
    if (dto.name) tenant.name = dto.name;
    if (dto.maxOrganizations !== undefined) tenant.maxOrganizations = dto.maxOrganizations;
    if (dto.maxMembers !== undefined) tenant.maxMembers = dto.maxMembers;
    if (dto.maxStorage !== undefined) tenant.maxStorage = dto.maxStorage;

    await this.em.flush();

    return tenant;
  }

  /**
   * 激活租户
   *
   * @param id - 租户 ID
   */
  async activate(id: string): Promise<void> {
    const tenant = await this.getById(id);

    // 检查状态
    if (tenant.status !== "pending") {
      throw new BadRequestException(`只有待审核的租户才能激活。当前状态：${tenant.status}`);
    }

    // 更新状态
    tenant.status = "active";
    await this.em.flush();
  }

  /**
   * 停用租户
   *
   * @param id - 租户 ID
   * @param reason - 停用原因
   */
  async suspend(id: string, reason: string): Promise<void> {
    const tenant = await this.getById(id);

    // 检查状态
    if (tenant.status !== "active") {
      throw new BadRequestException(`只有活跃的租户才能停用。当前状态：${tenant.status}`);
    }

    // 更新状态和原因
    tenant.status = "suspended";
    tenant.metadata = {
      ...tenant.metadata,
      suspensionReason: reason,
      suspendedAt: new Date(),
    };

    await this.em.flush();
  }

  /**
   * 获取租户使用情况
   *
   * @param id - 租户 ID
   * @returns 使用情况
   */
  async getUsage(id: string): Promise<TenantUsage> {
    // 确保租户存在
    await this.getById(id);

    // TODO: 实际查询组织、成员和存储使用量
    // 这里需要根据实际的实体关系来实现
    return {
      organizations: 0,
      members: 0,
      storage: 0,
    };
  }

  /**
   * 检查配额
   *
   * @param id - 租户 ID
   * @param resource - 资源类型
   * @returns 是否在配额内
   */
  async checkQuota(id: string, resource: "organizations" | "members" | "storage"): Promise<boolean> {
    const tenant = await this.getById(id);
    const usage = await this.getUsage(id);

    const limits = {
      organizations: tenant.maxOrganizations,
      members: tenant.maxMembers,
      storage: tenant.maxStorage,
    };

    const limit = limits[resource];

    // -1 表示无限制
    if (limit === -1) {
      return true;
    }

    const currentUsage = usage[resource];
    return currentUsage < limit;
  }
}
