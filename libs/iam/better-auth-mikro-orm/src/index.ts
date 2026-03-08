/**
 * @oksai/better-auth-mikro-orm
 *
 * Better Auth 的 Mikro ORM 适配器 - oksai 定制版
 *
 * @packageDocumentation
 */

export { type MikroOrmAdapterConfig, mikroOrmAdapter } from "./adapter.js";
export type { AdapterUtils } from "./utils/adapterUtils.js";
export {
  type TransactionConfig,
  TransactionManager,
  type TransactionOptions,
  TransactionTimeoutError,
} from "./utils/transactionManager.js";
