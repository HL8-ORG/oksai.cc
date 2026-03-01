import type { TenantPlan } from './tenant';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
  image: string | null;
  tenantId: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  tenantId: string;
  role?: UserRole;
  image?: string;
}

export interface UpdateUserInput {
  name?: string;
  image?: string;
  role?: UserRole;
  mfaEnabled?: boolean;
}

export interface UserWithTenant extends User {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: TenantPlan;
  };
}
