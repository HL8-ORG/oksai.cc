/**
 * 缓存模块
 *
 * @module common/cache.module
 */

import process from "node:process";
import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { RedisCacheService } from "./redis-cache.service";

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
  providers: [CacheService, RedisCacheService],
  exports: [CacheService, RedisCacheService],
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
      ],
      exports: [CacheService, RedisCacheService],
    };
  }
}
