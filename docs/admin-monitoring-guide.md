# Admin 插件 - 监控配置指南

> **版本**: v1.0  
> **日期**: 2026-04-01  
> **状态**: 准备配置  
> **优先级**: P0（Critical）

---

## 📋 目录

1. [监控指标定义](#1-监控指标定义)
2. [告警规则配置](#2-告警规则配置)
3. [Dashboard 配置](#3-dashboard-配置)
4. [日志配置](#4-日志配置)
5. [性能监控](#5-性能监控)

---

## 1. 监控指标定义

### 1.1 应用层指标

#### 请求指标

| 指标名称 | 类型 | 描述 | 标签 |
|---------|------|------|------|
| `admin_http_requests_total` | Counter | HTTP 请求总数 | method, endpoint, status |
| `admin_http_request_duration_seconds` | Histogram | HTTP 请求耗时 | method, endpoint |
| `admin_http_requests_in_progress` | Gauge | 正在处理的请求数 | method, endpoint |

#### 错误指标

| 指标名称 | 类型 | 描述 | 标签 |
|---------|------|------|------|
| `admin_errors_total` | Counter | 错误总数 | type, endpoint |
| `admin_auth_failures_total` | Counter | 认证失败次数 | reason |
| `admin_permission_denied_total` | Counter | 权限拒绝次数 | role, permission |

#### 业务指标

| 指标名称 | 类型 | 描述 | 标签 |
|---------|------|------|------|
| `admin_user_operations_total` | Counter | 用户操作次数 | operation, role |
| `admin_impersonation_sessions_active` | Gauge | 活跃的模拟会话数 | - |
| `admin_banned_users_total` | Gauge | 封禁用户总数 | - |

### 1.2 数据库指标

#### 查询性能

| 指标名称 | 类型 | 描述 | 标签 |
|---------|------|------|------|
| `admin_db_query_duration_seconds` | Histogram | 数据库查询耗时 | query_type |
| `admin_db_connections_active` | Gauge | 活跃数据库连接数 | - |
| `admin_db_queries_slow_total` | Counter | 慢查询次数 | query_type |

#### 数据统计

| 指标名称 | 类型 | 描述 | 标签 |
|---------|------|------|------|
| `admin_db_users_total` | Gauge | 用户总数 | role |
| `admin_db_sessions_active` | Gauge | 活跃会话数 | - |
| `admin_db_table_size_bytes` | Gauge | 表大小 | table_name |

---

## 2. 告警规则配置

### 2.1 Prometheus 告警规则

```yaml
# prometheus-alerts.yml
groups:
  - name: admin_critical_alerts
    interval: 30s
    rules:
      # 错误率告警
      - alert: AdminHighErrorRate
        expr: |
          rate(admin_http_requests_total{status=~"5.."}[5m]) 
          / 
          rate(admin_http_requests_total[5m]) 
          > 0.01
        for: 5m
        labels:
          severity: critical
          service: admin
        annotations:
          summary: "Admin 功能错误率过高"
          description: "5 分钟内错误率为 {{ $value | humanizePercentage }}，超过阈值 1%"
          
      # 响应时间告警
      - alert: AdminSlowResponse
        expr: |
          histogram_quantile(0.95, 
            rate(admin_http_request_duration_seconds_bucket[5m])
          ) > 0.5
        for: 5m
        labels:
          severity: warning
          service: admin
        annotations:
          summary: "Admin 功能响应时间过慢"
          description: "P95 响应时间为 {{ $value | humanizeDuration }}，超过阈值 500ms"

      # 权限拒绝告警
      - alert: AdminHighPermissionDenial
        expr: rate(admin_permission_denied_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
          service: admin
        annotations:
          summary: "权限拒绝次数异常"
          description: "5 分钟内权限拒绝 {{ $value }} 次/秒，可能存在权限配置问题"

  - name: admin_database_alerts
    interval: 30s
    rules:
      # 数据库慢查询
      - alert: AdminDatabaseSlowQueries
        expr: rate(admin_db_queries_slow_total[5m]) > 5
        for: 5m
        labels:
          severity: warning
          service: admin
        annotations:
          summary: "数据库慢查询过多"
          description: "5 分钟内慢查询 {{ $value }} 次/秒"
          
      # 数据库连接数告警
      - alert: AdminDatabaseHighConnections
        expr: admin_db_connections_active > 80
        for: 5m
        labels:
          severity: warning
          service: admin
        annotations:
          summary: "数据库连接数过高"
          description: "活跃连接数 {{ $value }}，可能存在连接泄漏"

  - name: admin_business_alerts
    interval: 1m
    rules:
      # 模拟会话异常
      - alert: AdminImpersonationAbnormal
        expr: admin_impersonation_sessions_active > 20
        for: 5m
        labels:
          severity: warning
          service: admin
        annotations:
          summary: "用户模拟会话数异常"
          description: "当前有 {{ $value }} 个活跃的模拟会话，请检查是否异常"
```

### 2.2 Grafana Dashboard 告警

```json
{
  "annotations": {
    "list": [
      {
        "datasource": "Prometheus",
        "enable": true,
        "expr": "ALERTS{alertstate=\"firing\",service=\"admin\"}",
        "iconColor": "red",
        "name": "Admin Alerts"
      }
    ]
  }
}
```

---

## 3. Dashboard 配置

### 3.1 Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Admin Plugin Monitoring",
    "tags": ["admin", "authentication"],
    "timezone": "browser",
    "panels": [
      {
        "title": "请求速率",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "rate(admin_http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "响应时间（P95）",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(admin_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "错误率",
        "type": "graph",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "rate(admin_http_requests_total{status=~\"5..\"}[5m]) / rate(admin_http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "用户操作统计",
        "type": "graph",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "rate(admin_user_operations_total[5m])",
            "legendFormat": "{{operation}} ({{role}})"
          }
        ]
      },
      {
        "title": "数据库查询性能",
        "type": "graph",
        "gridPos": {"x": 0, "y": 16, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(admin_db_query_duration_seconds_bucket[5m]))",
            "legendFormat": "{{query_type}}"
          }
        ]
      },
      {
        "title": "活跃会话",
        "type": "stat",
        "gridPos": {"x": 12, "y": 16, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "admin_db_sessions_active",
            "legendFormat": "Active Sessions"
          }
        ]
      },
      {
        "title": "模拟会话",
        "type": "stat",
        "gridPos": {"x": 18, "y": 16, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "admin_impersonation_sessions_active",
            "legendFormat": "Impersonation Sessions"
          }
        ]
      }
    ]
  }
}
```

### 3.2 关键指标看板

```
Admin Plugin Overview
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  请求成功率         │  平均响应时间       │  错误率             │
│  99.9%             │  45ms              │  0.1%              │
│  ✅ 正常            │  ✅ 正常            │  ✅ 正常            │
└─────────────────────┴─────────────────────┴─────────────────────┘

