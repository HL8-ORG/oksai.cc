/**
 * Redis 缓存服务
 *
 * @module common/redis-cache.service
 */

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import type { CacheOptions, CacheStats } from "./cache.service";

/**
 * Redis 缓存服务
 *
 * @description
 * 基于 Redis 的分布式缓存服务
 * - 支持分布式部署
 * - 持久化缓存数据
 * - 自动重连
 * - 降级到内存缓存
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client?: Redis;
  private readonly fallbackCache = new Map<string, { value: any; expiresAt?: number }>();
  private isConnected = false;
  private hits = 0;
  private misses = 0;

  constructor(options: CacheOptions & { redisUrl?: string } = {}) {
    const { redisUrl } = options;

    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });

        this.client.on("connect", () => {
          this.isConnected = true;
          this.logger.log("Redis 缓存服务已连接");
        });

        this.client.on("error", (error) => {
          this.logger.error("Redis 连接错误", error);
          this.isConnected = false;
        });

        this.client.on("close", () => {
          this.logger.warn("Redis 连接已关闭，降级到内存缓存");
          this.isConnected = false;
        });
      } catch (error) {
        this.logger.error("Redis 初始化失败，使用内存缓存", error);
      }
    } else {
      this.logger.warn("未配置 Redis URL，使用内存缓存");
    }
  }

  async onModuleInit() {
    if (this.client) {
      try {
        await this.client.ping();
        this.logger.log("Redis 缓存服务启动成功");
      } catch (error) {
        this.logger.warn("Redis 连接失败，使用内存缓存", error);
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log("Redis 连接已关闭");
    }
  }

  /**
   * 获取缓存值
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    try {
      if (this.isConnected && this.client) {
        const value = await this.client.get(key);

        if (value !== null) {
          this.hits++;
          this.logger.debug(`Redis 缓存命中: ${key}`);
          return JSON.parse(value) as T;
        }

        this.misses++;
        this.logger.debug(`Redis 缓存未命中: ${key}`);
        return undefined;
      }

      // 降级到内存缓存
      return this.getFromFallback<T>(key);
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      return this.getFromFallback<T>(key);
    }
  }

  /**
   * 设置缓存值
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (this.isConnected && this.client) {
        if (ttl !== undefined) {
          await this.client.setex(key, Math.floor(ttl / 1000), serialized);
        } else {
          await this.client.set(key, serialized);
        }
        this.logger.debug(`Redis 缓存已设置: ${key}`);
      } else {
        // 降级到内存缓存
        this.setToFallback(key, value, ttl);
      }
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
      this.setToFallback(key, value, ttl);
    }
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet<T = any>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = await this.get<T>(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await factory();
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        const result = await this.client.del(key);
        this.logger.debug(`Redis 缓存已删除: ${key}`);
        return result > 0;
      }

      return this.deleteFromFallback(key);
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
      return this.deleteFromFallback(key);
    }
  }

  /**
   * 批量删除缓存（根据前缀）
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(`${prefix}*`);

        if (keys.length > 0) {
          await this.client.del(...keys);
          this.logger.debug(`Redis 删除前缀缓存: ${prefix} (${keys.length} 个)`);
          return keys.length;
        }

        return 0;
      }

      return this.deleteByPrefixFromFallback(prefix);
    } catch (error) {
      this.logger.error(`批量删除缓存失败: ${prefix}`, error);
      return this.deleteByPrefixFromFallback(prefix);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.flushdb();
        this.logger.warn("Redis 所有缓存已清空");
      } else {
        this.fallbackCache.clear();
        this.logger.warn("内存缓存已清空");
      }
    } catch (error) {
      this.logger.error("清空缓存失败", error);
      this.fallbackCache.clear();
    }
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: string): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        const exists = await this.client.exists(key);
        return exists === 1;
      }

      return this.hasInFallback(key);
    } catch (error) {
      this.logger.error(`检查缓存失败: ${key}`, error);
      return this.hasInFallback(key);
    }
  }

  /**
   * 获取缓存大小
   */
  async size(): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        const info = await this.client.dbsize();
        return info;
      }

      return this.fallbackCache.size;
    } catch (error) {
      this.logger.error("获取缓存大小失败", error);
      return this.fallbackCache.size;
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.fallbackCache.size,
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

  // 私有方法：内存缓存降级

  private getFromFallback<T>(key: string): T | undefined {
    const item = this.fallbackCache.get(key);

    if (!item) {
      this.misses++;
      this.logger.debug(`内存缓存未命中: ${key}`);
      return undefined;
    }

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.fallbackCache.delete(key);
      this.misses++;
      this.logger.debug(`内存缓存已过期: ${key}`);
      return undefined;
    }

    this.hits++;
    this.logger.debug(`内存缓存命中: ${key}`);
    return item.value;
  }

  private setToFallback<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : undefined;
    this.fallbackCache.set(key, { value, expiresAt });
    this.logger.debug(`内存缓存已设置: ${key}`);
  }

  private deleteFromFallback(key: string): boolean {
    const result = this.fallbackCache.delete(key);
    this.logger.debug(`内存缓存已删除: ${key}`);
    return result;
  }

  private deleteByPrefixFromFallback(prefix: string): number {
    let count = 0;

    for (const key of this.fallbackCache.keys()) {
      if (key.startsWith(prefix)) {
        this.fallbackCache.delete(key);
        count++;
      }
    }

    this.logger.debug(`删除前缀缓存: ${prefix} (${count} 个)`);
    return count;
  }

  private hasInFallback(key: string): boolean {
    const item = this.fallbackCache.get(key);

    if (!item) {
      return false;
    }

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.fallbackCache.delete(key);
      return false;
    }

    return true;
  }
}
