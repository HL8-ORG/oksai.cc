/**
 * @CachedResponse 装饰器
 *
 * @module common/decorators/cached-response.decorator
 */

import type { TwoLayerCacheService } from "../services/two-layer-cache.service.js";

/**
 * @CachedResponse 装饰器选项
 */
export interface CachedResponseOptions<TOutput = any, TArgs extends any[] = any[]> {
  /**
   * 缓存键构建器
   * @param args - 方法参数
   * @returns 缓存键（返回空字符串则跳过缓存）
   */
  cacheKey: (...args: TArgs) => string;

  /**
   * 缓存 TTL（毫秒）
   * @default 60000 (60 秒)
   */
  ttl?: number;

  /**
   * 是否跳过缓存（返回 true 则跳过）
   * @param args - 方法参数
   * @returns 是否跳过缓存
   */
  skipCache?: (...args: TArgs) => boolean;

  /**
   * 是否跳过保存到缓存（返回 true 则不缓存结果）
   * @param result - 方法返回值
   * @returns 是否跳过保存
   */
  skipSaveToCache?: (result: TOutput) => boolean;
}

/**
 * @CachedResponse 装饰器
 *
 * @description
 * 自动缓存方法返回值，减少重复计算和数据库查询
 *
 * @example
 * ```typescript
 * class UserService {
 *   @CachedResponse({
 *     cacheKey: (id: string) => `user:${id}`,
 *     ttl: 60000, // 60 秒
 *     skipCache: (id) => id === 'admin', // admin 用户不缓存
 *     skipSaveToCache: (result) => result.error, // 错误结果不缓存
 *   })
 *   async getUser(id: string) {
 *     return this.userRepository.findById(id);
 *   }
 * }
 * ```
 */
export function CachedResponse<TOutput = any, TArgs extends any[] = any[]>(
  options: CachedResponseOptions<TOutput, TArgs>
) {
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: TArgs) => Promise<TOutput>;

    descriptor.value = async function (this: any, ...args: TArgs): Promise<TOutput> {
      const cacheService = this.cacheService as TwoLayerCacheService;

      // 1. 检查是否跳过缓存
      if (options.skipCache?.(...args)) {
        return await originalMethod.apply(this, args);
      }

      // 2. 构建缓存键
      const cacheKey = options.cacheKey(...args);

      // 缓存键为空时跳过缓存
      if (!cacheKey) {
        return await originalMethod.apply(this, args);
      }

      // 3. 尝试从缓存获取
      try {
        const cached = await cacheService.get<TOutput>(cacheKey);

        if (cached !== undefined) {
          return cached;
        }
      } catch (error) {
        // 缓存读取失败，继续执行原方法
        console.error(`缓存读取失败: ${cacheKey}`, error);
      }

      // 4. 执行原方法
      const result = await originalMethod.apply(this, args);

      // 5. 检查是否跳过保存到缓存
      if (options.skipSaveToCache?.(result)) {
        return result;
      }

      // 6. 保存到缓存
      try {
        await cacheService.set(cacheKey, result, options.ttl ?? 60000);
      } catch (error) {
        // 缓存写入失败，不影响返回结果
        console.error(`缓存写入失败: ${cacheKey}`, error);
      }

      return result;
    };

    return descriptor;
  };
}
