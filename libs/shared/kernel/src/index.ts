/**
 * @oksai/kernel
 *
 * DDD 核心基类库，提供领域驱动设计的基础设施。
 *
 * @packageDocumentation
 */

export { AggregateRoot } from "./lib/aggregate-root.aggregate";
export { DomainEvent, type DomainEventProps } from "./lib/domain-event";
export { Entity } from "./lib/entity";
export { Guard } from "./lib/guard";
// 核心类型
export { Result } from "./lib/result";
export { UniqueEntityID } from "./lib/unique-entity-id.vo";
export { ValueObject } from "./lib/value-object.vo";
