Feature: 多租户管理
  作为 SaaS 平台的企业客户
  我想要 确保我的数据与其他客户完全隔离
  以便于 保护商业机密和用户隐私，满足数据保护法规要求

  Background:
    Given 系统已启动
    And 数据库已连接

  Scenario: 租户识别与数据隔离
    Given 用户已登录，JWT Token 包含 tenantId = "tenant-123"
    And 租户状态为 "ACTIVE"
    And 租户 "tenant-123" 有 5 个用户
    And 租户 "tenant-456" 有 3 个用户
    When 用户请求 GET /api/users
    Then 系统自动注入租户上下文 { tenantId: "tenant-123" }
    And 系统自动应用过滤器 WHERE tenant_id = "tenant-123"
    And 返回租户 "tenant-123" 的用户列表
    And 返回的用户数量为 5
    And 不包含其他租户的用户

  Scenario: 创建租户并设置配额
    Given 系统管理员已登录
    When 管理员创建租户
      | name     | slug       | plan | ownerId      | maxMembers | maxOrganizations |
      | 企业A    | enterprise-a | PRO  | admin-user-1 | 100        | 10               |
    Then 系统创建 Tenant 实体
    And 系统设置配额 { maxMembers: 100, maxOrganizations: 10, maxStorage: 10737418240 }
    And 发布 TenantCreatedEvent 领域事件
    And 租户状态为 "PENDING"
    And 返回租户 ID
    And 返回 HTTP 状态码 201

  Scenario: 租户激活
    Given 系统管理员已登录
    And 租户 "tenant-123" 状态为 "PENDING"
    When 管理员激活租户 "tenant-123"
    Then 租户状态变为 "ACTIVE"
    And 发布 TenantActivatedEvent 领域事件
    And 返回 HTTP 状态码 200

  Scenario: 检查租户配额
    Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 99 }
    And 用户已登录，属于租户 "tenant-123"
    When 邀请新成员
    Then 系统检查配额：99 < 100
    And 允许邀请
    And 返回 HTTP 状态码 201

  Scenario: 无效租户访问
    Given 用户请求中缺少租户标识
    When 用户访问 GET /api/users
    Then 返回 HTTP 状态码 400
    And 错误信息包含 "缺少租户标识"

  Scenario: 租户已停用
    Given 用户已登录，租户 "tenant-123" 状态为 "SUSPENDED"
    When 用户请求 GET /api/users
    Then 返回 HTTP 状态码 403
    And 错误信息包含 "租户已被停用"

  Scenario: 跨租户访问资源
    Given 用户属于租户 "tenant-123"
    And 资源 "resource-456" 属于租户 "tenant-456"
    When 用户尝试访问资源 "resource-456"
    Then TenantGuard 检查失败
    And 返回 HTTP 状态码 403
    And 错误信息包含 "无权访问其他租户的资源"

  Scenario: 超过配额限制
    Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 100 }
    And 用户已登录，属于租户 "tenant-123"
    When 邀请新成员
    Then 系统检查配额：100 >= 100
    And 返回 HTTP 状态码 403
    And 错误信息包含 "已达到配额限制"

  Scenario: 租户 ID 不一致
    Given 用户已登录，JWT Token 中 tenantId = "tenant-123"
    And 请求 Header 中 X-Tenant-ID = "tenant-456"
    When 系统验证租户标识
    Then 使用 JWT Token 中的 tenantId = "tenant-123"
    And 记录警告日志包含 "租户 ID 不一致"

  Scenario: 租户配额为零
    Given 租户 "tenant-123" 配额 { maxMembers: 0 }
    And 用户已登录，属于租户 "tenant-123"
    When 邀请新成员
    Then 返回 HTTP 状态码 403
    And 错误信息包含 "租户配额为零"

  Scenario: 租户切换组织
    Given 用户属于租户 "tenant-123"
    And 用户属于组织 "org-1" 和 "org-2"
    And 用户当前活动组织为 "org-1"
    When 用户切换活动组织到 "org-2"
    Then 更新 JWT Token 中的 activeOrganizationId
    And 租户上下文保持不变 { tenantId: "tenant-123" }
    And 返回 HTTP 状态码 200
