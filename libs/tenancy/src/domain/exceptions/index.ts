export type TenantDomainErrorCode =
  | "TENANT_NOT_FOUND"
  | "TENANT_ALREADY_EXISTS"
  | "TENANT_SLUG_INVALID"
  | "TENANT_NAME_EMPTY"
  | "TENANT_QUOTA_EXCEEDED"
  | "TENANT_CANNOT_BE_ACTIVATED"
  | "TENANT_CANNOT_BE_SUSPENDED";

export class TenantDomainException extends Error {
  constructor(
    message: string,
    public readonly code: TenantDomainErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TenantDomainException";
  }
}
