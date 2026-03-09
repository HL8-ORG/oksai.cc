# 租户管理 API 使用指南

## 概述

租户管理 API 提供了完整的多租户管理功能，包括租户的创建、查询、更新、激活、停用等操作。所有接口均需要超级管理员权限。

**基础 URL**: `http://localhost:3000/api/admin/tenants`

**认证方式**: Better Auth Session

**权限要求**: `superadmin` 角色

## 快速开始

### 1. 认证

所有租户管理 API 都需要认证。请确保请求中包含有效的会话 Cookie。

```typescript
// 使用 fetch
const response = await fetch('http://localhost:3000/api/admin/tenants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // 包含 Cookie
  body: JSON.stringify({
    name: '企业A',
    slug: 'enterprise-a',
    plan: 'PRO',
    ownerId: 'user-123',
  }),
});
```

```bash
# 使用 curl
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "name": "企业A",
    "slug": "enterprise-a",
    "plan": "PRO",
    "ownerId": "user-123"
  }'
```

## API 端点

### 1. 创建租户

**POST** `/api/admin/tenants`

创建新租户并设置初始配额。

#### 请求体

```json
{
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "ownerId": "user-123",
  "maxOrganizations": 10,
  "maxMembers": 100,
  "maxStorage": 107374182400
}
```

#### 参数说明

| 字段             | 类型   | 必填 | 说明                                       | 示例           |
| ---------------- | ------ | ---- | ------------------------------------------ | -------------- |
| name             | string | ✅   | 租户名称                                   | "企业A"        |
| slug             | string | ✅   | 租户标识（只能包含小写字母、数字和连字符） | "enterprise-a" |
| plan             | enum   | ✅   | 租户套餐：FREE, STARTER, PRO, ENTERPRISE   | "PRO"          |
| ownerId          | string | ✅   | 所有者用户 ID                              | "user-123"     |
| maxOrganizations | number | ⭕   | 最大组织数量（默认：1）                    | 10             |
| maxMembers       | number | ⭕   | 最大成员数量（默认：10）                   | 100            |
| maxStorage       | number | ⭕   | 最大存储空间，单位：字节（默认：1GB）      | 107374182400   |

#### 响应示例

```json
{
  "success": true,
  "message": "租户创建成功",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "企业A",
    "slug": "enterprise-a",
    "plan": "PRO",
    "status": "PENDING",
    "ownerId": "user-123",
    "quota": {
      "maxOrganizations": 10,
      "maxMembers": 100,
      "maxStorage": 107374182400
    },
    "createdAt": "2026-03-09T02:00:00.000Z",
    "updatedAt": "2026-03-09T02:00:00.000Z"
  }
}
```

#### 错误响应

| 状态码 | 说明                   |
| ------ | ---------------------- |
| 400    | 参数错误或 slug 已存在 |
| 403    | 需要超级管理员权限     |
| 401    | 未认证                 |

---

### 2. 列出租户

**GET** `/api/admin/tenants`

获取所有租户列表，支持搜索、分页和筛选。

#### 查询参数

| 参数   | 类型   | 必填 | 说明                                          | 默认值 |
| ------ | ------ | ---- | --------------------------------------------- | ------ |
| search | string | ⭕   | 搜索关键词（名称或 slug）                     | -      |
| status | enum   | ⭕   | 租户状态：PENDING, ACTIVE, SUSPENDED, DELETED | -      |
| plan   | enum   | ⭕   | 租户套餐：FREE, STARTER, PRO, ENTERPRISE      | -      |
| page   | number | ⭕   | 页码                                          | 1      |
| limit  | number | ⭕   | 每页数量（1-100）                             | 20     |

#### 请求示例

```bash
# 获取所有租户
curl -X GET "http://localhost:3000/api/admin/tenants" -b "cookies.txt"

# 搜索租户
curl -X GET "http://localhost:3000/api/admin/tenants?search=企业" -b "cookies.txt"

# 筛选状态
curl -X GET "http://localhost:3000/api/admin/tenants?status=ACTIVE&plan=PRO" -b "cookies.txt"

# 分页
curl -X GET "http://localhost:3000/api/admin/tenants?page=2&limit=10" -b "cookies.txt"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "企业A",
      "slug": "enterprise-a",
      "plan": "PRO",
      "status": "ACTIVE",
      "ownerId": "user-123",
      "quota": {
        "maxOrganizations": 10,
        "maxMembers": 100,
        "maxStorage": 107374182400
      },
      "createdAt": "2026-03-09T02:00:00.000Z",
      "updatedAt": "2026-03-09T02:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### 3. 获取租户详情

**GET** `/api/admin/tenants/:id`

获取指定租户的详细信息，包括使用情况。

#### 路径参数

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | ✅   | 租户 ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/admin/tenants/550e8400-e29b-41d4-a716-446655440000" \
  -b "cookies.txt"
```

