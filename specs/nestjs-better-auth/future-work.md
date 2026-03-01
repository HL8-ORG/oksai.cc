# NestJS Better Auth 集成后续工作

从首版实现中延期的想法与增强项。

## 增强项

- [ ] 支持 Fastify 适配器（目前仅 Express）
- [ ] 支持函数式 trustedOrigins
- [ ] 添加 Rate Limiting 集成
- [ ] 支持 Better Auth 更多插件的角色/权限检查
- [ ] 提供会话事件（登录、登出、注册）的 NestJS 事件

## 技术债

- [ ] 缺少单元测试
- [ ] 缺少集成测试
- [ ] 缺少 e2e 测试示例项目

## 可选优化

- [ ] 缓存组织角色查询结果
- [ ] 提供装饰器组合（如 @AdminOnly = @Roles(['admin'])）
- [ ] 支持 WebSocket 的连接级认证缓存
