# 多租户管理使用指南

## 快速开始

### 1. 创建租户

作为系统管理员，首先需要创建租户：

```bash
curl -X POST https://api.oksai.cc/api/admin/tenants \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "企业A",
    "slug": "enterprise-a",
    "plan": "PRO",
    "ownerId": "user-123",
    "maxOrganizations": 10,
    "maxMembers": 100,
    "maxStorage": 10737418240
  }'
```

### 2. 激活租户

创建后，租户处于 `pending` 状态，需要激活：

```bash
curl -X POST https://api.oksai.cc/api/admin/tenants/tenant-123/activate \
  -H "Authorization: Bearer <admin-token>"
```

### 3. 用户登录

租户用户登录时，系统会自动识别租户：

```bash
curl -X POST https://api.oksai.cc/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@enterprise-a.com",
    "password": "password123"
  }'
```

JWT Token 中会包含 `tenantId`：

```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "user-456",
    "email": "user@enterprise-a.com",
    "tenantId": "tenant-123"
  }
}
```

---

## 租户识别方式

系统支持多种租户识别方式，按优先级排列：

### 1. JWT Token（推荐）

用户登录后，JWT Token 中包含 `tenantId`，系统自动识别：

```typescript
// JWT Payload
{
  "userId": "user-456",
  "tenantId": "tenant-123",
  "role": "user"
}
```

### 2. HTTP Header

在请求头中指定租户 ID（需要验证用户权限）：

```bash
curl -X GET https://api.oksai.cc/api/organizations \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant-123"
```

### 3. 子域名

使用子域名访问（自动识别）：

```
https://enterprise-a.app.oksai.cc/api/organizations
```

系统会自动将 `enterprise-a` 映射到对应的租户。

### 4. 自定义域名

租户可以绑定自定义域名：

```
https://app.enterprise-a.com/api/organizations
```

### 5. 查询参数（仅开发）

开发环境可以使用查询参数：

```bash
curl -X GET https://api.oksai.cc/api/organizations?tenantId=tenant-123 \
  -H "Authorization: Bearer <token>"
```

---

## 租户配置

### 品牌定制

自定义租户品牌：

```bash
curl -X PUT https://api.oksai.cc/api/tenant/settings \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "branding": {
      "logo": "https://enterprise-a.com/logo.png",
      "primaryColor": "#1890ff",
      "customDomain": "app.enterprise-a.com"
    }
  }'
```

### 功能开关

启用或禁用功能：

```bash
curl -X PUT https://api.oksai.cc/api/tenant/settings \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "twoFactorAuth": true,
      "ssoEnabled": false,
      "webhooksEnabled": true,
      "apiKeysEnabled": true
    }
  }'
```

### 安全配置

配置密码策略和会话超时：

```bash
curl -X PUT https://api.oksai.cc/api/tenant/settings \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "security": {
      "passwordMinLength": 10,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSymbols": true,
      "sessionTimeout": 10080
    }
  }'
```

---

## 配额管理

### 查看配额

查看当前租户的配额使用情况：

```bash
curl -X GET https://api.oksai.cc/api/admin/tenants/tenant-123/usage \
  -H "Authorization: Bearer <admin-token>"
```

响应示例：

```json
{
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
    }
  }
}
```

### 配额限制

创建组织或邀请成员时，系统会自动检查配额：

```typescript
// 创建组织
@Post()
@UseGuards(QuotaGuard)
@CheckQuota('organizations')
async createOrganization(@Body() dto: CreateOrganizationDto) {
  // 自动检查组织配额
  // 如果超限，返回 403 Forbidden
}
```

### 配额超限处理

当配额超限时，API 会返回 403 错误：

```json
{
  "success": false,
  "message": "已达到配额限制，请升级套餐",
  "error": {
    "code": "QUOTA_EXCEEDED",
    "resource": "organizations",
    "current": 10,
    "limit": 10
  }
}
```

前端应该显示友好的提示：

```typescript
try {
  await createOrganization(data);
} catch (error) {
  if (error.code === 'QUOTA_EXCEEDED') {
    showToast('已达到组织数量上限，请升级套餐');
  }
}
```

---

## 域名管理

### 绑定子域名

子域名自动绑定，无需手动操作：

```
enterprise-a.app.oksai.cc -> tenant-123
```

### 绑定自定义域名

绑定自定义域名：

```bash
curl -X POST https://api.oksai.cc/api/tenant/domains \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "app.enterprise-a.com",
    "domainType": "custom"
  }'
```

### DNS 配置

绑定自定义域名后，需要配置 DNS：

```
# CNAME 记录
app.enterprise-a.com -> app.oksai.cc
```

### 验证域名

