/**
 * 创建租户请求 DTO
 */

export interface CreateTenantRequestDto {
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  ownerId: string;
  metadata?: Record<string, unknown>;
}

/**
 * 创建租户响应 DTO
 */
export interface CreateTenantResponseDto {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: Date;
}
