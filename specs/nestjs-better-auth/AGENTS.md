# AGENTS.md — NestJS Better Auth 集成

## 项目背景

将 Better Auth 认证框架集成到 NestJS 应用程序中，提供开箱即用的认证模块、守卫、装饰器和中间件。

## 开始前

1. 阅读 `specs/nestjs-better-auth/design.md`
2. 查看 `specs/nestjs-better-auth/implementation.md` 了解当前进度
3. 参考 `libs/auth/nestjs-better-auth/src/` 中的现有实现
4. 参考 Better Auth 官方文档了解插件能力

## 代码模式

- 使用 NestJS 动态模块模式（ConfigurableModuleBuilder）
- 使用装饰器实现元数据驱动行为
- 使用懒加载处理可选依赖（@nestjs/graphql, @nestjs/websockets）
- 遵循 NestJS 守卫、中间件和管道的标准模式

## 不要做

- 不要添加 design.md 之外的功能
- 不要破坏与 Better Auth 插件的兼容性
- 不要引入强依赖可选包（graphql, websockets）
- 不要跳过 TSDoc 注释
