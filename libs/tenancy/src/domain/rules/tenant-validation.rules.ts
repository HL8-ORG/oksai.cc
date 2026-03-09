export interface IBusinessRule {
  readonly message: string;
  isBroken(): boolean;
}

export class TenantMustHaveNameRule implements IBusinessRule {
  constructor(private readonly name: string) {}

  get message(): string {
    return "租户名称不能为空";
  }

  public isBroken(): boolean {
    return !this.name || this.name.trim().length === 0;
  }
}

export class TenantMustHaveValidSlugRule implements IBusinessRule {
  private static readonly SLUG_REGEX = /^[a-z0-9-]+$/;
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 100;

  constructor(private readonly slug: string) {}

  get message(): string {
    return "slug 只能包含小写字母、数字和连字符，长度在 3-100 个字符之间";
  }

  public isBroken(): boolean {
    if (!this.slug || this.slug.length < TenantMustHaveValidSlugRule.MIN_LENGTH) {
      return true;
    }
    if (this.slug.length > TenantMustHaveValidSlugRule.MAX_LENGTH) {
      return true;
    }
    return !TenantMustHaveValidSlugRule.SLUG_REGEX.test(this.slug);
  }
}
