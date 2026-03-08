/**
 * 双层缓存服务
 *
 * @module common/two-layer-cache.service
 */

import { Injectable, Logger } from "@nestjs/common";
import type { CacheStats } from "./cache.service.js";
import { CacheService } from "./cache.service.js";
import { RedisCacheEnhancedService } from "./redis-cache-enhanced.service.js";

/**
 * 双层缓存配置选项
 */
export interface TwoLayerCacheOptions {
  /** L1 缓存（本地内存） */
  l1TTL?: number;
  /** L2 缓存（Redis）默认 TTL */
  l2TTL?: number;
  /** 是否启用统计 */
  enableStats?: boolean;
}

/**
 * 双层缓存统计信息
 */
export interface TwoLayerCacheStats {
  l1: CacheStats;
  l2: CacheStats;
  totalHits: number;
  totalMisses: number;
  overallHitRate: number;
}

/**
 * 双层缓存服务
 *
 * @description
 * 实现双层缓存架构（L1 本地 + L2 Redis）：
 * - L1: 本地内存缓存（30-60s TTL），快速访问
 * - L2: Redis 分布式缓存（2h TTL），数据共享
 *
 * **读取逻辑**：L1 -> L2 -> 数据源
 * **写入逻辑**：L1 + L2 同时写入
 * **降级策略**：L2 故障时自动降级到 L1
 *
 * @example
 * ```typescript
 * // 获取数据
 * const user = await twoLayerCache.getOrSet('user:123', async () => {
 *   return await userRepository.findById('123');
 * }, { l2TTL: 60000 });
 *
 * // 设置数据
 * await twoLayerCache.set('user:456', userData, 60000);
 *
 * // 失效缓存
 * await twoLayerCache.delete('user:456');
 * ```
 */
@Injectable()
export class TwoLayerCacheService {
  private readonly logger = new Logger(TwoLayerCacheService.name);
  private readonly l1TTL: number;
  private readonly l2TTL: number;
  private readonly enableStats: boolean;

  /**
   * In-flight requests 映射（防止缓存击穿）
   * Key: cache key
   * Value: pending promise
   */
  private readonly inflightRequests = new Map<string, Promise<any>>();

  constructor(
    private readonly l1Cache: CacheService,
    private readonly l2Cache: RedisCacheEnhancedService,
    private readonly ttlJitterService: { addJitter: (ttl: number) => number },
    options: TwoLayerCacheOptions = {}
  ) {
    this.l1TTL = options.l1TTL ?? 30000; // 默认 30 秒
    this.l2TTL = options.l2TTL ?? 7200000; // 默认 2 小时
    this.enableStats = options.enableStats ?? true;

    if (this.enableStats) {
      this.logger.log(`双层缓存服务已启动 (L1: ${this.l1TTL}ms, L2: ${this.l2TTL}ms)`);
    }
  }

  /**
   * 获取缓存值（L1 -> L2）
   *
   * @param key - 缓存键
   * @returns 缓存值（不存在则返回 undefined）
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    try {
      // 1. 尝试从 L1 读取
      const l1Value = this.l1Cache.get<T>(key);
      if (l1Value !== undefined) {
        this.logger.debug(`L1 缓存命中: ${key}`);
        return l1Value;
      }

      // 2. 尝试从 L2 读取
      const l2Value = await this.l2Cache.get<T>(key);
      if (l2Value !== undefined) {
        this.logger.debug(`L2 缓存命中: ${key}`);

        // 回填 L1 缓存
        const l1TTL = Math.min(this.l1TTL, 30000); // L1 最多 30 秒
        this.l1Cache.set(key, l2Value, l1TTL);
        this.logger.debug(`L1 缓存已回填: ${key}`);

        return l2Value;
      }

      this.logger.debug(`缓存未命中: ${key}`);
      return undefined;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      return undefined;
    }
  }

  /**
   * 设置缓存值（L1 + L2 双写）
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - L2 TTL（毫秒）
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // 1. 应用 TTL 抖动（防止雪崩）
      const l2TTLWithJitter = this.ttlJitterService.addJitter(ttl ?? this.l2TTL);

      // 2. 写入 L2 缓存
      await this.l2Cache.set(key, value, l2TTLWithJitter);

      // 3. 写入 L1 缓存（使用更短的 TTL）
      const l1TTL = Math.min(this.l1TTL, l2TTLWithJitter, 30000);
      this.l1Cache.set(key, value, l1TTL);

      this.logger.debug(`双层缓存已设置: ${key} (L1: ${l1TTL}ms, L2: ${l2TTLWithJitter}ms)`);
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
    }
  }

  /**
   * 获取或设置缓存（防击穿）
   *
   * @description
   * 如果缓存存在则返回缓存值， 否则调用 factory 函数获取数据并缓存
   * 支持并发请求合并（in-flight request deduplication）
   *
   * @param key - 缓存键
   * @param factory - 数据获取函数
   * @param ttl - L2 TTL（毫秒）
   * @returns 缓存值或 factory 返回值
   */
  async getOrSet<T = any>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      // 1. 尝试从缓存获取
      const cached = await this.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // 2. 检查 in-flight request（防击穿）
      const inflight = this.inflightRequests.get(key);
      if (inflight) {
        this.logger.debug(`等待 in-flight request: ${key}`);
        return inflight;
      }