┌─────────────────────┬─────────────────────┬─────────────────────┐
│  活跃会话数         │  模拟会话数         │  封禁用户数         │
│  1,234             │  2                  │  5                  │
│  📊 上升趋势       │  ✅ 正常            │  ✅ 正常            │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## 4. 日志配置

### 4.1 结构化日志格式

```typescript
// 日志格式示例
{
  "timestamp": "2026-04-01T12:00:00.000Z",
  "level": "info",
  "service": "admin",
  "traceId": "abc-123-def",
  "userId": "user-001",
  "role": "admin",
  "operation": "createUser",
  "endpoint": "/admin/users",
  "method": "POST",
  "statusCode": 201,
  "duration": 45,
  "metadata": {
    "targetUserId": "user-002",
    "targetUserRole": "user"
  }
}
```

### 4.2 关键操作日志

#### 用户管理日志

```typescript
// 用户创建
{
  "operation": "createUser",
  "level": "info",
  "message": "用户创建成功",
  "metadata": {
    "createdUserId": "user-002",
    "createdUserRole": "user",
    "createdBy": "admin-001"
  }
}

// 角色设置
{
  "operation": "setUserRole",
  "level": "warning",
  "message": "用户角色已更改",
  "metadata": {
    "userId": "user-002",
    "oldRole": "user",
    "newRole": "admin",
    "changedBy": "superadmin-001"
  }
}
```

#### 权限验证日志

```typescript
// 权限拒绝
{
  "operation": "checkPermission",
  "level": "warning",
  "message": "权限验证失败",
  "metadata": {
    "userId": "user-001",
    "role": "user",
    "requiredPermission": "user:create",
    "endpoint": "/admin/users"
  }
}
```

#### 用户模拟日志

```typescript
// 模拟开始
{
  "operation": "impersonateUser",
  "level": "warning",
  "message": "用户模拟已开始",
  "metadata": {
    "impersonatorId": "admin-001",
    "impersonatorEmail": "admin@example.com",
    "targetUserId": "user-002",
    "targetUserEmail": "user@example.com",
    "sessionId": "imp-session-001"
  }
}

// 模拟结束
{
  "operation": "stopImpersonating",
  "level": "info",
  "message": "用户模拟已停止",
  "metadata": {
    "impersonatorId": "admin-001",
    "sessionId": "imp-session-001",
    "duration": 1800
  }
}
```

