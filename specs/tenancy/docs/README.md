# 多租户系统文档

本目录包含多租户系统的详细文档和截图。

---

## 文档列表

### 使用指南

- **[快速开始](./quick-start.md)** - 5 分钟快速集成多租户能力
- **[配置指南](./configuration.md)** - 多租户配置选项详解
- **[API 参考](./api-reference.md)** - RESTful API 完整文档
- **[最佳实践](./best-practices.md)** - 多租户开发最佳实践

### 架构文档

- **[架构概览](./architecture-overview.md)** - 多租户架构设计
- **[领域模型](./domain-model.md)** - DDD 领域模型详解
- **[租户隔离](./tenant-isolation.md)** - 租户数据隔离策略
- **[配额管理](./quota-management.md)** - 租户配额管理机制

### 集成指南

- **[NestJS 集成](./nestjs-integration.md)** - NestJS 应用集成指南
- **[MikroORM 集成](./mikro-orm-integration.md)** - MikroORM 集成配置
- **[前端集成](./frontend-integration.md)** - 前端应用集成指南

### 运维文档

- **[部署指南](./deployment.md)** - 生产环境部署指南
- **[监控和日志](./monitoring.md)** - 监控指标和日志配置
- **[故障排查](./troubleshooting.md)** - 常见问题和解决方案
- **[性能调优](./performance-tuning.md)** - 性能优化建议

---

## 截图

开发过程中采集的 UI 截图存放在 `screenshots/` 目录：

```
screenshots/
├── admin/
│   ├── tenant-list.png          # 租户列表页面
│   ├── tenant-detail.png        # 租户详情页面
│   ├── tenant-activation.png    # 租户激活流程
│   └── quota-usage.png          # 配额使用统计
└── user/
    ├── tenant-switcher.png      # 租户切换组件
    └── tenant-settings.png      # 租户设置页面
```

---

## 版本历史

- **v1.0.0** (计划中) - 核心多租户能力
  - 租户创建、激活、停用
  - 租户上下文管理
  - 租户配额检查
  - 租户套餐管理

详见 [CHANGELOG](./CHANGELOG.md)。

---

## 反馈

如果您发现文档有误或有改进建议，请：

1. 在 GitHub 提交 Issue
2. 直接提交 Pull Request
3. 联系开发团队

---

**最后更新**：2026-03-09
