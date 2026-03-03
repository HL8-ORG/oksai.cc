/**
 * 通用缓存服务
 *
 * @module common/cache.service
 */

import { Injectable, Logger } from "@nestjs/common";
import { LRUCache } from "lru-cache";

/**
 * 缓存配置选项
 */
export interface CacheOptions {
  /** 最大缓存数量 */
  max?: number;
  /** TTL (毫秒) */
  ttl?: number;
  /** 是否启用统计 */
  enableStats?: boolean;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

/**
 * 通用缓存服务
 *
 * @description
 * 基于 LRU (Least Recently Used) 算法的内存缓存服务
 * - 支持自动过期
 * - 支持容量限制
 * - 支持 TTL (Time To Live)
 * - 支持缓存统计
 *
 * @example
 * ```typescript
 * // 获取或设置缓存
 * const user = await cacheService.getOrSet('user:123', async () => {
 *   return await userRepository.findById('123');
 * }, { ttl: 60000 }); // 缓存 1 分钟
 * ```
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache: LRUCache<string, any>;
  private hits = 0;
  private misses = 0;

  /**
   * 创建缓存服务实例
   *
   * @param options - 缓存配置选项
   */
  constructor(options: CacheOptions = {}) {
    const { max = 1000, ttl = 60000, enableStats = false } = options;

    this.cache = new LRUCache<string, any>({
      max,
      ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });

    if (enableStats) {
      this.logger.log(`缓存服务已启动 (max: ${max}, ttl: ${ttl}ms)`);
    }
  }

  /**
   * 获取缓存值
   *
   * @param key - 缓存键
   * @returns 缓存值（不存在则返回 undefined）
   */
  get<T = any>(key: string): T | undefined {
    const value = this.cache.get(key) as T | undefined;

    if (value !== undefined) {
      this.hits++;
      this.logger.debug(`缓存命中: ${key}`);
    } else {
      this.misses++;
      this.logger.debug(`缓存未命中: ${key}`);
    }

    return value;
  }

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 可选的 TTL (毫秒)，不设置则使用默认值
   */
  set<T = any>(key: string, value: T, ttl?: number): void {
    if (ttl !== undefined) {
      this.cache.set(key, value, { ttl });
    } else {
      this.cache.set(key, value);
    }

    this.logger.debug(`缓存已设置: ${key}`);
  }

  /**
   * 获取或设置缓存（常用模式）
   *
   * @description
   * 如果缓存存在则返回缓存值，否则调用 factory 函数获取数据并缓存
   *
   * @param key - 缓存键
   * @param factory - 数据获取函数
   * @param ttl - 可选的 TTL (毫秒)
   * @returns 缓存值或 factory 返回值
   *
   * @example
   * ```typescript
   * const user = await cacheService.getOrSet(
   *   `user:${userId}`,
   *   async () => await userRepository.findById(userId),
   *   { ttl: 300000 } // 5 分钟
   * );
   * ```
   */
  async getOrSet<T = any>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await factory();
    this.set(key, value, ttl);

    return value;
  }

  /**
   * 删除缓存
   *
   * @param key - 缓存键
   * @returns 是否成功删除
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.logger.debug(`缓存已删除: ${key}`);

    return result;
  }

  /**
   * 批量删除缓存（根据前缀）
   *
   * @param prefix - 缓存键前缀
   * @returns 删除的缓存数量
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.logger.debug(`删除前缀缓存: ${prefix} (${count} 个)`);
    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.logger.warn("所有缓存已清空");
  }

  /**
   * 检查缓存是否存在
   *
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 获取缓存大小
   *
   * @returns 当前缓存数量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 统计信息
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.logger.debug("缓存统计已重置");
  }
}
