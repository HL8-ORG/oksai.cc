# 取消原因必填规则决策

## ADR-001：存储在数据库列还是 Metadata JSON

### 背景

需要在 EventType 上存储“取消原因必填规则”配置。

### 备选方案

1. **新增枚举数据库列** —— 需要迁移，类型安全，查询更清晰
2. **使用 Metadata JSON 字段** —— 不需要迁移，但对于核心设置类型安全较弱

### 决策

使用专用数据库列，并配合 Prisma 枚举（`CancellationReasonRequirement`）。

理由：
- 这是核心预订流程设置，类似 `disableCancelling` 和 `requiresConfirmation`
- 数据库层类型安全
- 在取消校验逻辑中查询更清晰
- 与类似设置（`disableCancelling`、`disableRescheduling`）的存储方式一致

### 影响

- 需要数据库迁移
- 枚举值具备类型安全
- 查询时可直接访问列（无需解析 JSON）
