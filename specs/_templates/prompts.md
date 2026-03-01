# {功能名称} 提示词

## 同步实现状态

审查 `{feature}` 已实现内容，并更新 `specs/{feature}/implementation.md`。

## 生成测试

为 `{component}` 编写测试，遵循现有测试模式。

## 代码审查

从以下角度审查改动：类型安全、错误处理、安全性、边界情况。

## 继续开发功能

继续处理 `{feature}`。请先阅读 `specs/{feature}/implementation.md` 了解当前状态。

## 生成带截图的文档

为 `{feature}` 生成带截图的文档：

1. 在浏览器中打开该功能
2. 使用浏览器扩展对关键 UI 状态截图
3. 将截图保存到 `specs/{feature}/docs/screenshots/`
4. 创建/更新 `specs/{feature}/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

## 提升文档为公开版本

将内部文档提升为公开的 Mintlify 文档：

1. 审阅 `specs/{feature}/docs/README.md`
2. 复制/改写内容到 `docs/{feature}.mdx`
3. 将截图移动到 `docs/images/{feature}/`
4. 更新 `docs/mint.json` 导航
5. 确保文案适合客户阅读（不含内部细节）
