# AGENTS.md — 取消原因必填规则

## 项目背景

在 Event Type 的高级设置中增加一个配置项，用于设置取消原因何时必填（双方必填、仅主持人、仅参会人、或可选）。

## 开始前

1. 阅读 `specs/cancellation-reason-requirement/design.md`
2. 查看 `specs/cancellation-reason-requirement/implementation.md` 了解当前进度
3. 参考 `apps/web/modules/event-types/components/tabs/advanced/` 下的现有实现模式

## 代码模式

- 设置 UI 遵循 `RequiresConfirmationController` 模式
- 使用 `packages/prisma/zod-utils.ts` 中的 metadata schema
- 遵循现有翻译模式

## 不要做

- 不要添加 `design.md` 之外的功能
- 不要跳过测试
- 不要修改改期原因行为（超出范围）
