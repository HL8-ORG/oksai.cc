/**
 * @oksai/event-store
 *
 * 事件存储模块，提供事件溯源的核心抽象。
 *
 * @packageDocumentation
 */

// 审计信息
export type {
  AggregateRootOptions,
  AuditInfo,
} from "./lib/audit-info.interface.js";
// 仓储
export { EventSourcedRepository } from "./lib/event-sourced.repository.js";
// 端口
export type { EventStorePort } from "./lib/event-store.port.js";
// 值对象
export { EventStream } from "./lib/event-stream.vo.js";
// 扩展
export {
  AIEnabledAggregateRoot,
  type AIProcessingMetadata,
  EmbeddingStatus,
  type ETLMetadata,
  type ExternalIdMap,
  SyncableAggregateRoot,
  SyncStatus,
} from "./lib/extensions/index.js";
// 实体
export {
  StoredEvent,
  type StoredEventProps,
  StoredEventStatus,
} from "./lib/stored-event.entity.js";