      // 3. 创建新的 in-flight promise
      const promise = factory()
        .then((result) => {
          // 缓存结果（包括空值）
          const effectiveTTL = result ? ttl : 60000; // 空值缓存 60s
          this.set(key, result ?? null, effectiveTTL);
          return result;
        })
        .finally(() => {
          // 清理 in-flight request
          this.inflightRequests.delete(key);
        });

      // 4. 注册 in-flight request
      this.inflightRequests.set(key, promise);

      return promise;
    } catch (error) {
      this.logger.error(`getOrSet 失败: ${key}`, error);

      // 错误时直接调用 factory
      return await factory();
    }
  }

  /**
   * 删除缓存（L1 + L2）
   *
   * @param key - 缓存键
   * @returns 是否成功删除
   */
  async delete(key: string): Promise<boolean> {
    try {
      // 1. 删除 L1
      const l1Deleted = this.l1Cache.delete(key);

      // 2. 删除 L2
      const l2Deleted = await this.l2Cache.delete(key);

      const deleted = l1Deleted || l2Deleted;
      this.logger.debug(`缓存已删除: ${key} (L1: ${l1Deleted}, L2: ${l2Deleted})`);

      return deleted;
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存（根据前缀）
   *
   * @param prefix - 缓存键前缀
   * @returns 删除的缓存数量
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    try {
      // 1. 删除 L1（前缀匹配）
      const l1Deleted = this.l1Cache.deleteByPrefix(prefix);

      // 2. 删除 L2（使用 SCAN）
      const l2Deleted = await this.l2Cache.deleteByPrefix(prefix);

      const totalDeleted = l1Deleted + l2Deleted;
      this.logger.debug(`前缀缓存已删除: ${prefix} (L1: ${l1Deleted}, L2: ${l2Deleted})`);

      return totalDeleted;
    } catch (error) {
      this.logger.error(`批量删除缓存失败: ${prefix}`, error);
      return 0;
    }
  }

  /**
   * 清空所有缓存（L1 + L2）
   */
  async clear(): Promise<void> {
    try {
      // 1. 清空 L1
      this.l1Cache.clear();

      // 2. 清空 L2
      await this.l2Cache.clear();

      // 3. 清空 in-flight requests
      this.inflightRequests.clear();

      this.logger.warn("所有缓存已清空");
    } catch (error) {
      this.logger.error("清空缓存失败", error);
    }
  }

  /**
   * 检查缓存是否存在（L1 或 L2）
   *
   * @param key - 缓存键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    try {
      // 1. 检查 L1
      if (this.l1Cache.has(key)) {
        return true;
      }

      // 2. 检查 L2
      return await this.l2Cache.has(key);
    } catch (error) {
      this.logger.error(`检查缓存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @returns L1 和 L2 的统计信息
   */
  getStats(): TwoLayerCacheStats {
    const l1Stats = this.l1Cache.getStats();
    const l2Stats = this.l2Cache.getStats();

    const totalHits = l1Stats.hits + l2Stats.hits;
    const totalMisses = l1Stats.misses + l2Stats.misses;
    const totalRequests = totalHits + totalMisses;
    const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    return {
      l1: l1Stats,
      l2: l2Stats,
      totalHits,
      totalMisses,
      overallHitRate: Math.round(overallHitRate * 100) / 100,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.l1Cache.resetStats();
    this.l2Cache.resetStats();
    this.logger.debug("缓存统计已重置");
  }

  /**
   * 获取 in-flight request 数量
   *
   * @returns 当前 in-flight request 数量
   */
  getInflightCount(): number {
    return this.inflightRequests.size;
  }
}
