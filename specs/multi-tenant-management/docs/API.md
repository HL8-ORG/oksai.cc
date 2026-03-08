# 多租户管理 API 文档

## 概述

多租户管理 API 提供完整的租户生命周期管理、配置管理、统计分析和域名管理功能。

## 基础信息

- **Base URL**: `/api`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## 认证

所有 API 请求需要在 Header 中携带 JWT Token：

```
Authorization: Bearer <token>
```

## 租户识别

系统支持多种租户识别方式（按优先级）：

1. **JWT Token** - Token 中的 `tenantId` 字段（最高优先级）
2. **HTTP Header** - `X-Tenant-ID` 请求头
3. **子域名** - `tenant.app.oksai.cc`
4. **自定义域名** - 绑定的自定义域名
5. **查询参数** - `?tenantId=xxx`（仅用于开发/测试）

---

## 租户管理 API（管理员）

### 1. 创建租户

创建新租户。

**请求**

```http
POST /api/admin/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "ownerId": "user-123",
  "maxOrganizations": 10,
  "maxMembers": 100,
  "maxStorage": 10737418240
}
```

**参数说明**

| 字段             | 类型   | 必填 | 说明                                    |
| ---------------- | ------ | ---- | --------------------------------------- |
| name             | string | 是   | 租户名称                                |
| slug             | string | 是   | 租户唯一标识（URL 友好）                |
| plan             | string | 是   | 套餐：FREE / STARTER / PRO / ENTERPRISE |
| ownerId          | string | 是   | 租户所有者用户 ID                       |
| maxOrganizations | number | 否   | 最大组织数（默认：1）                   |
| maxMembers       | number | 否   | 最大成员数（默认：10）                  |
| maxStorage       | number | 否   | 最大存储空间（字节，默认：1GB）         |

**响应**

```json
{
  "success": true,
  "message": "租户创建成功",
  "tenant": {
    "id": "tenant-123",
    "name": "企业A",
    "slug": "enterprise-a",
    "plan": "PRO",
    "status": "pending",
    "ownerId": "user-123",
    "quota": {
      "maxOrganizations": 10,
      "maxMembers": 100,
      "maxStorage": 10737418240
    },
    "createdAt": "2026-03-08T12:00:00Z",
    "updatedAt": "2026-03-08T12:00:00Z"
  }
}
```

**状态码**

- `201` - 创建成功
- `400` - 参数错误（slug 已存在）
- `401` - 未认证
- `403` - 无权限（需要管理员）

---

### 2. 列出租户

获取所有租户列表（分页）。

**请求**

```http
GET /api/admin/tenants?page=1&limit=20&search=企业
Authorization: Bearer <token>
```

**查询参数**

| 参数   | 类型   | 必填 | 说明                                   |
| ------ | ------ | ---- | -------------------------------------- |
| page   | number | 否   | 页码（默认：1）                        |
| limit  | number | 否   | 每页数量（默认：20，最大：100）        |
| search | string | 否   | 搜索关键词（名称、slug）               |
| status | string | 否   | 筛选状态：pending / active / suspended |
| plan   | string | 否   | 筛选套餐                               |

**响应**

```json
{
  "success": true,
  "message": "获取租户列表成功",
  "data": [
    {
      "id": "tenant-123",
      "name": "企业A",
      "slug": "enterprise-a",
      "plan": "PRO",
      "status": "active",
      "ownerId": "user-123",
      "quota": {
        "maxOrganizations": 10,
        "maxMembers": 100,
        "maxStorage": 10737418240
      },
      "usage": {
        "organizations": 5,
        "members": 45,
        "storage": 5368709120
      },
      "createdAt": "2026-03-08T12:00:00Z",
      "updatedAt": "2026-03-08T12:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限

---

### 3. 获取租户详情

获取指定租户的详细信息。

**请求**

```http
GET /api/admin/tenants/:id
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "message": "获取租户成功",
  "tenant": {
    "id": "tenant-123",
    "name": "企业A",
    "slug": "enterprise-a",
    "plan": "PRO",
    "status": "active",
    "ownerId": "user-123",
    "quota": {
      "maxOrganizations": 10,
      "maxMembers": 100,
      "maxStorage": 10737418240
    },
    "usage": {
      "organizations": 5,
      "members": 45,
      "storage": 5368709120
    },
    "settings": {
      "branding": {
        "logo": "https://...",
        "primaryColor": "#1890ff"
      }
    },
    "createdAt": "2026-03-08T12:00:00Z",
    "updatedAt": "2026-03-08T12:00:00Z"
  }
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限
- `404` - 租户不存在

---

### 4. 更新租户

更新租户信息（配额、设置）。

**请求**

```http
PUT /api/admin/tenants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "企业A（更新）",
  "maxOrganizations": 20,
  "maxMembers": 200
}
```

**响应**

