import type { UserRole } from "./user";

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  tenantId: string;
  userId: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  sessionId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface OAuthCallback {
  code: string;
  state?: string;
  provider: "github" | "google";
}

export interface MFASetup {
  secret: string;
  uri: string;
  backupCodes: string[];
}

export interface MFAVerify {
  code: string;
  trustDevice?: boolean;
}
