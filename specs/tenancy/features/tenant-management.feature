Feature: 租户管理
  作为 SaaS 平台开发者
  我想要管理租户的生命周期
  以便于实现多租户隔离和资源管理

  Background:
    Given 系统已初始化

  @happy-path @tenant-creation
  Scenario: 创建新租户
    Given 用户提供租户信息
      | 字段    | 值          |
      | name    | 测试租户    |
      | slug    | test-tenant |
      | plan    | PRO         |
      | ownerId | user-123    |
    When 创建租户
    Then 租户创建成功
    And 租户状态为 PENDING
    And 租户配额设置为 PRO 套餐默认值
    And 发布 TenantCreated 领域事件

  @validation @slug
  Scenario: 创建租户时 slug 格式无效
    Given 用户提供租户信息
      | 字段    | 值      |
      | name    | 测试租户 |
      | slug    | AB      |
      | plan    | PRO     |
      | ownerId | user-123 |
    When 创建租户
    Then 创建失败
    And 错误信息包含 "slug 必须是 3-100 字符的小写字母、数字或连字符"

  @validation @required-fields
  Scenario: 创建租户时必填字段为空
    Given 用户提供租户信息
      | 字段    | 值   |
      | name    |      |
      | slug    | test |
      | plan    | PRO  |
      | ownerId | user-123 |
    When 创建租户
    Then 创建失败
    And 错误信息包含 "name"

  @state-transition @activation
  Scenario: 激活待审核的租户
    Given 存在一个 PENDING 状态的租户
    When 激活租户
    Then 租户状态变更为 ACTIVE
    And 发布 TenantActivated 领域事件

  @business-rule @activation
  Scenario: 激活非 PENDING 状态的租户
    Given 存在一个 ACTIVE 状态的租户
    When 激活租户
    Then 激活失败
    And 错误信息包含 "只有待审核的租户才能激活"

  @state-transition @suspension
  Scenario: 停用活跃的租户
    Given 存在一个 ACTIVE 状态的租户
    And 停用原因为 "违规操作"
    When 停用租户
    Then 租户状态变更为 SUSPENDED
    And 发布 TenantSuspended 领域事件
    And 记录停用原因为 "违规操作"

  @business-rule @suspension
  Scenario: 停用非 ACTIVE 状态的租户
    Given 存在一个 PENDING 状态的租户
    When 停用租户
    Then 停用失败
    And 错误信息包含 "只有活跃的租户才能停用"

  @plan-change @upgrade
  Scenario: 升级租户套餐
    Given 存在一个 FREE 套餐的租户
    When 变更套餐为 PRO
    Then 套餐变更为 PRO
    And 配额更新为 PRO 套餐默认值
    And 发布 TenantPlanChanged 领域事件

  @plan-change @downgrade @business-rule
  Scenario: 降级租户套餐但当前使用量超限
    Given 存在一个 PRO 套餐的租户
    And 租户当前有 50 个组织
    And 目标套餐 FREE 最多支持 3 个组织
    When 变更套餐为 FREE
    Then 变更失败
    And 错误信息包含 "配额"
