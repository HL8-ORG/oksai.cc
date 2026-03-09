/**
 * 租户域名识别服务
 *
 * @description
 * 提供基于域名的租户识别功能：
 * - 子域名识别（tenant.app.com）
 * - 自定义域名识别（custom.com）
 * - 域名绑定验证
 */

import process from "node:process";
import { EntityManager } from "@mikro-orm/core";
import { Injectable, Logger } from "@nestjs/common";
import { Tenant } from "@oksai/iam-identity";

/**
 * 租户域名信息
 */
export interface TenantDomainInfo {
  tenantId: string;
  tenantSlug: string;
  domain: string;
  domainType: "subdomain" | "custom";
  isVerified: boolean;
}

/**
 * 域名绑定请求
 */
export interface BindDomainDto {
  tenantId: string;
  domain: string;
  domainType: "subdomain" | "custom";
}

/**
 * 租户域名识别服务
 */
@Injectable()
export class TenantDomainService {
  private readonly logger = new Logger(TenantDomainService.name);

  /**
   * 基础域名（用于子域名识别）
   * 例如：app.oksai.cc
   */
  private readonly baseDomain: string;

  constructor(private readonly em: EntityManager) {
    // 从环境变量读取基础域名
    this.baseDomain = process.env.BASE_DOMAIN || "app.oksai.cc";
  }

  /**
   * 从主机名识别租户
   *
   * @param hostname - 请求的主机名（例如：tenant.app.com 或 custom.com）
   * @returns 租户域名信息，如果无法识别则返回 null
   *
   * @example
   * ```typescript
   * // 子域名识别
   * const info = await service.identifyTenant('acme.app.oksai.cc');
   * // { tenantId: '...', tenantSlug: 'acme', domainType: 'subdomain' }
   *
   * // 自定义域名识别
   * const info = await service.identifyTenant('acme.com');
   * // { tenantId: '...', tenantSlug: 'acme', domainType: 'custom' }
   * ```
   */
  async identifyTenant(hostname: string): Promise<TenantDomainInfo | null> {
    this.logger.debug(`识别租户域名: ${hostname}`);

    // 1. 移除端口号
    const domain = hostname.split(":")[0].toLowerCase();

    // 2. 尝试子域名识别
    const subdomainInfo = await this.trySubdomainRecognition(domain);
    if (subdomainInfo) {
      return subdomainInfo;
    }

    // 3. 尝试自定义域名识别
    const customDomainInfo = await this.tryCustomDomainRecognition(domain);
    if (customDomainInfo) {
      return customDomainInfo;
    }

    this.logger.debug(`无法识别租户域名: ${hostname}`);
    return null;
  }