#### 响应示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "企业A",
  "slug": "enterprise-a",
  "plan": "PRO",
  "status": "ACTIVE",
  "ownerId": "user-123",
  "quota": {
    "maxOrganizations": 10,
    "maxMembers": 100,
    "maxStorage": 107374182400
  },
  "usage": {
    "organizations": 3,
    "members": 25,
    "storage": 2147483648
  },
  "createdAt": "2026-03-09T02:00:00.000Z",
  "updatedAt": "2026-03-09T02:00:00.000Z"
}
```

#### 错误响应

| 状态码 | 说明               |
| ------ | ------------------ |
| 404    | 租户不存在         |
| 403    | 需要超级管理员权限 |
| 401    | 未认证             |

---

### 4. 更新租户

**PUT** `/api/admin/tenants/:id`

更新租户信息和配额。

#### 路径参数

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | ✅   | 租户 ID |

#### 请求体

```json
{
  "name": "企业A（更新）",
  "maxOrganizations": 20,
  "maxMembers": 200,
  "maxStorage": 214748364800
}
```

#### 参数说明

所有字段均为可选，只更新提供的字段。

| 字段             | 类型   | 说明         |
| ---------------- | ------ | ------------ |
| name             | string | 租户名称     |
| slug             | string | 租户标识     |
| plan             | enum   | 租户套餐     |
| maxOrganizations | number | 最大组织数量 |
| maxMembers       | number | 最大成员数量 |
| maxStorage       | number | 最大存储空间 |

#### 请求示例

```bash
curl -X PUT "http://localhost:3000/api/admin/tenants/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "name": "企业A（更新）",
    "maxMembers": 200
  }'
```

#### 响应示例

```json
{
  "success": true,
  "message": "租户更新成功",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "企业A（更新）",
    "slug": "enterprise-a",
    "plan": "PRO",
    "status": "ACTIVE",
    "ownerId": "user-123",
    "quota": {
      "maxOrganizations": 10,
      "maxMembers": 200,
      "maxStorage": 107374182400
    },
    "createdAt": "2026-03-09T02:00:00.000Z",
    "updatedAt": "2026-03-09T03:00:00.000Z"
  }
}
```

---

### 5. 激活租户

**POST** `/api/admin/tenants/:id/activate`

激活待审核的租户，使其可以正常使用系统。

#### 路径参数

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | ✅   | 租户 ID |

#### 前置条件

- 租户状态必须为 `PENDING`

#### 请求示例

```bash
curl -X POST "http://localhost:3000/api/admin/tenants/550e8400-e29b-41d4-a716-446655440000/activate" \
  -b "cookies.txt"
```

#### 响应示例

```json
{
  "success": true,
  "message": "租户激活成功",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "企业A",
    "status": "ACTIVE",
    ...
  }
}
```

#### 错误响应

| 状态码 | 说明               |
| ------ | ------------------ |
| 400    | 租户状态不允许激活 |
| 404    | 租户不存在         |

---

### 6. 停用租户

**POST** `/api/admin/tenants/:id/suspend`

停用租户，租户将无法访问系统。

#### 路径参数

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | ✅   | 租户 ID |

#### 请求体

```json
{
  "reason": "违反服务条款"
}
```

#### 前置条件

- 租户状态必须为 `ACTIVE`

#### 请求示例

```bash
curl -X POST "http://localhost:3000/api/admin/tenants/550e8400-e29b-41d4-a716-446655440000/suspend" \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "reason": "违反服务条款"
  }'
```

#### 响应示例

```json
{
  "success": true,
  "message": "租户停用成功",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "企业A",
    "status": "SUSPENDED",
    ...
  }
}
```

#### 错误响应

| 状态码 | 说明               |
| ------ | ------------------ |
| 400    | 租户状态不允许停用 |
| 404    | 租户不存在         |

---

### 7. 获取租户使用情况

**GET** `/api/admin/tenants/:id/usage`

获取租户的配额和使用情况详情。

#### 路径参数

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | ✅   | 租户 ID |

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/admin/tenants/550e8400-e29b-41d4-a716-446655440000/usage" \
  -b "cookies.txt"
```

#### 响应示例

