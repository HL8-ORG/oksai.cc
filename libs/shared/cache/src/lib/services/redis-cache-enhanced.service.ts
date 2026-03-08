/**
 * 增强版 Redis 缓存服务
 *
 * @module common/redis-cache-enhanced.service
 */

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit, Optional } from "@nestjs/common";
import Redis from "ioredis";
import type { CacheOptions, CacheStats } from "./cache.service.js";

/**
 * 增强版 Redis 缓存服务
 *
 * @description
 * 基于 Redis 的分布式缓存服务，包含企业级增强功能：
 * - SCAN 命令替代 KEYS（生产环境安全）
 * - Pipeline 批量操作优化
 * - Lua 脚本原子操作
 * - 自动重连和降级
 */
@Injectable()
export class RedisCacheEnhancedService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheEnhancedService.name);
  private readonly client?: Redis;
  private readonly fallbackCache = new Map<string, { value: any; expiresAt?: number }>();
  private isConnected = false;
  private hits = 0;
  private misses = 0;

  /**
   * Lua 脚本：原子递增（仅当 key 存在时）
   */
  private readonly INCR_IF_EXISTS_SCRIPT = `
    if redis.call('exists', KEYS[1]) == 1 then
      return redis.call('incrby', KEYS[1], ARGV[1])
    else
      return nil
    end
  `;

  /**
   * Lua 脚本：条件设置（仅当 key 不存在时）
   */
  private readonly SET_IF_NOT_EXIST_SCRIPT = `
    if redis.call('exists', KEYS[1]) == 0 then
      redis.call('setex', KEYS[1], ARGV[2], ARGV[1])
      return 1
    else
      return 0
    end
  `;

  constructor(@Optional() options: CacheOptions & { redisUrl?: string } = {}) {
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
        this.setToFallback(key, value, ttl);
      }
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
      this.setToFallback(key, value, ttl);
    }
  }

  /**
   * 批量设置缓存（Pipeline 优化）
   *
   * @param items - 键值对数组
   * @param ttl - TTL（毫秒）
   */
  async mset<T = any>(items: Array<{ key: string; value: T }>, ttl?: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const pipeline = this.client.pipeline();

        items.forEach(({ key, value }) => {
          const serialized = JSON.stringify(value);
          if (ttl !== undefined) {
            pipeline.setex(key, Math.floor(ttl / 1000), serialized);
          } else {
            pipeline.set(key, serialized);
          }
        });

        await pipeline.exec();
        this.logger.debug(`Redis 批量设置缓存: ${items.length} 个`);
      } else {
        items.forEach(({ key, value }) => {
          this.setToFallback(key, value, ttl);
        });
      }
    } catch (error) {
      this.logger.error("批量设置缓存失败", error);
      items.forEach(({ key, value }) => {
        this.setToFallback(key, value, ttl);
      });
    }
  }

  /**
   * 批量获取缓存（Pipeline 优化）
   *
   * @param keys - 键数组
   * @returns 键值对对象
   */
  async mget<T = any>(keys: string[]): Promise<Record<string, T | undefined>> {
    const result: Record<string, T | undefined> = {};

    try {
      if (this.isConnected && this.client) {
        const values = await this.client.mget(...keys);

        keys.forEach((key, index) => {
          const value = values[index];
          if (value !== null) {
            this.hits++;
            result[key] = JSON.parse(value) as T;
          } else {
            this.misses++;
            result[key] = undefined;
          }
        });

        this.logger.debug(`Redis 批量获取缓存: ${keys.length} 个`);
      } else {
        keys.forEach((key) => {
          result[key] = this.getFromFallback<T>(key);
        });
      }
    } catch (error) {
      this.logger.error("批量获取缓存失败", error);
      keys.forEach((key) => {
        result[key] = this.getFromFallback<T>(key);
      });
    }

    return result;
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
   * 批量删除缓存（根据前缀）- 使用 SCAN 替代 KEYS
   *
   * @param prefix - 缓存键前缀
   * @returns 删除的缓存数量
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        let count = 0;
        let cursor = "0";

        do {
          // 使用 SCAN 命令分页扫描
          const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);

          cursor = nextCursor;

          if (keys.length > 0) {
            // 使用 Pipeline 批量删除
            const pipeline = this.client.pipeline();
            keys.forEach((key) => {
              pipeline.del(key);
            });
            await pipeline.exec();
            count += keys.length;
          }
        } while (cursor !== "0");

        this.logger.debug(`Redis 删除前缀缓存: ${prefix} (${count} 个)`);
        return count;
      }

      return this.deleteByPrefixFromFallback(prefix);
    } catch (error) {
      this.logger.error(`批量删除缓存失败: ${prefix}`, error);
      return this.deleteByPrefixFromFallback(prefix);
    }
  }

  /**
   * 原子递增（仅当 key 存在时）- 使用 Lua 脚本
   *
   * @param key - 缓存键
   * @param increment - 递增量
   * @returns 递增后的值，如果 key 不存在返回 null
   */
  async incrIfExistsAtomic(key: string, increment = 1): Promise<number | null> {
    try {
      if (this.isConnected && this.client) {
        // 使用 Lua 脚本保证原子性
        const result = await this.client.eval(this.INCR_IF_EXISTS_SCRIPT, 1, key, increment.toString());

        if (result !== null) {
          this.logger.debug(`Redis 原子递增: ${key} += ${increment} = ${result}`);
          return Number(result);
        }

        return null;
      }

      // Fallback: 简单递增（非原子）
      const value = this.getFromFallback<string | number>(key);
      if (value !== undefined) {
        // 确保 value 是数字类型
        const numValue = typeof value === "string" ? Number.parseInt(value, 10) : value;
        const newValue = numValue + increment;
        this.setToFallback(key, newValue, undefined);
        return newValue;
      }

      return null;
    } catch (error) {
      this.logger.error(`原子递增失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 条件设置（仅当 key 不存在时）- 使用 Lua 脚本
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - TTL（毫秒）
   * @returns 是否设置成功
   */
  async setIfNotExist<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        const serialized = JSON.stringify(value);
        const ttlSeconds = ttl ? Math.floor(ttl / 1000) : 3600; // 默认 1 小时

        // 使用 Lua 脚本保证原子性
        const result = await this.client.eval(
          this.SET_IF_NOT_EXIST_SCRIPT,
          1,
          key,
          serialized,
          ttlSeconds.toString()
        );

        const success = result === 1;
        this.logger.debug(`Redis 条件设置: ${key} - ${success ? "成功" : "已存在"}`);

        return success;
      }

      // Fallback: 简单检查后设置（非原子）
      if (!this.hasInFallback(key)) {
        this.setToFallback(key, value, ttl);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`条件设置失败: ${key}`, error);
      return false;
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

  /**
   * 获取连接状态
   */
  getStatus(): string {
    if (this.isConnected && this.client) {
      return this.client.status;
    }
    return "disconnected";
  }

  /**
   * 检查缓存是否启用
   */
  isEnabled(): boolean {
    return this.isConnected || this.fallbackCache.size > 0;
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
