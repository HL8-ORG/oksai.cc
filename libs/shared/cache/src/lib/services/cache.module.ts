/**
 * 缓存模块
 *
 * @module common/cache.module
 */

import process from "node:process";
import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service.js";
import { RedisCacheService } from "./redis-cache.service.js";
import { RedisCacheEnhancedService } from "./redis-cache-enhanced.service.js";
import { TTLJitterService } from "./ttl-jitter.service.js";
import { TwoLayerCacheService } from "./two-layer-cache.service.js";

/**
 * 缓存模块配置选项
 */
export interface CacheModuleOptions {
  /** 最大缓存数量 */
  max?: number;
  /** 默认 TTL (毫秒) */
  ttl?: number;
  /** 是否启用统计 */
  enableStats?: boolean;
  /** Redis URL (可选) */
  redisUrl?: string;
  /** 是否启用 Redis */
  redisEnabled?: boolean;
}

/**
 * 缓存模块
 *
 * @description
 * 提供全局缓存服务，支持两种模式：
 * 1. 内存缓存（默认）：适用于单实例部署
 * 2. Redis 缓存：适用于分布式部署，需要配置 REDIS_URL
 *
 * 配置优先级：
 * 1. forRoot() 传入的选项
 * 2. 环境变量 REDIS_ENABLED 和 REDIS_URL
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CacheModule.forRoot({ redisEnabled: true, redisUrl: 'redis://localhost:6379' })],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  providers: [
    CacheService,
    RedisCacheService,
    TTLJitterService,
    RedisCacheEnhancedService,
    TwoLayerCacheService,
  ],
  exports: [
    CacheService,
    RedisCacheService,
    TTLJitterService,
    RedisCacheEnhancedService,
    TwoLayerCacheService,
  ],
})
export class CacheModule {
  /**
   * 创建动态缓存模块
   *
   * @param options - 缓存配置选项
   * @returns 动态模块
   */
  static forRoot(options: CacheModuleOptions = {}) {
    const redisEnabled = options.redisEnabled ?? process.env.REDIS_ENABLED === "true";
    const redisUrl = options.redisUrl ?? process.env.REDIS_URL;

    return {
      module: CacheModule,
      providers: [
        TTLJitterService,
        {
          provide: CacheService,
          useFactory: () => {
            return new CacheService({
              max: options.max ?? 10000,
              ttl: options.ttl ?? 60000,
              enableStats: options.enableStats ?? true,
            });
          },
        },
        {
          provide: RedisCacheService,
          useFactory: () => {
            return new RedisCacheService({
              max: options.max ?? 10000,
              ttl: options.ttl ?? 60000,
              enableStats: options.enableStats ?? true,
              redisUrl: redisEnabled ? redisUrl : undefined,
            });
          },
        },
        {
          provide: RedisCacheEnhancedService,
          useFactory: () => {
            return new RedisCacheEnhancedService({
              max: options.max ?? 10000,
              ttl: options.ttl ?? 60000,
              enableStats: options.enableStats ?? true,
              redisUrl: redisEnabled ? redisUrl : undefined,
            });
          },
        },
        {
          provide: TwoLayerCacheService,
          useFactory: (
            l1Cache: CacheService,
            l2Cache: RedisCacheEnhancedService,
            ttlJitterService: TTLJitterService
          ) => {
            return new TwoLayerCacheService(l1Cache, l2Cache, ttlJitterService, {
              l1TTL: options.ttl ?? 30000,
              l2TTL: 7200000, // 2 小时
              enableStats: options.enableStats ?? true,
            });
          },
          inject: [CacheService, RedisCacheEnhancedService, TTLJitterService],
        },
      ],
      exports: [
        CacheService,
        RedisCacheService,
        TTLJitterService,
        RedisCacheEnhancedService,
        TwoLayerCacheService,
      ],
    };
  }
}
