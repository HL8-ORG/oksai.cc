/**
 * 驱动端口（入站端口）导出
 *
 * 定义应用层提供的功能接口
 */

export type {
  ActivateTenantCommand,
  CreateTenantCommand,
  ITenantCommandPort,
  SuspendTenantCommand,
  UpdateTenantQuotaCommand,
} from "./tenant-command.port.js";
export type {
  ITenantQueryPort,
  QuotaCheckResult,
  TenantDto,
} from "./tenant-query.port.js";
