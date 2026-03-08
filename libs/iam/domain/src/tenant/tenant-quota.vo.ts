import { Guard, Result, ValueObject } from "@oksai/kernel";
import type { TenantPlan } from "./tenant-plan.vo.js";

/**
 * 租户配额属性
 */
export interface TenantQuotaProps {
  maxOrganizations: number; // 最大组织数，-1 表示无限制
  maxMembers: number; // 最大成员数，-1 表示无限制
  maxStorage: number; // 最大存储空间（字节），-1 表示无限制
}

/**
 * 租户配额值对象
 *
 * 不可变，所有操作返回新实例。
 */
export class TenantQuota extends ValueObject<TenantQuotaProps> {
  // ========== Getter 方法 ==========

  get maxOrganizations(): number {
    return this.props.maxOrganizations;
  }

  get maxMembers(): number {
    return this.props.maxMembers;
  }

  get maxStorage(): number {
    return this.props.maxStorage;
  }

  // ========== 业务方法 ==========

  /**
   * 检查是否在配额限制内
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 如果在限制内返回 true
   */
  public isWithinLimit(resource: "organizations" | "members" | "storage", currentUsage: number): boolean {
    const limits = {
      organizations: this.props.maxOrganizations,
      members: this.props.maxMembers,
      storage: this.props.maxStorage,
    };

    const limit = limits[resource];

    // -1 表示无限制
    if (limit === -1) {
      return true;
    }

    return currentUsage < limit;
  }

  /**
   * 检查是否已达到配额限制
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 如果已达到限制返回 true
   */
  public isAtLimit(resource: "organizations" | "members" | "storage", currentUsage: number): boolean {
    return !this.isWithinLimit(resource, currentUsage);
  }

  /**
   * 获取剩余配额
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 剩余配额，-1 表示无限制
   */
  public getRemaining(resource: "organizations" | "members" | "storage", currentUsage: number): number {
    const limits = {
      organizations: this.props.maxOrganizations,
      members: this.props.maxMembers,
      storage: this.props.maxStorage,
    };

    const limit = limits[resource];

    if (limit === -1) {
      return -1; // 无限制
    }

    return Math.max(0, limit - currentUsage);
  }

  /**
   * 增加配额（返回新实例）
   *
   * @param resource - 资源类型
   * @param amount - 增加数量
   * @returns 新的配额实例
   */
  public increase(resource: "organizations" | "members" | "storage", amount: number): TenantQuota {
    const newProps = { ...this.props };

    switch (resource) {
      case "organizations":
        newProps.maxOrganizations += amount;
        break;
      case "members":
        newProps.maxMembers += amount;
        break;
      case "storage":
        newProps.maxStorage += amount;
        break;
    }

    return new TenantQuota(newProps);
  }

  /**
   * 设置配额（返回新实例）
   *
   * @param resource - 资源类型
   * @param limit - 新的限制
   * @returns 新的配额实例
   */
  public setLimit(resource: "organizations" | "members" | "storage", limit: number): TenantQuota {
    const newProps = { ...this.props };

    switch (resource) {
      case "organizations":
        newProps.maxOrganizations = limit;
        break;
      case "members":
        newProps.maxMembers = limit;
        break;
      case "storage":
        newProps.maxStorage = limit;
        break;
    }

    return new TenantQuota(newProps);
  }

  /**
   * 检查是否有无限制配额
   */
  public isUnlimited(): boolean {
    return this.props.maxOrganizations === -1 && this.props.maxMembers === -1 && this.props.maxStorage === -1;
  }

  /**
   * 格式化为可读字符串
   */
  public override toString(): string {
    const formatBytes = (bytes: number): string => {
      if (bytes === -1) return "无限制";
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    return `组织: ${this.props.maxOrganizations === -1 ? "无限制" : this.props.maxOrganizations}, 成员: ${this.props.maxMembers === -1 ? "无限制" : this.props.maxMembers}, 存储: ${formatBytes(this.props.maxStorage)}`;
  }

  // ========== 工厂方法 ==========

  /**
   * 创建配额
   */
  public static create(props: TenantQuotaProps): Result<TenantQuota, Error> {
    const guardResult = Guard.combine([
      Guard.againstNull("maxOrganizations", props.maxOrganizations),
      Guard.againstNull("maxMembers", props.maxMembers),
      Guard.againstNull("maxStorage", props.maxStorage),
    ]);

    if (guardResult.isFail()) {
      const errorMessage = guardResult.error?.[0]?.message || "验证失败";
      return Result.fail(new Error(errorMessage));
    }

    // 验证配额值（-1 表示无限制，其他值必须 >= 0）
    if (props.maxOrganizations < -1 || props.maxMembers < -1 || props.maxStorage < -1) {
      return Result.fail(new Error("配额不能小于 -1（-1 表示无限制）"));
    }

    return Result.ok(new TenantQuota(props));
  }

  /**
   * 根据套餐创建默认配额
   */
  public static createForPlan(plan: TenantPlan): TenantQuota {
    const quotaMap: Record<string, TenantQuotaProps> = {
      FREE: { maxOrganizations: 1, maxMembers: 5, maxStorage: 1073741824 }, // 1GB
      STARTER: { maxOrganizations: 3, maxMembers: 20, maxStorage: 10737418240 }, // 10GB
      PRO: { maxOrganizations: 10, maxMembers: 100, maxStorage: 107374182400 }, // 100GB
      ENTERPRISE: { maxOrganizations: -1, maxMembers: -1, maxStorage: -1 }, // 无限制
    };

    return new TenantQuota(quotaMap[plan.value] || quotaMap.FREE);
  }

  /**
   * 创建无限制配额
   */
  public static unlimited(): TenantQuota {
    return new TenantQuota({
      maxOrganizations: -1,
      maxMembers: -1,
      maxStorage: -1,
    });
  }
}
