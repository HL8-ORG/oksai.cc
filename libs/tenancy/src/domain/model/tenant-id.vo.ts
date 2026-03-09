import { ValueObject } from "@oksai/domain-core";

export interface TenantIdProps {
  value: string;
}

export class TenantId extends ValueObject<TenantIdProps> {
  get value(): string {
    return this.props.value;
  }

  public override equals(other?: TenantId): boolean {
    if (!other) {
      return false;
    }
    return this.props.value === other.props.value;
  }

  public override toString(): string {
    return this.props.value;
  }

  public static create(value: string): TenantId {
    if (!value || value.trim().length === 0) {
      throw new Error("租户 ID 不能为空");
    }
    return new TenantId({ value: value.trim() });
  }
}
