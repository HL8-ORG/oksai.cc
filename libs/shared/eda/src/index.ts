/**
 * @oksai/eda
 *
 * 事件驱动架构模块，提供事件发布订阅、Outbox/Inbox、Kafka 集成功能。
 *
 * @packageDocumentation
 */

// 集成事件（从 @oksai/contracts 重新导出）
export {
	type IOksaiIntegrationEvent,
	type OksaiIntegrationEvent,
	parseOksaiIntegrationEvent,
	isValidOksaiIntegrationEvent
} from '@oksai/contracts';

// 集成事件工厂类（便捷创建事件）
export { IntegrationEvent, type IIntegrationEvent } from './lib/integration-event.js';

// 事件总线
export { type IEventHandler } from './lib/event-handler.js';
export { EventBus } from './lib/event-bus.js';

// Worker 上下文
export {
	withOksaiWorkerContext,
	withOksaiWorkerContextFromJob,
	type WithOksaiWorkerContextFromJobOptions
} from './lib/context/worker-context.util.js';

// Outbox 信封解析
export { type OutboxRowLike, parseIntegrationEventEnvelopeFromOutboxRow } from './lib/outbox/outbox-envelope.js';

// Outbox 生产者
export {
	type BuildIntegrationEventInput,
	type InsertIntegrationOutboxEventOptions,
	buildIntegrationEventFromCurrentContext,
	insertIntegrationOutboxEvent
} from './lib/outbox/outbox-producer.js';

// Outbox 处理器
export {
	type IntegrationOutboxRow,
	type IntegrationOutboxProcessorOptions,
	type OutboxLogger,
	IntegrationOutboxProcessor,
	computeOutboxNextRetrySeconds,
	readOutboxMaxRetryCount,
	computeOutboxLagMs
} from './lib/outbox/outbox-processor.js';

// Outbox 重试工具
export {
	computeOutboxNextRetrySeconds as computeNextRetrySeconds,
	readOutboxMaxRetryCount as getMaxRetryCount
} from './lib/outbox/outbox-retry.util.js';

// Kafka 配置
export { type OksaiKafkaConfig, parseKafkaConfig, parseKafkaEnvConfig } from './lib/kafka/kafka.config.js';

// Kafka 加载器
export {
	type KafkaProducerLike,
	type KafkaConsumerLike,
	type KafkaClientLike,
	type KafkaJsModuleLike,
	dynamicRequire,
	loadKafkaJs
} from './lib/kafka/kafka.loader.js';

// Kafka Producer
export {
	type KafkaLogger,
	type KafkaIntegrationEventProducerOptions,
	KafkaIntegrationEventProducer
} from './lib/kafka/kafka-event-producer.js';

// Kafka Consumer
export {
	type KafkaIntegrationEventConsumerOptions,
	type KafkaIntegrationEventConsumerStartOptions,
	KafkaIntegrationEventConsumer
} from './lib/kafka/kafka-event-consumer.js';

// Workers - Polling Worker
export {
	type PollingWorkerLogger,
	type PollingWorkerEnvOptions,
	type PollingWorkerOptions,
	type PollingWorkerController,
	readBooleanFromEnv,
	readOptionalBooleanFromEnv,
	readOptionalPositiveIntFromEnv,
	createPollingWorker
} from './lib/workers/polling-worker.js';

// Workers - Outbox Publisher
export {
	type IntegrationOutboxPublishRow,
	type IntegrationOutboxPublisherOptions,
	IntegrationOutboxPublisher
} from './lib/workers/outbox-publisher.js';

// Workers - Outbox Reaper
export {
	type IntegrationOutboxProcessingReaperOptions,
	type IntegrationOutboxProcessingRow,
	IntegrationOutboxProcessingReaper
} from './lib/workers/outbox-reaper.js';

// Metrics
export {
	type StartOksaiMetricsOptions,
	type OksaiMetricsRecorder,
	getOksaiMetricsRecorder,
	resetOksaiMetrics,
	startOksaiMetrics
} from './lib/metrics/eda.metrics.js';

// 集成事件订阅者接口
export {
	type IOksaiIntegrationEventSubscriber,
	type SubscriberLogger
} from './lib/subscriber/integration-event-subscriber.interface.js';

// 订阅者 Token
export { OKSAI_INTEGRATION_EVENT_SUBSCRIBER_TYPES } from './lib/subscriber/subscriber.tokens.js';

// 订阅者分发器
export { IntegrationEventSubscriberDispatcherService } from './lib/subscriber/subscriber-dispatcher.service.js';

// Workers - Outbox Projection Processor（CQRS 投影）
export {
	type PublishedIntegrationOutboxRow,
	type IntegrationOutboxProjectionProcessorOptions,
	IntegrationOutboxProjectionProcessor
} from './lib/workers/outbox-projection-processor.js';

// Workers - Subscriber Projection Processor（插件订阅者闭环）
export {
	type IntegrationEventSubscriberProjectionProcessorOptions,
	IntegrationEventSubscriberProjectionProcessor
} from './lib/workers/subscriber-projection-processor.js';