验证域名所有权（DNS TXT 记录或文件验证）：

```bash
curl -X POST https://api.oksai.cc/api/tenant/domains/app.enterprise-a.com/verify \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant-123"
```

---

## 数据隔离

### 自动隔离

系统自动为所有查询添加租户过滤：

```typescript
// 查询组织时，自动添加 WHERE tenantId = 'tenant-123'
const organizations = await em.find(Organization, {});
```

### 跨租户访问防护

系统会阻止跨租户访问：

```bash
# 租户 A 的用户尝试访问租户 B 的资源
curl -X GET https://api.oksai.cc/api/organizations/org-456 \
  -H "Authorization: Bearer <tenant-a-token>"

# 返回 403 Forbidden
{
  "success": false,
  "message": "无权访问其他租户的资源"
}
```

### 超级管理员

超级管理员可以跨租户操作（需要特殊权限）：

```typescript
@Controller('admin/tenants')
@UseGuards(SuperAdminGuard)
@SkipTenantGuard()
export class AdminTenantController {
  // 超级管理员可以访问所有租户
}
```

---

## 最佳实践

### 1. 始终使用 JWT Token

优先使用 JWT Token 中的 `tenantId`，避免手动指定：

```typescript
// ✅ 推荐
const token = await login(email, password);
// Token 中自动包含 tenantId

// ❌ 不推荐
const headers = {
  'X-Tenant-ID': 'tenant-123',
};
```

### 2. 配额预检查

在 UI 中提前显示配额使用情况：

```typescript
const usage = await getTenantUsage();
const canCreateOrg = usage.organizations.total < usage.organizations.limit;

if (!canCreateOrg) {
  showUpgradeDialog();
}
```

### 3. 错误处理

正确处理租户相关的错误：

```typescript
try {
  await createOrganization(data);
} catch (error) {
  switch (error.code) {
    case 'QUOTA_EXCEEDED':
      showToast('配额不足，请升级套餐');
      break;
    case 'TENANT_SUSPENDED':
      showToast('租户已停用，请联系管理员');
      break;
    case 'FORBIDDEN':
      showToast('无权访问');
      break;
    default:
      showToast('操作失败');
  }
}
```

### 4. 租户切换

如果用户属于多个租户，支持切换：

```typescript
// 切换租户
async function switchTenant(tenantId: string) {
  // 1. 验证用户是否有权访问该租户
  const hasAccess = await checkTenantAccess(userId, tenantId);

  if (!hasAccess) {
    throw new Error('无权访问该租户');
  }

  // 2. 重新生成 JWT Token（包含新的 tenantId）
  const token = await refreshToken(userId, tenantId);

  // 3. 更新本地存储
  localStorage.setItem('token', token);

  // 4. 刷新页面
  window.location.reload();
}
```

### 5. 日志和审计

记录租户操作日志：

```typescript
// 记录租户操作
await logTenantActivity({
  tenantId: 'tenant-123',
  action: 'organization.created',
  resource: 'organization',
  resourceId: 'org-456',
  userId: 'user-789',
  metadata: {
    organizationName: '新组织',
  },
});
```

---

## 常见问题

### Q1: 如何判断当前租户？

从 JWT Token 中解析 `tenantId`：

```typescript
const token = localStorage.getItem('token');
const payload = jwt.decode(token);
const tenantId = payload.tenantId;
```

### Q2: 配额不足怎么办？

联系管理员升级套餐或调整配额：

```bash
curl -X PUT https://api.oksai.cc/api/admin/tenants/tenant-123 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "maxOrganizations": 20,
    "maxMembers": 200
  }'
```

### Q3: 如何绑定自定义域名？

1. 绑定域名
2. 配置 DNS CNAME 记录
3. 验证域名所有权
4. 等待 DNS 生效（可能需要几分钟到几小时）

### Q4: 租户被停用怎么办？

租户被停用后，所有用户无法登录。需要联系管理员重新激活：

```bash
curl -X POST https://api.oksai.cc/api/admin/tenants/tenant-123/activate \
  -H "Authorization: Bearer <admin-token>"
```

### Q5: 如何处理跨租户访问？

系统会自动阻止跨租户访问。如果确实需要跨租户操作，需要超级管理员权限。

---

## 安全建议

1. **不要暴露 Tenant ID** - 不要在客户端代码中硬编码 Tenant ID
2. **使用 HTTPS** - 保护传输数据安全
3. **验证权限** - 始终在服务端验证用户权限
4. **审计日志** - 记录所有租户操作
5. **定期检查配额** - 避免资源滥用

---

## 技术支持

如有问题，请联系：

- 技术支持：support@oksai.cc
- 文档问题：docs@oksai.cc