```json
{
  "success": true,
  "message": "租户更新成功",
  "tenant": {
    "id": "tenant-123",
    "name": "企业A（更新）",
    "maxOrganizations": 20,
    "maxMembers": 200
  }
}
```

**状态码**

- `200` - 更新成功
- `400` - 参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 租户不存在

---

### 5. 激活租户

激活待审核的租户。

**请求**

```http
POST /api/admin/tenants/:id/activate
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "message": "租户已激活"
}
```

**状态码**

- `200` - 激活成功
- `400` - 租户状态不是 pending
- `401` - 未认证
- `403` - 无权限
- `404` - 租户不存在

---

### 6. 停用租户

停用活跃的租户。

**请求**

```http
POST /api/admin/tenants/:id/suspend
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "违反服务条款"
}
```

**响应**

```json
{
  "success": true,
  "message": "租户已停用"
}
```

**状态码**

- `200` - 停用成功
- `400` - 租户状态不是 active
- `401` - 未认证
- `403` - 无权限
- `404` - 租户不存在

---

### 7. 获取租户使用情况

获取租户的详细使用统计。

**请求**

```http
GET /api/admin/tenants/:id/usage
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "message": "获取使用情况成功",
  "usage": {
    "organizations": {
      "total": 5,
      "active": 5
    },
    "members": {
      "total": 45,
      "active": 42
    },
    "storage": {
      "used": 5368709120,
      "limit": 10737418240,
      "percentage": 50.0
    },
    "webhooks": {
      "total": 10,
      "active": 8
    },
    "sessions": {
      "total": 100,
      "active": 25
    }
  }
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限
- `404` - 租户不存在

---

## 租户配置 API

### 8. 获取租户配置

获取当前租户的配置信息。

**请求**

```http
GET /api/tenant/settings
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**响应**

```json
{
  "success": true,
  "settings": {
    "branding": {
      "logo": "https://example.com/logo.png",
      "primaryColor": "#1890ff",
      "customDomain": "app.enterprise-a.com"
    },
    "features": {
      "twoFactorAuth": true,
      "ssoEnabled": false,
      "webhooksEnabled": true,
      "apiKeysEnabled": true
    },
    "notifications": {
      "emailNotifications": true,
      "slackWebhook": "https://hooks.slack.com/..."
    },
    "security": {
      "passwordMinLength": 8,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSymbols": false,
      "sessionTimeout": 10080
    }
  }
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限（租户 ID 不匹配）

---

### 9. 更新租户配置

更新当前租户的配置。

**请求**

```http
PUT /api/tenant/settings
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
Content-Type: application/json

{
  "branding": {
    "primaryColor": "#ff0000"
  },
  "security": {
    "passwordMinLength": 10
  }
}
```

**响应**

```json
{
  "success": true,
  "message": "配置更新成功",
  "settings": {
    "branding": {
      "primaryColor": "#ff0000"
    },
    "security": {
      "passwordMinLength": 10
    }
  }
}
```

**状态码**

- `200` - 更新成功
- `400` - 参数验证失败
- `401` - 未认证
- `403` - 无权限

---

## 租户统计 API

### 10. 获取统计概览

获取租户的使用统计概览。

**请求**

```http
GET /api/tenant/stats/overview
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**响应**

```json
{
  "success": true,
  "stats": {
    "tenantId": "tenant-123",
    "organizations": {
      "total": 5,
      "active": 5
    },
    "members": {
      "total": 45,
      "active": 42
    },
    "storage": {
      "used": 5368709120,
      "limit": 10737418240,
      "percentage": 50.0
    },
    "webhooks": {
      "total": 10,
      "active": 8
    },
    "sessions": {
      "total": 100,
      "active": 25
    }
  }
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限

---

### 11. 获取使用趋势

获取租户的使用趋势数据。

**请求**

```http
GET /api/tenant/stats/trend?days=30
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**查询参数**

| 参数 | 类型   | 必填 | 说明                           |
| ---- | ------ | ---- | ------------------------------ |
| days | number | 否   | 查询天数（默认：30，最大：90） |

**响应**

```json
{
  "success": true,
  "trend": [
    {
      "date": "2026-03-01",
      "organizations": 3,
      "members": 30,
      "storage": 3221225472
    },
    {
      "date": "2026-03-02",
      "organizations": 3,
      "members": 32,
      "storage": 3221225472
    }
  ]
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限

---

### 12. 获取活动日志

获取租户的活动日志。

**请求**

```http
GET /api/tenant/stats/activity?page=1&limit=20
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**响应**

```json
{
  "success": true,
  "data": [
    {
      "id": "event-123",
      "tenantId": "tenant-123",
      "action": "organization.created",
      "resource": "organization",
      "resourceId": "org-456",
      "userId": "user-789",
      "metadata": {
        "organizationName": "新组织"
      },
      "createdAt": "2026-03-08T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限

---

## 租户域名 API

### 13. 绑定域名

为租户绑定自定义域名。

**请求**

```http
POST /api/tenant/domains
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
Content-Type: application/json

