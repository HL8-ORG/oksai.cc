Feature: 租户管理 API
  作为系统管理员
  我想要通过 REST API 管理租户
  以便于实现租户的自动化管理和监控

  Background:
    Given 系统已启动
    And 我已认证为超级管理员

  @api @create @e2e
  Scenario: 通过 API 创建租户
    Given 准备创建租户的请求数据
      | 字段              | 值              |
      | name              | 测试企业        |
      | slug              | test-enterprise |
      | plan              | PRO             |
      | ownerId           | user-admin-001  |
      | maxOrganizations  | 50              |
      | maxMembers        | 500             |
      | maxStorage        | 107374182400    |
    When 发送 POST 请求到 /api/admin/tenants
    Then 响应状态码为 201
    And 响应包含租户 ID
    And 租户状态为 PENDING
    And 租户配额符合 PRO 套餐

  @api @validation @slug @e2e
  Scenario: 通过 API 创建租户时 slug 重复
    Given 系统中已存在 slug 为 "existing-tenant" 的租户
    And 准备创建租户的请求数据
      | 字段    | 值               |
      | name    | 新租户           |
      | slug    | existing-tenant  |
      | plan    | PRO              |
      | ownerId | user-admin-001   |
    When 发送 POST 请求到 /api/admin/tenants
    Then 响应状态码为 400
    And 错误信息包含 "slug 已存在"

  @api @list @pagination @e2e
  Scenario: 通过 API 列出租户
    Given 系统中存在 25 个租户
    When 发送 GET 请求到 /api/admin/tenants?page=2&limit=10
    Then 响应状态码为 200
    And 响应包含 10 个租户
    And 响应包含分页信息
      | 字段  | 值    |
      | page  | 2     |
      | limit | 10    |
      | total | 25    |

  @api @get @e2e
  Scenario: 通过 API 获取租户详情
    Given 系统中存在租户 "tenant-001"
    When 发送 GET 请求到 /api/admin/tenants/tenant-001
    Then 响应状态码为 200
    And 响应包含租户详细信息
    And 响应包含租户使用情况

  @api @get @not-found @e2e
  Scenario: 通过 API 获取不存在的租户
    Given 系统中不存在租户 "non-existent-id"
    When 发送 GET 请求到 /api/admin/tenants/non-existent-id
    Then 响应状态码为 404
    And 错误信息包含 "租户不存在"

  @api @activate @e2e
  Scenario: 通过 API 激活租户
    Given 系统中存在 PENDING 状态的租户 "tenant-001"
    When 发送 POST 请求到 /api/admin/tenants/tenant-001/activate
    Then 响应状态码为 200
    And 租户状态变更为 ACTIVE
    And 响应消息为 "租户激活成功"

  @api @activate @business-rule @e2e
  Scenario: 通过 API 激活已激活的租户
    Given 系统中存在 ACTIVE 状态的租户 "tenant-001"
    When 发送 POST 请求到 /api/admin/tenants/tenant-001/activate
    Then 响应状态码为 400
    And 错误信息包含 "只有待审核的租户才能激活"

  @api @suspend @e2e
  Scenario: 通过 API 停用租户
    Given 系统中存在 ACTIVE 状态的租户 "tenant-001"
    And 停用原因为 "违反服务条款"
    When 发送 POST 请求到 /api/admin/tenants/tenant-001/suspend
      | 字段   | 值             |
      | reason | 违反服务条款   |
    Then 响应状态码为 200
    And 租户状态变更为 SUSPENDED
    And 记录停用原因为 "违反服务条款"

  @api @suspend @business-rule @e2e
  Scenario: 通过 API 停用已停用的租户
    Given 系统中存在 SUSPENDED 状态的租户 "tenant-001"
    When 发送 POST 请求到 /api/admin/tenants/tenant-001/suspend
      | 字段   | 值         |
      | reason | 测试停用   |
    Then 响应状态码为 400
    And 错误信息包含 "只有活跃的租户才能停用"

  @api @update @quota @e2e
  Scenario: 通过 API 更新租户配额
    Given 系统中存在租户 "tenant-001"
    And 当前配额为
      | 字段              | 值  |
      | maxOrganizations  | 10  |
      | maxMembers        | 100 |
    When 发送 PUT 请求到 /api/admin/tenants/tenant-001
      | 字段              | 值  |
      | maxOrganizations  | 50  |
      | maxMembers        | 500 |
    Then 响应状态码为 200
    And 配额更新成功

  @api @usage @e2e
  Scenario: 通过 API 获取租户使用情况
    Given 系统中存在租户 "tenant-001"
    And 租户已使用
      | 字段          | 值  |
      | organizations  | 5   |
      | members        | 45  |
      | storage        | 0   |
    When 发送 GET 请求到 /api/admin/tenants/tenant-001/usage
    Then 响应状态码为 200
    And 响应包含配额信息
    And 响应包含使用情况
    And 响应包含剩余可用量

  @api @auth @forbidden @e2e
  Scenario: 非管理员访问租户管理 API
    Given 我已认证为普通用户
    When 发送 GET 请求到 /api/admin/tenants
    Then 响应状态码为 403
    And 错误信息包含 "需要超级管理员权限"
