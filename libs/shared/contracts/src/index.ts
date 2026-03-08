/**
 * @oksai/contracts
 *
 * 共享契约 - 集成事件、通用接口定义
 *
 * @packageDocumentation
 */

export {
	type IOksaiIntegrationEvent,
	type OksaiIntegrationEvent
} from './lib/integration-event.interface.js';

export {
	parseOksaiIntegrationEvent,
	isValidOksaiIntegrationEvent
} from './lib/integration-event.parser.js';
