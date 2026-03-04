/**
 * @description 错误代码契约
 *
 * 统一的错误码定义，用于服务间通信
 *
 * @module @oksai/constants/contracts/errors
 */

// ============ 通用错误码 ============

/**
 * @description 错误代码枚举
 */
export const ERROR_CODES = {
  // 通用错误 (1-999)
  UNKNOWN_ERROR: "ERR_0001",
  VALIDATION_ERROR: "ERR_0002",
  NOT_FOUND: "ERR_0003",
  UNAUTHORIZED: "ERR_0004",
  FORBIDDEN: "ERR_0005",
  CONFLICT: "ERR_0006",
  RATE_LIMIT_EXCEEDED: "ERR_0007",
  SERVICE_UNAVAILABLE: "ERR_0008",

  // 认证错误 (1000-1999)
  INVALID_CREDENTIALS: "ERR_1001",
  TOKEN_EXPIRED: "ERR_1002",
  TOKEN_INVALID: "ERR_1003",
  MFA_REQUIRED: "ERR_1004",
  MFA_INVALID: "ERR_1005",
  EMAIL_NOT_VERIFIED: "ERR_1006",
  ACCOUNT_DEACTIVATED: "ERR_1007",
  PASSWORD_WEAK: "ERR_1008",
  PASSWORD_REUSE: "ERR_1009",

  // 用户错误 (2000-2999)
  USER_NOT_FOUND: "ERR_2001",
  USER_ALREADY_EXISTS: "ERR_2002",
  USERNAME_TAKEN: "ERR_2003",
  EMAIL_TAKEN: "ERR_2004",
  INVALID_USER_STATUS: "ERR_2005",

  // 租户错误 (3000-3999)
  TENANT_NOT_FOUND: "ERR_3001",
  TENANT_SLUG_TAKEN: "ERR_3002",
  TENANT_MEMBER_LIMIT_EXCEEDED: "ERR_3003",
  TENANT_PLAN_LIMIT_EXCEEDED: "ERR_3004",
  MEMBER_ALREADY_EXISTS: "ERR_3005",
  MEMBER_NOT_FOUND: "ERR_3006",

  // 订单错误 (4000-4999)
  ORDER_NOT_FOUND: "ERR_4001",
  ORDER_ALREADY_CANCELLED: "ERR_4002",
  ORDER_ALREADY_REFUNDED: "ERR_4003",
  ORDER_CANNOT_CANCEL: "ERR_4004",
  ORDER_CANNOT_REFUND: "ERR_4005",
  PRODUCT_OUT_OF_STOCK: "ERR_4006",

  // 支付错误 (5000-5999)
  PAYMENT_FAILED: "ERR_5001",
  PAYMENT_METHOD_INVALID: "ERR_5002",
  INSUFFICIENT_FUNDS: "ERR_5003",
  REFUND_FAILED: "ERR_5004",

  // 数据库错误 (9000-9999)
  DATABASE_CONNECTION_ERROR: "ERR_9001",
  DATABASE_QUERY_ERROR: "ERR_9002",
  DATABASE_CONSTRAINT_ERROR: "ERR_9003",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============ 错误响应结构 ============

/**
 * @description API 错误响应
 */
export interface ApiErrorResponse {
  /** 是否成功 */
  success: false;
  /** 错误代码 */
  code: ErrorCode;
  /** 错误消息 */
  message: string;
  /** 详细错误信息 */
  details?: Record<string, unknown>;
  /** 堆栈跟踪（仅开发环境） */
  stack?: string;
  /** 请求 ID */
  requestId: string;
  /** 时间戳 */
  timestamp: string;
}

/**
 * @description 验证错误详情
 */
export interface ValidationErrorDetail {
  /** 字段名 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 实际值 */
  value?: unknown;
}

// ============ 错误码到消息的映射 ============

/**
 * @description 错误码对应的默认消息
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 通用错误
  [ERROR_CODES.UNKNOWN_ERROR]: "未知错误",
  [ERROR_CODES.VALIDATION_ERROR]: "数据验证失败",
  [ERROR_CODES.NOT_FOUND]: "资源不存在",
  [ERROR_CODES.UNAUTHORIZED]: "未授权访问",
  [ERROR_CODES.FORBIDDEN]: "禁止访问",
  [ERROR_CODES.CONFLICT]: "资源冲突",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "请求频率超限",
  [ERROR_CODES.SERVICE_UNAVAILABLE]: "服务暂时不可用",

  // 认证错误
  [ERROR_CODES.INVALID_CREDENTIALS]: "邮箱或密码错误",
  [ERROR_CODES.TOKEN_EXPIRED]: "令牌已过期",
  [ERROR_CODES.TOKEN_INVALID]: "令牌无效",
  [ERROR_CODES.MFA_REQUIRED]: "需要双因素认证",
  [ERROR_CODES.MFA_INVALID]: "双因素认证代码无效",
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: "邮箱未验证",
  [ERROR_CODES.ACCOUNT_DEACTIVATED]: "账户已停用",
  [ERROR_CODES.PASSWORD_WEAK]: "密码强度不足",
  [ERROR_CODES.PASSWORD_REUSE]: "不能使用近期使用过的密码",

  // 用户错误
  [ERROR_CODES.USER_NOT_FOUND]: "用户不存在",
  [ERROR_CODES.USER_ALREADY_EXISTS]: "用户已存在",
  [ERROR_CODES.USERNAME_TAKEN]: "用户名已被使用",
  [ERROR_CODES.EMAIL_TAKEN]: "邮箱已被使用",
  [ERROR_CODES.INVALID_USER_STATUS]: "用户状态无效",

  // 租户错误
  [ERROR_CODES.TENANT_NOT_FOUND]: "租户不存在",
  [ERROR_CODES.TENANT_SLUG_TAKEN]: "租户标识已被使用",
  [ERROR_CODES.TENANT_MEMBER_LIMIT_EXCEEDED]: "租户成员数量已达上限",
  [ERROR_CODES.TENANT_PLAN_LIMIT_EXCEEDED]: "租户计划限制已达上限",
  [ERROR_CODES.MEMBER_ALREADY_EXISTS]: "成员已存在",
  [ERROR_CODES.MEMBER_NOT_FOUND]: "成员不存在",

  // 订单错误
  [ERROR_CODES.ORDER_NOT_FOUND]: "订单不存在",
  [ERROR_CODES.ORDER_ALREADY_CANCELLED]: "订单已取消",
  [ERROR_CODES.ORDER_ALREADY_REFUNDED]: "订单已退款",
  [ERROR_CODES.ORDER_CANNOT_CANCEL]: "订单无法取消",
  [ERROR_CODES.ORDER_CANNOT_REFUND]: "订单无法退款",
  [ERROR_CODES.PRODUCT_OUT_OF_STOCK]: "商品库存不足",

  // 支付错误
  [ERROR_CODES.PAYMENT_FAILED]: "支付失败",
  [ERROR_CODES.PAYMENT_METHOD_INVALID]: "支付方式无效",
  [ERROR_CODES.INSUFFICIENT_FUNDS]: "余额不足",
  [ERROR_CODES.REFUND_FAILED]: "退款失败",

  // 数据库错误
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: "数据库连接错误",
  [ERROR_CODES.DATABASE_QUERY_ERROR]: "数据库查询错误",
  [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]: "数据库约束错误",
};
