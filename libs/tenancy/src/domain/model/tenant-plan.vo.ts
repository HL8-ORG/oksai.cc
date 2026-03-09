/**
 * 租户套餐值对象
 *
 * 表示租户的订阅套餐类型，支持不同级别的功能和配额。
 *
 * @example
 * ```typescript
 * const plan = TenantPlan.pro();
 * console.log(plan.value); // "PRO"
 * console.log(plan.supportsFeature('sso')); // true
 * ```
 */
import { Guard, Result, ValueObject } from "@oksai/domain-core";

/**
 * 租户套餐类型
 */
export type TenantPlanValue = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

/**
 * 租户套餐属性
 */
export interface TenantPlanProps {
  value: TenantPlanValue;
}

/**
 * 租户套餐值对象
 *
 * 不可变，通过工厂方法创建。
 */
export class TenantPlan extends ValueObject<TenantPlanProps> {
  /**
   * 获取套餐值
   */
  get value(): TenantPlanValue {
    return this.props.value;
  }

  /**
   * 检查是否支持某个功能
   *
   * @param feature - 功能名称
   * @returns 如果支持返回 true
   */
  public supportsFeature(feature: string): boolean {
    const featuresByPlan: Record<TenantPlanValue, string[]> = {
      FREE: ["basic_auth"],
      STARTER: ["basic_auth", "sso", "webhooks"],
      PRO: ["basic_auth", "sso", "webhooks", "api_access", "custom_domain"],
      ENTERPRISE: ["basic_auth", "sso", "webhooks", "api_access", "custom_domain", "sla", "support"],
    };

    return featuresByPlan[this.props.value].includes(feature);
  }

  /**
   * 比较套餐等级
   *
   * @param other - 要比较的套餐
   * @returns 如果当前套餐等级更高返回 true
   */
  public isHigherThan(other: TenantPlan): boolean {
    const levels: Record<TenantPlanValue, number> = {
      FREE: 0,
      STARTER: 1,
      PRO: 2,
      ENTERPRISE: 3,
    };

    return levels[this.props.value] > levels[other.value];
  }

  /**
   * 检查是否等于某个套餐
   *
   * @param plan - 套餐值
   * @returns 如果相等返回 true
   */
  public is(plan: TenantPlanValue): boolean {
    return this.props.value === plan;
  }

  /**
   * 获取套餐显示名称
   *
   * @returns 套餐显示名称
   */
  public getDisplayName(): string {
    const names: Record<TenantPlanValue, string> = {
      FREE: "免费版",
      STARTER: "入门版",
      PRO: "专业版",
      ENTERPRISE: "企业版",
    };

    return names[this.props.value];
  }

  /**
   * 创建租户套餐（工厂方法）
   *
   * @param value - 套餐值
   * @returns Result<TenantPlan, Error>
   */
  public static create(value: string): Result<TenantPlan, Error> {
    const validPlans: TenantPlanValue[] = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

    // 使用 Guard 验证
    const guardResult = Guard.againstEmpty("plan", value);
    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error?.message ?? "验证失败"));
    }

    if (!validPlans.includes(value as TenantPlanValue)) {
      return Result.fail(new Error(`无效的套餐类型: ${value}。支持的套餐：${validPlans.join(", ")}`));
    }

    return Result.ok(new TenantPlan({ value: value as TenantPlanValue }));
  }

  /**
   * 创建免费套餐
   */
  public static free(): TenantPlan {
    return new TenantPlan({ value: "FREE" });
  }

  /**
   * 创建入门套餐
   */
  public static starter(): TenantPlan {
    return new TenantPlan({ value: "STARTER" });
  }

  /**
   * 创建专业套餐
   */
  public static pro(): TenantPlan {
    return new TenantPlan({ value: "PRO" });
  }

  /**
   * 创建企业套餐
   */
  public static enterprise(): TenantPlan {
    return new TenantPlan({ value: "ENTERPRISE" });
  }
}
