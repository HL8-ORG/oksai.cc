import type { Tenant } from "../model/tenant.aggregate.js";

export interface ISpecification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: ISpecification<T>): ISpecification<T>;
  or(other: ISpecification<T>): ISpecification<T>;
  not(): ISpecification<T>;
}

export class ActiveTenantSpecification implements ISpecification<Tenant> {
  public isSatisfiedBy(candidate: Tenant): boolean {
    return candidate.status.value === "ACTIVE";
  }

  public and(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new AndSpecification(this, other);
  }

  public or(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new OrSpecification(this, other);
  }

  public not(): ISpecification<Tenant> {
    return new NotSpecification(this);
  }
}

class AndSpecification implements ISpecification<Tenant> {
  constructor(
    private readonly left: ISpecification<Tenant>,
    private readonly right: ISpecification<Tenant>
  ) {}

  public isSatisfiedBy(candidate: Tenant): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }

  public and(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new AndSpecification(this, other);
  }

  public or(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new OrSpecification(this, other);
  }

  public not(): ISpecification<Tenant> {
    return new NotSpecification(this);
  }
}

class OrSpecification implements ISpecification<Tenant> {
  constructor(
    private readonly left: ISpecification<Tenant>,
    private readonly right: ISpecification<Tenant>
  ) {}

  public isSatisfiedBy(candidate: Tenant): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }

  public and(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new AndSpecification(this, other);
  }

  public or(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new OrSpecification(this, other);
  }

  public not(): ISpecification<Tenant> {
    return new NotSpecification(this);
  }
}

class NotSpecification implements ISpecification<Tenant> {
  constructor(private readonly spec: ISpecification<Tenant>) {}

  public isSatisfiedBy(candidate: Tenant): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }

  public and(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new AndSpecification(this, other);
  }

  public or(other: ISpecification<Tenant>): ISpecification<Tenant> {
    return new OrSpecification(this, other);
  }

  public not(): ISpecification<Tenant> {
    return this.spec;
  }
}