```json
{
  "quota": {
    "maxOrganizations": 10,
    "maxMembers": 100,
    "maxStorage": 107374182400
  },
  "usage": {
    "organizations": 3,
    "members": 25,
    "storage": 2147483648
  },
  "available": {
    "organizations": 7,
    "members": 75,
    "storage": 105223698432
  }
}
```

---

## 常见用例

### 用例 1: 创建并激活新租户

```typescript
// 1. 创建租户
const createResponse = await fetch('http://localhost:3000/api/admin/tenants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: '新企业',
    slug: 'new-enterprise',
    plan: 'PRO',
    ownerId: 'user-456',
    maxOrganizations: 10,
    maxMembers: 100,
  }),
});

const { tenant } = await createResponse.json();

// 2. 激活租户
const activateResponse = await fetch(
  `http://localhost:3000/api/admin/tenants/${tenant.id}/activate`,
  {
    method: 'POST',
    credentials: 'include',
  },
);

console.log('租户已激活:', await activateResponse.json());
```

### 用例 2: 监控租户使用情况

```typescript
// 定期检查租户使用情况
async function monitorTenantUsage(tenantId: string) {
  const response = await fetch(
    `http://localhost:3000/api/admin/tenants/${tenantId}/usage`,
    { credentials: 'include' },
  );

  const { quota, usage, available } = await response.json();

  // 检查是否接近配额限制
  if (available.members < 10) {
    console.warn(`租户 ${tenantId} 成员数量接近限制`);
  }

  if (available.storage < 1073741824) {
    // 小于 1GB
    console.warn(`租户 ${tenantId} 存储空间即将用尽`);
  }
}
```

### 用例 3: 批量更新配额

```typescript
// 为所有 PRO 套餐租户增加配额
async function upgradeProTenants() {
  // 1. 获取所有 PRO 租户
  const response = await fetch(
    'http://localhost:3000/api/admin/tenants?plan=PRO&limit=100',
    { credentials: 'include' },
  );

  const { data: tenants } = await response.json();

  // 2. 批量更新
  for (const tenant of tenants) {
    await fetch(`http://localhost:3000/api/admin/tenants/${tenant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        maxMembers: 200, // 增加到 200
        maxStorage: 214748364800, // 增加到 200GB
      }),
    });
  }
}
```

---

## 套餐说明

### FREE（免费版）

- 最大组织数：1
- 最大成员数：5
- 最大存储空间：1GB

### STARTER（入门版）

- 最大组织数：3
- 最大成员数：20
- 最大存储空间：10GB

### PRO（专业版）

- 最大组织数：10
- 最大成员数：100
- 最大存储空间：100GB

### ENTERPRISE（企业版）

- 最大组织数：无限制
- 最大成员数：无限制
- 最大存储空间：无限制

---

## 状态流转

```
PENDING（待审核）
    ↓ activate()
ACTIVE（活跃）
    ↓ suspend()
SUSPENDED（已停用）
    ↓
DELETED（已删除）
```

**注意事项：**

1. 只有 `PENDING` 状态的租户才能激活
2. 只有 `ACTIVE` 状态的租户才能停用
3. `DELETED` 状态为软删除，数据仍保留

---

## 错误处理

### 常见错误码

| 状态码 | 说明         | 处理建议                       |
| ------ | ------------ | ------------------------------ |
| 400    | 请求参数错误 | 检查请求体格式和字段值         |
| 401    | 未认证       | 确保已登录并包含会话 Cookie    |
| 403    | 权限不足     | 确保用户具有 `superadmin` 角色 |
| 404    | 资源不存在   | 检查租户 ID 是否正确           |
| 409    | 资源冲突     | slug 已存在，请使用其他标识    |

### 错误响应格式

```json
{
  "statusCode": 400,
  "message": "参数错误",
  "error": "Bad Request"
}
```

---

## 最佳实践

1. **使用有意义的 slug**
   - 使用公司名称的简写或域名
   - 避免使用特殊字符
   - 保持唯一性

2. **合理设置配额**
   - 根据套餐设置合理的初始配额
   - 定期监控使用情况
   - 及时调整配额避免超限

3. **状态管理**
   - 新注册租户默认为 `PENDING` 状态
   - 审核通过后及时激活
   - 停用前通知租户管理员

4. **安全考虑**
   - 所有操作需要 `superadmin` 权限
   - 记录所有管理操作日志
   - 定期审计租户状态

---

## 相关文档

- [Swagger API 文档](http://localhost:3000/api/swagger)
- [Better Auth 文档](../../libs/iam/nestjs-better-auth/README.md)
- [多租户架构设计](./design.md)

---

**最后更新**: 2026-03-09  
**版本**: 1.0.0
