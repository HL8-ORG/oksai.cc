/**
 * 速率限制装饰器
 *
 * @description
 * 为不同类型的端点提供速率限制配置
 */

import { SetMetadata } from "@nestjs/common";

/**
 * 速率限制配置元数据键
 */
export const RATE_LIMIT_KEY = "rate_limit";

/**
 * 速率限制配置接口
 */
export interface RateLimitConfig {
  /**
   * 时间窗口（毫秒）
   */
  ttl: number;

  /**
   * 最大请求数
   */
  limit: number;

  /**
   * 错误消息
   */
  message?: string;
}

/**
 * 速率限制装饰器
 *
 * @param config - 速率限制配置
 *
 * @example
 * @RateLimit({ ttl: 60000, limit: 5 })
 * async login() {}
 */
export function RateLimit(config: RateLimitConfig): MethodDecorator {
  return SetMetadata(RATE_LIMIT_KEY, config);
}

/**
 * 预定义的速率限制配置
 */
export const RateLimitPresets = {
  /**
   * 登录端点：1 分钟 5 次
   */
  LOGIN: {
    ttl: 60000,
    limit: 5,
    message: "登录尝试次数过多，请稍后再试",
  } as RateLimitConfig,

  /**
   * 注册端点：1 小时 3 次
   */
  REGISTER: {
    ttl: 3600000,
    limit: 3,
    message: "注册请求次数过多，请稍后再试",
  } as RateLimitConfig,

  /**
   * 密码重置：1 小时 3 次
   */
  PASSWORD_RESET: {
    ttl: 3600000,
    limit: 3,
    message: "密码重置请求次数过多，请稍后再试",
  } as RateLimitConfig,

  /**
   * OAuth 授权：1 分钟 10 次
   */
  OAUTH_AUTHORIZE: {
    ttl: 60000,
    limit: 10,
    message: "OAuth 授权请求次数过多，请稍后再试",
  } as RateLimitConfig,

  /**
   * API 端点：1 分钟 100 次
   */
  API: {
    ttl: 60000,
    limit: 100,
    message: "API 请求次数过多，请稍后再试",
  } as RateLimitConfig,

  /**
   * 公开端点：1 分钟 60 次
   */
  PUBLIC: {
    ttl: 60000,
    limit: 60,
    message: "请求次数过多，请稍后再试",
  } as RateLimitConfig,
} as const;
