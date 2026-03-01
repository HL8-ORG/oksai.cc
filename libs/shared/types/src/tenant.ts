export type TenantPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: TenantPlan;
}

export interface UpdateTenantInput {
  name?: string;
  slug?: string;
  plan?: TenantPlan;
}
