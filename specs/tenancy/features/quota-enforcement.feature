Feature: 租户配额管理
  作为租户管理员
  我想要管理租户配额
  以便于控制资源使用

  Background:
    Given 系统已初始化

  @quota @check
  Scenario: 检查配额使用情况
    Given 存在一个租户
    And 租户配额为
      | 资源           | 限制值 | 当前使用 |
      | maxOrganizations | 10    | 5       |
      | maxMembers       | 50    | 30      |
    When 检查组织配额
    Then 返回配额信息
    And 当前使用 5 个组织
    And 剩余可用 5 个组织

  @quota @exceeded
  Scenario: 配额超限拒绝创建
    Given 存在一个租户
    And 租户已创建 10 个组织（达到上限）
    When 尝试创建第 11 个组织
    Then 创建失败
    And 错误信息包含 "配额超限"
