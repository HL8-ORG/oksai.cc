/**
 * 租户管理 API 客户端
 */

import type {
  CreateTenantDto,
  TenantListResponse,
  TenantResponse,
  TenantUsageDetailResponse,
  UpdateTenantDto,
} from "./tenant.types";

const API_BASE = "/api/admin/tenants";

/**
 * 获取租户列表
 */
export async function getTenants(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: string;
}): Promise<TenantListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.plan) searchParams.set("plan", params.plan);

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("获取租户列表失败");
  }

  return response.json();
}

/**
 * 获取租户详情
 */
export async function getTenant(id: string): Promise<TenantResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("获取租户详情失败");
  }

  return response.json();
}

/**
 * 创建租户
 */
export async function createTenant(data: CreateTenantDto): Promise<TenantResponse> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("创建租户失败");
  }

  return response.json();
}

/**
 * 更新租户
 */
export async function updateTenant(id: string, data: UpdateTenantDto): Promise<TenantResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("更新租户失败");
  }

  return response.json();
}

/**
 * 激活租户
 */
export async function activateTenant(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/${id}/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("激活租户失败");
  }

  return response.json();
}

/**
 * 停用租户
 */
export async function suspendTenant(
  id: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/${id}/suspend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error("停用租户失败");
  }

  return response.json();
}

/**
 * 获取租户使用情况
 */
export async function getTenantUsage(id: string): Promise<TenantUsageDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}/usage`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("获取租户使用情况失败");
  }

  return response.json();
}
