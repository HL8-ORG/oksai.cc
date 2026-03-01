# 取消原因必填规则实现

## 状态：已完成

## 已完成

1. 在 `schema.prisma` 中新增 `CancellationReasonRequirement` 枚举（第 129 行）
2. 在 EventType 模型新增 `requiresCancellationReason` 列（第 269 行）
3. 创建数据库迁移（`20260115111819_add_cancellation_reason_require`）
4. 在英文语言包（`common.json`）中新增翻译键
5. 在 `EventAdvancedTab` 中新增下拉设置（第 691-719 行）
6. 在 `getEventTypesFromDB` 的 select 中加入 `requiresCancellationReason`（`apps/web/lib/booking.ts`）
7. 透传 `requiresCancellationReason` 属性：
   - `bookings-single-view.tsx` → `CancelBooking`
   - `CancelBookingDialog.tsx` → `CancelBooking`
8. 更新 `CancelBooking` 组件的 Props 与校验逻辑
9. 在 `handleCancelBooking` 中新增服务端校验
10. 在 `getBookingToDelete` 的 select 中加入 `requiresCancellationReason`
11. 修复动态标签：仅在 `isReasonRequiredForUser()` 返回 false 时显示 “(optional)”

## 进行中

## 阻塞项

## 下一步

- 端到端测试该功能
- 验证所有下拉选项是否正确生效
- 验证动态标签仅在合适场景显示 “(optional)”

## 会话备注

- 枚举和列已在规划阶段加入 schema
- 迁移已创建
