/**
 * 租户状态值对象
 *
 * 表示租户的当前状态， 使用工厂方法创建。
 *
 * @example
 * ```typescript
 * const status = TenantStatus.active();
 * console.log(status.value); // "ACTIVE"
 * console.log(status.isActive()); // true
 * ```
 */
import { ValueObject } from "@oksai/domain-core";

/**
 * 租户状态值
 */
export type TenantStatusValue = "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";

/**
 * 租户状态属性
 */
export interface TenantStatusProps {
  value: TenantStatusValue;
}

/**
 * 租户状态值对象
 *
 * 不可变，使用工厂方法创建。
 */
export class TenantStatus extends ValueObject<TenantStatusProps> {
  /**
   * 获取状态值
   */
  get value(): TenantStatusValue {
    return this.props.value;
  }

  // ========== 状态检查方法 ==========

  /**
   * 是否为待审核状态
   */
  public isPending(): boolean {
    return this.props.value === "PENDING";
  }

  /**
   * 是否为活跃状态
   */
  public isActive(): boolean {
    return this.props.value === "ACTIVE";
  }

  /**
   * 是否为已停用状态
   */
  public isSuspended(): boolean {
    return this.props.value === "SUSPENDED";
  }

  /**
   * 是否为已删除状态
   */
  public isDeleted(): boolean {
    return this.props.value === "DELETED";
  }

  /**
   * 是否可以被激活（只有 PENDING 状态可以激活）
   */
  public canBeActivated(): boolean {
    return this.isPending();
  }

  /**
   * 是否可以被停用（只有 ACTIVE 状态可以停用）
   */
  public canBeSuspended(): boolean {
    return this.isActive();
  }

  /**
   * 是否可以被访问（只有 ACTIVE 状态可以访问系统）
   */
  public canBeAccessed(): boolean {
    return this.isActive();
  }

  /**
   * 获取状态的显示名称
   */
  public getDisplayName(): string {
    const names: Record<TenantStatusValue, string> = {
      PENDING: "待审核",
      ACTIVE: "活跃",
      SUSPENDED: "已停用",
      DELETED: "已删除",
    };
    return names[this.props.value];
  }

  // ========== 工厂方法 ==========

  /**
   * 创建待审核状态
   */
  public static pending(): TenantStatus {
    return new TenantStatus({ value: "PENDING" });
  }

  /**
   * 创建活跃状态
   */
  public static active(): TenantStatus {
    return new TenantStatus({ value: "ACTIVE" });
  }

  /**
   * 创建已停用状态
   */
  public static suspended(): TenantStatus {
    return new TenantStatus({ value: "SUSPENDED" });
  }

  /**
   * 创建已删除状态
   */
  public static deleted(): TenantStatus {
    return new TenantStatus({ value: "DELETED" });
  }
}