  /**
   * 绑定域名到租户
   *
   * @param dto - 域名绑定请求
   * @returns 绑定结果
   */
  async bindDomain(dto: BindDomainDto): Promise<TenantDomainInfo> {
    this.logger.log(`绑定域名: ${dto.domain} -> ${dto.tenantId}`);

    // 1. 验证租户是否存在
    const tenant = await this.em.findOne(Tenant, { id: dto.tenantId });
    if (!tenant) {
      throw new Error(`租户 ${dto.tenantId} 不存在`);
    }

    // 2. 验证域名格式
    if (!this.isValidDomain(dto.domain)) {
      throw new Error(`无效的域名格式: ${dto.domain}`);
    }

    // 3. 检查域名是否已被绑定
    const existingBinding = await this.findDomainBinding(dto.domain);
    if (existingBinding && existingBinding.tenantId !== dto.tenantId) {
      throw new Error(`域名 ${dto.domain} 已被其他租户绑定`);
    }

    // 4. 更新租户配置（保存域名信息）
    const settings = (tenant.settings as Record<string, any>) || {};
    settings.domain = {
      ...settings.domain,
      [dto.domainType]: dto.domain,
      verified: false,
    };
    tenant.settings = settings;

    await this.em.persistAndFlush(tenant);

    this.logger.log(`域名绑定成功: ${dto.domain}`);

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      domain: dto.domain,
      domainType: dto.domainType,
      isVerified: false,
    };
  }

  /**
   * 验证域名所有权
   *
   * @param tenantId - 租户 ID
   * @param domain - 域名
   * @returns 验证结果
   */
  async verifyDomain(tenantId: string, domain: string): Promise<boolean> {
    this.logger.log(`验证域名所有权: ${domain}`);

    // TODO: 实现实际的域名验证逻辑
    // 1. DNS TXT 记录验证
    // 2. 文件验证
    // 3. HTTP 响应头验证

    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new Error(`租户 ${tenantId} 不存在`);
    }

    // 更新验证状态
    const settings = (tenant.settings as Record<string, any>) || {};
    if (settings.domain) {
      settings.domain.verified = true;
      tenant.settings = settings;
      await this.em.persistAndFlush(tenant);
    }

    this.logger.log(`域名验证成功: ${domain}`);
    return true;
  }

  /**
   * 解绑域名
   *
   * @param tenantId - 租户 ID
   * @param domain - 域名
   */
  async unbindDomain(tenantId: string, domain: string): Promise<void> {
    this.logger.log(`解绑域名: ${domain}`);

    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new Error(`租户 ${tenantId} 不存在`);
    }

    // 移除域名配置
    const settings = (tenant.settings as Record<string, any>) || {};
    if (settings.domain) {
      if (settings.domain.subdomain === domain) {
        delete settings.domain.subdomain;
      }
      if (settings.domain.custom === domain) {
        delete settings.domain.custom;
      }
      tenant.settings = settings;
      await this.em.persistAndFlush(tenant);
    }

    this.logger.log(`域名解绑成功: ${domain}`);
  }

  /**
   * 获取租户的所有绑定域名
   *
   * @param tenantId - 租户 ID
   * @returns 域名列表
   */
  async getTenantDomains(tenantId: string): Promise<TenantDomainInfo[]> {
    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new Error(`租户 ${tenantId} 不存在`);
    }

    const domains: TenantDomainInfo[] = [];
    const settings = (tenant.settings as Record<string, any>) || {};

    if (settings.domain) {
      if (settings.domain.subdomain) {
        domains.push({
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          domain: settings.domain.subdomain,
          domainType: "subdomain",
          isVerified: settings.domain.verified ?? false,
        });
      }

      if (settings.domain.custom) {
        domains.push({
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          domain: settings.domain.custom,
          domainType: "custom",
          isVerified: settings.domain.verified ?? false,
        });
      }
    }

    return domains;
  }

  /**
   * 尝试子域名识别
   */
  private async trySubdomainRecognition(domain: string): Promise<TenantDomainInfo | null> {
    // 检查是否是基础域名的子域名
    if (!domain.endsWith(`.${this.baseDomain}`)) {
      return null;
    }

    // 提取子域名部分（例如：acme.app.oksai.cc -> acme）
    const subdomain = domain.replace(`.${this.baseDomain}`, "").split(".")[0];

    if (!subdomain || subdomain === "www") {
      return null;
    }

    // 根据子域名查找租户（使用 slug）
    const tenant = await this.em.findOne(Tenant, { slug: subdomain });
    if (!tenant) {
      return null;
    }

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      domain,
      domainType: "subdomain",
      isVerified: true, // 子域名默认已验证
    };
  }

  /**
   * 尝试自定义域名识别
   */
  private async tryCustomDomainRecognition(domain: string): Promise<TenantDomainInfo | null> {
    // 查找绑定此域名的租户
    const binding = await this.findDomainBinding(domain);
    if (!binding) {
      return null;
    }

    return binding;
  }

  /**
   * 查找域名绑定
   */
  private async findDomainBinding(domain: string): Promise<TenantDomainInfo | null> {
    // 查询所有租户，检查 domain 配置
    const tenants = await this.em.find(Tenant, {});

    for (const tenant of tenants) {
      const settings = (tenant.settings as Record<string, any>) || {};

      if (settings.domain) {
        if (settings.domain.subdomain === domain || settings.domain.custom === domain) {
          const domainType = settings.domain.subdomain === domain ? "subdomain" : "custom";

          return {
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            domain,
            domainType,
            isVerified: settings.domain.verified ?? false,
          };
        }
      }
    }

    return null;
  }

  /**
   * 验证域名格式
   */
  private isValidDomain(domain: string): boolean {
    // 简单的域名格式验证
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  }
}
