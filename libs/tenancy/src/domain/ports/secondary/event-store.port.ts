/**
 * 事件存储端口（被驱动端口/出站端口）
 *
 * 定义领域事件持久化的契约
 * 由基础设施层实现
 */

import type { DomainEvent } from "@oksai/domain-core";

/**
 * 事件存储端口接口
 */
export interface IEventStorePort {
  /**
   * 追加事件到事件流
   *
   * @param aggregateId - 聚合根 ID
   * @param events - 领域事件列表
   */
  append(aggregateId: string, events: DomainEvent[]): Promise<void>;

  /**
   * 获取聚合根的事件流
   *
   * @param aggregateId - 聚合根 ID
   * @returns 领域事件列表
   */
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
}
