/**
 * 租户配额卡片组件
 */

import type { TenantQuota, TenantUsage } from "~/lib/api/tenant.types";

interface TenantQuotaCardProps {
  quota: TenantQuota;
  usage: TenantUsage;
  compact?: boolean;
}

export function TenantQuotaCard({ quota, usage, compact = false }: TenantQuotaCardProps) {
  if (compact) {
    return (
      <div className="space-y-1 text-xs">
        <QuotaItem label="组织" current={usage.organizations} limit={quota.maxOrganizations} compact />
        <QuotaItem label="成员" current={usage.members} limit={quota.maxMembers} compact />
        <QuotaItem label="存储" current={usage.storage} limit={quota.maxStorage} unit="GB" compact />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 font-semibold text-lg">配额使用情况</h3>
      <div className="space-y-4">
        <QuotaItem label="组织数量" current={usage.organizations} limit={quota.maxOrganizations} />
        <QuotaItem label="成员数量" current={usage.members} limit={quota.maxMembers} />
        <QuotaItem label="存储空间" current={usage.storage} limit={quota.maxStorage} unit="GB" />
      </div>
    </div>
  );
}

interface QuotaItemProps {
  label: string;
  current: number;
  limit: number;
  unit?: string;
  compact?: boolean;
}

function QuotaItem({ label, current, limit, unit, compact = false }: QuotaItemProps) {
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const isWarning = percentage >= 80 && percentage < 100;
  const isExceeded = percentage >= 100;

  const formatValue = (value: number) => {
    if (unit === "GB") {
      return (value / 1024 / 1024 / 1024).toFixed(2);
    }
    return value.toString();
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}:</span>
        <span className={isExceeded ? "text-destructive font-medium" : ""}>
          {formatValue(current)}/{formatValue(limit)}
          {unit && ` ${unit}`}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        <span className={`text-sm ${isExceeded ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {formatValue(current)} / {formatValue(limit)} {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            isExceeded ? "bg-destructive" : isWarning ? "bg-yellow-500" : "bg-primary"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isWarning && !isExceeded && <p className="mt-1 text-yellow-600 text-xs">配额使用率已超过 80%</p>}
      {isExceeded && <p className="mt-1 text-destructive text-xs">配额已超限</p>}
    </div>
  );
}
