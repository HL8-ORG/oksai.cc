/**
 * 缓存模块
 *
 * @module common/cache.module
 */

import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service";

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
}

/**
 * 缓存模块
 *
 * @description
 * 提供全局缓存服务，默认配置：
 * - 最大缓存数量：10000
 * - 默认 TTL：60 秒
 * - 启用统计：true
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CacheModule.forRoot({ max: 5000, ttl: 120000 })],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useFactory: () => {
        return new CacheService({
          max: 10000,
          ttl: 60000, // 60 秒
          enableStats: true,
        });
      },
    },
  ],
  exports: [CacheService],
})
export class CacheModule {
  /**
   * 创建动态缓存模块
   *
   * @param options - 缓存配置选项
   * @returns 动态模块
   */
  static forRoot(options: CacheModuleOptions = {}) {
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
      ],
      exports: [CacheService],
    };
  }
}