### 4.3 日志级别配置

```typescript
// log-config.ts
export const logConfig = {
  // 全局日志级别
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  
  // 按模块配置
  modules: {
    admin: {
      level: 'info',
      // 关键操作使用 warning 级别
      operations: {
        createUser: 'info',
        setUserRole: 'warning',
        deleteUser: 'warning',
        impersonateUser: 'warning',
        banUser: 'warning'
      }
    },
    
    auth: {
      level: 'info',
      operations: {
        login: 'info',
        logout: 'info',
        permissionCheck: 'debug'
      }
    }
  }
};
```

---

## 5. 性能监控

### 5.1 性能基准

| 操作 | 基准时间 | 告警阈值 |
|------|---------|---------|
| **列出用户** | 50ms | 200ms |
| **创建用户** | 30ms | 100ms |
| **设置角色** | 20ms | 50ms |
| **检查权限** | 5ms | 20ms |
| **模拟用户** | 30ms | 100ms |
| **封禁用户** | 20ms | 50ms |

### 5.2 性能监控脚本

```bash
#!/bin/bash
# scripts/monitor-admin-performance.sh

# 监控 Admin API 性能

API_BASE="http://localhost:3000"
ADMIN_TOKEN="your-admin-token"

echo "开始监控 Admin API 性能..."

# 1. 测试列出用户
echo "测试: GET /admin/users"
time curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_BASE/admin/users?limit=10" -o /dev/null -s

# 2. 测试创建用户
echo "测试: POST /admin/users"
time curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}' \
  "$API_BASE/admin/users" -o /dev/null -s

# 3. 测试权限检查
echo "测试: POST /admin/check-permission"
time curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-001","permissions":{"user":["create"]}}' \
  "$API_BASE/admin/check-permission" -o /dev/null -s

echo "性能监控完成"
```

### 5.3 慢查询监控

```sql
-- PostgreSQL 慢查询监控

-- 启用 pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查询最慢的 10 条 SQL
SELECT 
  query,
  calls,
  total_time / 1000 AS total_time_ms,
  mean_time / 1000 AS mean_time_ms,
  max_time / 1000 AS max_time_ms
FROM pg_stat_statements
WHERE query LIKE '%"user"%'
ORDER BY mean_time DESC
LIMIT 10;

-- 查询执行次数最多的 10 条 SQL
SELECT 
  query,
  calls,
  total_time / 1000 AS total_time_ms
FROM pg_stat_statements
WHERE query LIKE '%admin%'
ORDER BY calls DESC
LIMIT 10;
```

---

## 6. 监控检查清单

### 6.1 部署前检查

- [ ] Prometheus 已配置告警规则
- [ ] Grafana Dashboard 已导入
- [ ] 日志收集已配置
- [ ] 性能基准已测试
- [ ] 告警通知渠道已配置

### 6.2 运行时监控

- [ ] 实时监控错误率
- [ ] 实时监控响应时间
- [ ] 实时监控数据库性能
- [ ] 实时监控用户操作
- [ ] 实时监控模拟会话

### 6.3 告警响应

| 告警级别 | 响应时间 | 处理人 |
|---------|---------|--------|
| **Critical** | < 5 分钟 | 值班工程师 |
| **Warning** | < 30 分钟 | 开发团队 |
| **Info** | < 2 小时 | 运维团队 |

---

## 7. 监控脚本

### 7.1 自动化监控脚本

```bash
#!/bin/bash
# scripts/monitor-admin-health.sh

# 健康检查
check_health() {
  echo "检查 Admin API 健康状态..."
  
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:3000/health)
  
  if [ "$response" -eq 200 ]; then
    echo "✅ Admin API 健康"
  else
    echo "❌ Admin API 不健康（HTTP $response）"
    exit 1
  fi
}

# 指标检查
check_metrics() {
  echo "检查关键指标..."
  
  # 错误率
  error_rate=$(curl -s http://localhost:3000/metrics | \
    grep 'admin_http_requests_total{status=~"5.."}' | \
    awk '{print $2}')
  
  if [ "$error_rate" -gt 0.01 ]; then
    echo "⚠️ 错误率过高：$error_rate"
  else
    echo "✅ 错误率正常：$error_rate"
  fi
}

# 运行检查
check_health
check_metrics

echo "监控检查完成"
```

---

**文档状态**: 📋 准备配置  
**下一步**: 配置 Prometheus 和 Grafana
