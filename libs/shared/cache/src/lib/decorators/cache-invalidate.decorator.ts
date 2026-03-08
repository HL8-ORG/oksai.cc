/**
 * @CacheInvalidate 装饰器
 *
 * @module common/decorators/cache-invalidate.decorator
 */

import { Inject } from "@nestjs/common";
import type { TwoLayerCacheService } from "../services/two-layer-cache.service.js";

/**
 * @CacheInvalidate 装饰器选项
 */
export interface CacheInvalidateOptions<TOutput = any, TArgs extends any[] = any[]> {
  /**
   * 缓存键构建器（单个键）
   * @param args - 方法参数
   * @returns 缓存键（返回空字符串则跳过失效）
   */
  cacheKey?: (...args: TArgs) => string;

  /**
   * 缓存键构建器（多个键）
   * @param args - 方法参数
   * @returns 缓存键数组
   */
  cacheKeys?: (...args: TArgs) => string[];

  /**
   * 缓存键前缀构建器（批量失效）
   * @param args - 方法参数
   * @returns 缓存键前缀（使用 SCAN 删除匹配前缀的所有键）
   */
  cacheKeyPrefix?: (...args: TArgs) => string;

  /**
   * 是否跳过失效（返回 true 则跳过）
   * @param args - 方法参数
   * @returns 是否跳过失效
   */
  skipInvalidate?: (...args: TArgs) => boolean;

  /**
   * 根据返回值决定是否失效
   * @param result - 方法返回值
   * @returns 是否失效缓存
   */
  invalidateOnResult?: (result: TOutput) => boolean;
}

/**
 * @CacheInvalidate 装饰器
 *
 * @description
 * 在方法成功执行后自动失效缓存
 *
 * @example
 * ```typescript
 * class UserService {
 *   @CacheInvalidate({
 *     cacheKey: (id: string) => `user:${id}`,
 *   })
 *   async updateUser(id: string) {
 *     return this.userRepository.update(id, data);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // 批量失效多个键
 * class UserService {
 *   @CacheInvalidate({
 *     cacheKeys: (id: string) => [
 *       `user:${id}`,
 *       `user:profile:${id}`,
 *       `user:settings:${id}`,
 *     ],
 *   })
 *   async deleteUser(id: string) {
 *     return this.userRepository.delete(id);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // 前缀批量失效
 * class UserService {
 *   @CacheInvalidate({
 *     cacheKeyPrefix: (id: string) => `user:${id}`,
 *   })
 *   async clearUserData(id: string) {
 *     return this.clearAllUserData(id);
 *   }
 * }
 * ```
 */
export function CacheInvalidate<TOutput = any, TArgs extends any[] = any[]>(
  options: CacheInvalidateOptions<TOutput, TArgs>
) {
  const injectCache = Inject("TwoLayerCacheService");

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: TArgs) => Promise<TOutput>;

    // 注入缓存服务
    injectCache(target, "cacheService");

    descriptor.value = async function (this: any, ...args: TArgs): Promise<TOutput> {
      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 检查是否跳过失效
      if (options.skipInvalidate?.(...args)) {
        return result;
      }

      // 根据返回值决定是否失效
      if (options.invalidateOnResult && !options.invalidateOnResult(result)) {
        return result;
      }

      const cacheService = this.cacheService as TwoLayerCacheService;

      try {
        // 1. 失效单个缓存键
        if (options.cacheKey) {
          const key = options.cacheKey(...args);
          if (key) {
            await cacheService.delete(key);
          }
        }

        // 2. 失效多个缓存键
        if (options.cacheKeys) {
          const keys = options.cacheKeys(...args);
          await Promise.all(keys.filter((key) => key).map((key) => cacheService.delete(key)));
        }

        // 3. 前缀批量失效
        if (options.cacheKeyPrefix) {
          const prefix = options.cacheKeyPrefix(...args);
          if (prefix) {
            await cacheService.deleteByPrefix(prefix);
          }
        }
      } catch (error) {
        // 缓存失效失败不应该影响方法返回值
        console.error(`缓存失效失败: ${propertyKey}`, error);
      }

      return result;
    };

    return descriptor;
  };
}
