# 取消原因必填规则设计

## 概述

在 Event Type 的高级设置中新增一个下拉选项，让主持人配置取消原因在主持人和/或参会人侧何时必填。

## 问题陈述

当前取消原因始终为可选。主持人需要能够强制填写取消原因，以便更好地追踪和问责。

## 用户故事

- 作为主持人，我希望要求参会人填写取消原因，以便了解预订被取消的原因
- 作为主持人，我希望要求我的团队填写取消原因，以便留存取消记录
- 作为主持人，我希望在不需要时将取消原因设为可选

## 技术设计

### 数据库变更

新增枚举 `CancellationReasonRequirement`，取值为：
- `MANDATORY_BOTH`
- `MANDATORY_HOST_ONLY`
- `MANDATORY_ATTENDEE_ONLY`
- `OPTIONAL_BOTH`

在 EventType 模型新增 `requiresCancellationReason` 列，默认值为 `MANDATORY_HOST_ONLY`。

位置：`packages/prisma/schema.prisma`（在 `disableCancelling` / `disableRescheduling` 附近）

### API 变更

更新 `packages/features/bookings/lib/handleCancelBooking.ts`，根据以下条件校验取消原因：
- Event type 的 `requiresCancellationReason` 设置
- 取消发起方（host 或 attendee）

### UI 变更

**Event Type 设置**

位置：`apps/web/modules/event-types/components/tabs/advanced/EventAdvancedTab.tsx`

在 Booking Questions 区块之后、`RequiresConfirmationController` 之前新增下拉框：
- 标签："Require cancellation reason"
- 描述："Ask for a reason when someone cancels a booking"
- 选项：Mandatory for both、Mandatory for host only（默认）、Mandatory for attendee only、Optional for both

**取消预订**

位置：`apps/web/components/booking/CancelBooking.tsx`

- 新增 `requiresCancellationReason` 属性
- 将硬编码的 `hostMissingCancellationReason` 逻辑替换为基于设置的可配置校验
- 当原因为必填时，在文本域显示必填标识

## 数据流

1. EventType 在数据库中存储 `requiresCancellationReason`
2. `getEventTypesFromDB`（`apps/web/lib/booking.ts`）在 select 中包含该字段
3. 该值通过页面 props 传递到 booking 视图
4. `CancelBooking` 组件使用该值进行校验

需要透传属性的文件：
- `apps/web/lib/booking.ts`
- `apps/web/modules/bookings/views/bookings-single-view.tsx`
- `apps/web/components/dialog/CancelBookingDialog.tsx`

## 边界情况

- Platform 用户：应遵循该设置
- Team booking：无论团队上下文如何都应应用该设置
- 列值为 Null：默认按 `MANDATORY_HOST_ONLY` 处理
- 默认 event types（无 eventTypeId）：使用默认 `MANDATORY_HOST_ONLY`

## 范围外

- 改期原因配置（独立功能）
- 自定义原因下拉选项
- 原因分析/报表
