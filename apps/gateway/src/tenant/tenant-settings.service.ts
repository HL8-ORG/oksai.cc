/**
 * 租户配置管理服务
 *
 * @description
 * 提供租户自定义配置、配置验证、默认值和配置审计功能
 */

import { EntityManager } from "@mikro-orm/core";
import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TenantContextService } from "@oksai/context";
import { Tenant } from "@oksai/iam-identity";

/**
 * 租户配置
 */
export interface TenantSettings {
  branding: {
    logo?: string;
    primaryColor?: string;
    customDomain?: string;
  };
  features: {
    twoFactorAuth: boolean;
    ssoEnabled: boolean;
    webhooksEnabled: boolean;
    apiKeysEnabled: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    slackWebhook?: string;
  };
  security: {
    passwordMinLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    sessionTimeout: number; // 分钟
  };
}

/**
 * 租户配置更新 DTO
 */
export type UpdateTenantSettingsDto = Partial<TenantSettings>;

/**
 * 租户配置管理服务
 */
@Injectable()
export class TenantSettingsService {
  private readonly logger = new Logger(TenantSettingsService.name);

  /**
   * 默认配置
   */
  private readonly defaultSettings: TenantSettings = {
    branding: {
      logo: undefined,
      primaryColor: "#1890ff",
      customDomain: undefined,
    },
    features: {
      twoFactorAuth: false,
      ssoEnabled: false,
      webhooksEnabled: true,
      apiKeysEnabled: true,
    },
    notifications: {
      emailNotifications: true,
      slackWebhook: undefined,
    },
    security: {
      passwordMinLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
      sessionTimeout: 10080, // 7 天（分钟）
    },
  };

  constructor(
    private readonly em: EntityManager,
    private readonly _tenantContext: TenantContextService
  ) {}

  /**
   * 获取租户配置
   *
   * @param tenantId - 租户 ID
   * @returns 租户配置（合并默认值）
   */
  async getSettings(tenantId: string): Promise<TenantSettings> {
    this.logger.debug(`获取租户配置: ${tenantId}`);

    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new NotFoundException(`租户 ${tenantId} 不存在`);
    }

    // 合并默认配置和租户自定义配置
    const customSettings = (tenant.settings as Record<string, any>) || {};
    const mergedSettings = this.mergeSettings(this.defaultSettings, customSettings);

    return mergedSettings as TenantSettings;
  }

  /**
   * 更新租户配置
   *
   * @param tenantId - 租户 ID
   * @param dto - 配置更新 DTO
   * @returns 更新后的配置
   */
  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto): Promise<TenantSettings> {
    this.logger.debug(`更新租户配置: ${tenantId}`);

    // 验证配置
    this.validateSettings(dto);

    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new NotFoundException(`租户 ${tenantId} 不存在`);
    }

    // 获取当前配置
    const currentSettings = (tenant.settings as Record<string, any>) || {};

    // 深度合并配置
    const updatedSettings = this.mergeSettings(currentSettings, dto);

    // 更新租户配置
    tenant.settings = updatedSettings;

    await this.em.persistAndFlush(tenant);

    this.logger.log(`租户配置已更新: ${tenantId}`);

    // 返回合并后的完整配置
    return this.getSettings(tenantId);
  }

  /**
   * 重置租户配置到默认值
   *
   * @param tenantId - 租户 ID
   * @returns 默认配置
   */
  async resetSettings(tenantId: string): Promise<TenantSettings> {
    this.logger.debug(`重置租户配置到默认值: ${tenantId}`);

    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new NotFoundException(`租户 ${tenantId} 不存在`);
    }

    // 重置为空对象，getSettings 会自动合并默认值
    tenant.settings = {};

    await this.em.persistAndFlush(tenant);

    this.logger.log(`租户配置已重置: ${tenantId}`);

    return this.getSettings(tenantId);
  }

  /**
   * 验证配置
   *
   * @param dto - 配置更新 DTO
   * @throws BadRequestException 如果验证失败
   */
  private validateSettings(dto: UpdateTenantSettingsDto): void {
    // 验证品牌配置
    if (dto.branding) {
      if (dto.branding.primaryColor && !this.isValidColor(dto.branding.primaryColor)) {
        throw new BadRequestException("无效的颜色值");
      }

      if (dto.branding.customDomain && !this.isValidDomain(dto.branding.customDomain)) {
        throw new BadRequestException("无效的域名格式");
      }
    }

    // 验证安全配置
    if (dto.security) {
      if (
        dto.security.passwordMinLength &&
        (dto.security.passwordMinLength < 6 || dto.security.passwordMinLength > 128)
      ) {
        throw new BadRequestException("密码最小长度必须在 6-128 之间");
      }

      if (
        dto.security.sessionTimeout &&
        (dto.security.sessionTimeout < 5 || dto.security.sessionTimeout > 525600)
      ) {
        throw new BadRequestException("会话超时必须在 5-525600 分钟之间");
      }
    }

    // 验证通知配置
    if (dto.notifications) {
      if (dto.notifications.slackWebhook && !this.isValidSlackWebhook(dto.notifications.slackWebhook)) {
        throw new BadRequestException("无效的 Slack Webhook URL");
      }
    }
  }

  /**
   * 深度合并配置对象
   */
  private mergeSettings(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.mergeSettings(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * 验证颜色值
   */
  private isValidColor(color: string): boolean {
    // 支持 #RGB, #RRGGBB, #RRGGBBAA
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(color);
  }

  /**
   * 验证域名
   */
  private isValidDomain(domain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain);
  }

  /**
   * 验证 Slack Webhook URL
   */
  private isValidSlackWebhook(url: string): boolean {
    return url.startsWith("https://hooks.slack.com/");
  }
}