{
  "domain": "app.enterprise-a.com",
  "domainType": "custom"
}
```

**参数说明**

| 字段       | 类型   | 必填 | 说明                         |
| ---------- | ------ | ---- | ---------------------------- |
| domain     | string | 是   | 域名                         |
| domainType | string | 是   | 域名类型：subdomain / custom |

**响应**

```json
{
  "success": true,
  "message": "域名绑定成功",
  "domain": {
    "tenantId": "tenant-123",
    "tenantSlug": "enterprise-a",
    "domain": "app.enterprise-a.com",
    "domainType": "custom",
    "isVerified": false
  }
}
```

**状态码**

- `200` - 绑定成功
- `400` - 域名格式无效或已被绑定
- `401` - 未认证
- `403` - 无权限

---

### 14. 验证域名

验证域名所有权。

**请求**

```http
POST /api/tenant/domains/:domain/verify
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**响应**

```json
{
  "success": true,
  "message": "域名验证成功",
  "verified": true
}
```

**状态码**

- `200` - 验证成功
- `400` - 验证失败
- `401` - 未认证
- `403` - 无权限

---

### 15. 获取租户域名列表

获取租户的所有绑定域名。

**请求**

```http
GET /api/tenant/domains
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**响应**

```json
{
  "success": true,
  "domains": [
    {
      "tenantId": "tenant-123",
      "tenantSlug": "enterprise-a",
      "domain": "enterprise-a.app.oksai.cc",
      "domainType": "subdomain",
      "isVerified": true
    },
    {
      "tenantId": "tenant-123",
      "tenantSlug": "enterprise-a",
      "domain": "app.enterprise-a.com",
      "domainType": "custom",
      "isVerified": true
    }
  ]
}
```

**状态码**

- `200` - 成功
- `401` - 未认证
- `403` - 无权限

---

### 16. 解绑域名

解绑租户的域名。

**请求**

```http
DELETE /api/tenant/domains/:domain
Authorization: Bearer <token>
X-Tenant-ID: tenant-123
```

**响应**

```json
{
  "success": true,
  "message": "域名解绑成功"
}
```

**状态码**

- `200` - 解绑成功
- `401` - 未认证
- `403` - 无权限
- `404` - 域名不存在

---

## 错误响应

所有 API 在发生错误时返回统一格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "TENANT_NOT_FOUND",
    "details": "租户 tenant-123 不存在"
  }
}
```

### 常见错误码

| 错误码                | HTTP 状态码 | 说明                    |
| --------------------- | ----------- | ----------------------- |
| UNAUTHORIZED          | 401         | 未认证或 Token 无效     |
| FORBIDDEN             | 403         | 无权限访问              |
| TENANT_NOT_FOUND      | 404         | 租户不存在              |
| TENANT_ALREADY_EXISTS | 400         | 租户已存在（slug 重复） |
| INVALID_TENANT_STATUS | 400         | 租户状态无效            |
| QUOTA_EXCEEDED        | 403         | 配额超限                |
| DOMAIN_ALREADY_BOUND  | 400         | 域名已被绑定            |
| INVALID_DOMAIN        | 400         | 域名格式无效            |

---

## 配额管理

### 配额检查

系统会自动在以下操作前检查配额：

1. **创建组织** - 检查 `maxOrganizations`
2. **邀请成员** - 检查 `maxMembers`
3. **上传文件** - 检查 `maxStorage`

### 配额超限响应

```json
{
  "success": false,
  "message": "已达到配额限制",
  "error": {
    "code": "QUOTA_EXCEEDED",
    "resource": "organizations",
    "current": 10,
    "limit": 10
  }
}
```

---

## 最佳实践

### 1. 租户识别

优先使用 JWT Token 中的 `tenantId`，确保安全性和一致性。

### 2. 错误处理

始终检查 HTTP 状态码和 `success` 字段，正确处理错误。

### 3. 配额管理

在 UI 中提前显示配额使用情况，避免用户操作时遇到配额限制。

### 4. 域名管理

使用子域名识别时，确保 DNS 配置正确：

```
*.app.oksai.cc -> CNAME -> app.oksai.cc
```

### 5. 安全考虑

- 不要在客户端暴露 `X-Tenant-ID` Header
- 始终在服务端验证租户归属
- 使用 HTTPS 保护传输数据

---

## 变更日志

### v1.0.0 (2026-03-08)

- ✅ 初始版本发布
- ✅ 租户管理 API（CRUD）
- ✅ 租户配置 API
- ✅ 租户统计 API
- ✅ 租户域名 API
- ✅ 配额管理
- ✅ 租户隔离

---

## 联系方式

如有问题，请联系：

- 技术支持：support@oksai.cc
- API 问题：api@oksai.cc
