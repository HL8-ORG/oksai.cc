# NestJS Better Auth 集成提示词

## 同步实现状态

审查 `nestjs-better-auth` 已实现内容，并更新 `specs/nestjs-better-auth/implementation.md`。

## 生成测试

为 `libs/auth/nestjs-better-auth` 编写单元测试，覆盖：

- AuthGuard 的各种上下文（HTTP、GraphQL、WebSocket）
- 装饰器行为
- 钩子系统

## 代码审查

从以下角度审查改动：

- 与 Better Auth 插件兼容性
- 可选依赖的懒加载
- 错误处理和边界情况
- TSDoc 注释完整性

## 继续开发功能

继续处理 `nestjs-better-auth`。请先阅读 `specs/nestjs-better-auth/implementation.md` 了解当前状态。

## 生成使用示例

为 `nestjs-better-auth` 生成完整使用示例：

1. 基础模块注册
2. 控制器装饰器使用
3. 钩子系统使用
4. 与 Better Auth 插件配合

## 提升文档为公开版本

将内部文档提升为公开文档：

1. 审阅 `specs/nestjs-better-auth/design.md`
2. 创建用户友好的 README.md
3. 添加代码示例
4. 确保文案适合开发者阅读
