/**
 * TTL 抖动服务
 *
 * @module common/ttl-jitter.service
 */

import { Injectable } from "@nestjs/common";

/**
 * TTL 抖动服务
 *
 * @description
 * 为缓存 TTL 添加随机抖动，防止缓存雪崩
 *
 * **工作原理**：
 * - 为 TTL 添加 ±10% 的随机抖动
 * - 避免大量缓存在同一时间失效
 * - 分散数据库压力
 *
 * @example
 * ```typescript
 * const jitterService = new TTLJitterService();
 * const ttlWithJitter = jitterService.addJitter(60000); // 54000-66000ms
 * ```
 */
@Injectable()
export class TTLJitterService {
  /** 抖动方差（±10%） */
  private readonly VARIANCE = 0.1;

  /**
   * 为 TTL 添加随机抖动
   *
   * @param ttl - 原始 TTL（毫秒）
   * @returns 添加抖动后的 TTL（毫秒）
   *
   * @example
   * ```typescript
   * const ttl = 60000; // 60 秒
   * const ttlWithJitter = service.addJitter(ttl); // 54-66 秒
   * ```
   */
  addJitter(ttl: number): number {
    if (ttl <= 0) {
      return 0;
    }

    const variance = this.VARIANCE * ttl;
    const jitter = variance * Math.random();
    const ttlWithJitter = Math.floor(ttl - variance / 2 + jitter);

    return Math.max(0, ttlWithJitter);
  }
}
