/**
 * @description 订单 API 契约
 *
 * 定义订单相关的 API 接口规范
 *
 * @module @oksai/constants/contracts/api/order
 */

// ============ 路由常量 ============

export const ORDER_API_PREFIX = "/orders";
export const ORDER_API_ENDPOINTS = {
  LIST: "/",
  GET: "/:id",
  CREATE: "/",
  UPDATE: "/:id",
  CANCEL: "/:id/cancel",
  REFUND: "/:id/refund",
} as const;

// ============ 状态常量 ============

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// ============ 请求/响应 DTO ============

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: string;
  notes?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
