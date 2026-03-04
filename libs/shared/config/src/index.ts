/**
 * @oksai/config
 *
 * 基于 @nestjs/config 增强的配置管理模块，提供：
 * - 类型安全的配置读取（getInt, getUrl, getDurationMs 等）
 * - zod schema 验证
 * - 命名空间配置分组
 * - 配置缓存
 * - 边界校验（min/max）
 * - Result 类型返回
 * - 中文错误消息
 *
 * @packageDocumentation
 */

// 重导出 zod（方便使用）
export { z } from "zod";
// 服务和模块
// Schema 相关
export {
  ConfigEnvError,
  ConfigModule,
  type ConfigModuleOptions,
  type ConfigOptions,
  ConfigSchemaError,
  ConfigService,
  env,
  envSchema,
  getNamespaceToken,
  type NamespaceConfig,
  type NamespaceDefinition,
  validateConfig,
} from "./lib/config.service";
// 选项类型
export type {
  EnvBoolOptions,
  EnvDurationMsOptions,
  EnvEnumOptions,
  EnvFloatOptions,
  EnvIntOptions,
  EnvJsonOptions,
  EnvListOptions,
  EnvStringOptions,
  EnvUrlOptions,
} from "./lib/config-env";
