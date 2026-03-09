import { Injectable } from "@nestjs/common";
import type { AsyncLocalStorageProvider } from "@oksai/context";

export interface TenantContext {
  tenantId: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
}

/**
 * 租户上下文服务
 *
 * 管理当前请求的租户上下文信息。
 */
@Injectable()
export class TenantContextService {
  private readonly TENANT_CONTEXT_KEY = "tenantContext";

  constructor(private readonly provider: AsyncLocalStorageProvider) {}

  setTenantContext(context: TenantContext): void {
    const currentStore = this.provider.get() || {};
    this.provider.run({ ...currentStore, [this.TENANT_CONTEXT_KEY]: context } as any, () => {});
  }

  getTenantContext(): TenantContext | undefined {
    const store = this.provider.get() as any;
    return store?.[this.TENANT_CONTEXT_KEY];
  }

  getTenantId(): string | undefined {
    const context = this.getTenantContext();
    return context?.tenantId;
  }

  hasTenantContext(): boolean {
    return this.getTenantContext() !== undefined;
  }
}
