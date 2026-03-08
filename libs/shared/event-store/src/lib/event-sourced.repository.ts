/**
 * 事件溯源仓储基类
 *
 * 提供支持事件溯源的仓储抽象基类，自动处理聚合根持久化和领域事件发布。
 *
 * @packageDocumentation
 */

import type { EntityManager } from "@mikro-orm/core";
import type { AggregateRoot, DomainEvent } from "@oksai/kernel";
import type { EventStorePort } from "./event-store.port.js";
import { StoredEvent } from "./stored-event.entity.js";

/**
 * 事件溯源仓储抽象基类
 *
 * @template T - 聚合根类型
 *
 * @example
 * ```typescript
 * // 订单仓储实现
 * export class OrderRepository extends EventSourcedRepository<Order> {
 *   constructor(em: EntityManager, eventStore: EventStorePort) {
 *     super(em, eventStore, Order);
 *   }
 *
 *   // 添加自定义查询方法
 *   async findByCustomerId(customerId: string): Promise<Order[]> {
 *     return this.em.find(Order, { customerId });
 *   }
 * }
 *
 * // 使用
 * const orderRepo = new OrderRepository(em, eventStore);
 * await orderRepo.save(order);  // 自动发布事件
 * const order = await orderRepo.findById("order-123");
 * ```
 */
export abstract class EventSourcedRepository<T extends AggregateRoot<any>> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly eventStore: EventStorePort,
    protected readonly entityClass: new (...args: any[]) => T
  ) {}

  /**
   * 将领域事件转换为存储事件
   *
   * @param event - 领域事件
   * @returns 存储事件
   * @private
   */
  private domainEventToStoredEvent(event: DomainEvent): StoredEvent {
    return StoredEvent.create({
      eventName: event.eventName,
      aggregateId: event.aggregateId.toString(),
      payload: event.payload as Record<string, unknown>,
      eventVersion: event.eventVersion,
      metadata: {
        eventId: event.eventId,
        occurredAt: event.occurredAt.toISOString(),
      },
    });
  }

  /**
   * 保存聚合根
   *
   * 该方法会：
   * 1. 将聚合根持久化到数据库
   * 2. 提取聚合根的领域事件
   * 3. 将领域事件转换为存储事件并追加到事件存储
   * 4. 清除聚合根的领域事件
   *
   * @param aggregate - 要保存的聚合根
   * @throws 如果事件存储失败
   */
  async save(aggregate: T): Promise<void> {
    this.em.persist(aggregate);

    const events = aggregate.domainEvents;
    if (events.length > 0) {
      const storedEvents = events.map((event) => this.domainEventToStoredEvent(event));
      await this.eventStore.append(aggregate.id.toString(), storedEvents);
      aggregate.clearDomainEvents();
    }
  }

  /**
   * 根据ID查找聚合根
   *
   * @param id - 聚合根ID（字符串或UniqueEntityID）
   * @returns 聚合根实例，如果不存在则返回 null
   */
  async findById(id: string | { toString(): string }): Promise<T | null> {
    const idString = typeof id === "string" ? id : id.toString();
    const aggregate = await this.em.findOne(this.entityClass, {
      id: idString,
    });

    if (!aggregate) {
      return null;
    }

    return aggregate;
  }
}
