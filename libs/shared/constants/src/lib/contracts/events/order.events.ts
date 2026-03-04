/**
 * @description 订单事件契约
 *
 * @module @oksai/constants/contracts/events/order
 */

export const ORDER_EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_PAID: "order.paid",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",
  ORDER_REFUNDED: "order.refunded",
} as const;

export type OrderEventName = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

export interface OrderCreatedPayload {
  eventId: string;
  timestamp: string;
  version: "1.0";
  data: {
    orderId: string;
    orderNumber: string;
    tenantId: string;
    userId: string;
    totalAmount: number;
    currency: string;
    itemCount: number;
  };
}
