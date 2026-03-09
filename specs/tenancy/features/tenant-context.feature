Feature: 租户上下文管理
  作为 NestJS 应用开发者
  我想要自动管理租户上下文
  以便于实现租户隔离

  Background:
    Given 系统已初始化

  @context @header
  Scenario: 从请求头解析租户标识
    Given HTTP 请求携带 X-Tenant-Id 头
      | Header      | Value      |
      | X-Tenant-Id | tenant-123 |
    When 请求进入应用
    Then 自动解析租户信息
    And 设置租户上下文
    And 租户上下文包含 tenant-123

  @context @isolation
  Scenario: 租户上下文隔离
    Given 存在两个租户 tenant-A 和 tenant-B
    And 当前租户上下文为 tenant-A
    When 执行业务操作
    Then 只能访问 tenant-A 的资源
    And 无法访问 tenant-B 的资源
