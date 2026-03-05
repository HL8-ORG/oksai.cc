# Decisions 模板更新 - 文档管理规范

## 更新日期

2026-03-06

## 更新目的

在所有功能 spec 的决策文档中添加第二个通用决策：**文档管理规范**。

## 更新范围

### 1. 模板文件

**文件：** `specs/_templates/decisions.md`

**新增内容：**
- 添加 UDR-002：文档管理规范
- 包含文档组织规范表格
- 包含正确/错误示例
- 包含文档命名规范

### 2. 现有 Spec 文件

为以下 5 个现有 spec 的 `decisions.md` 添加了 UDR-002：

| Spec 名称 | 文件路径 | 更新内容 |
|---------|---------|---------|
| NestJS Better Auth | `specs/nestjs-better-auth/decisions.md` | ✅ 已添加 UDR-002 |
| Authentication | `specs/authentication/decisions.md` | ✅ 已添加 UDR-002 |
| Better Auth MikroORM | `specs/better-auth-mikro-orm-optimization/decisions.md` | ✅ 已添加 UDR-002 |
| Cancellation Reason | `specs/cancellation-reason-requirement/decisions.md` | ✅ 已添加 UDR-002 |
| Workflow Translation | `specs/workflow-translation/decisions.md` | ✅ 已添加 UDR-002 |

## UDR-002：文档管理规范

### 背景

项目文档分散在各处，需要统一的文档组织方式，便于查找和维护。

### 决策

当需要创建开发文档时，优先在当前项目的 `docs` 目录下创建。

### 文档组织规范

| 文档类型 | 存放位置 | 说明 |
|---------|---------|------|
| 功能设计文档 | `specs/{feature}/docs/` | 带截图的功能文档 |
| 技术指南 | `apps/{app}/docs/` 或 `libs/{lib}/docs/` | 特定应用/库的技术文档 |
| 项目文档 | `docs/` | 跨项目共享文档、最佳实践 |
| API 文档 | Swagger/Scalar | 自动生成，无需手动维护 |

### 理由

- ✅ 文档就近原则，易于查找
- ✅ 保持项目结构清晰
- ✅ 便于文档版本管理
- ✅ 避免文档分散混乱

### 示例

```
# ✅ 推荐：在当前项目 docs 目录创建
apps/gateway/docs/exception-integration.md
libs/shared/exceptions/docs/usage-guide.md
specs/authentication/docs/api-reference.md

# ❌ 避免：在错误位置创建
docs/gateway-exception.md  # 应该在 apps/gateway/docs/ 下
README.md  # 不要把详细文档放在 README
```

### 文档命名规范

- **使用小写字母和连字符**：`exception-integration.md`
- **使用英文命名，中文内容**：便于跨平台兼容
- **包含 `.md` 扩展名**：Markdown 格式
- **文件名清晰表达内容**：`{topic}-{type}.md`

**命名示例：**
```
# ✅ 好的命名
api-design.md              # 清晰表达内容
migration-guide.md         # 明确文档类型
testing-strategy.md        # 一目了然

# ❌ 不好的命名
doc1.md                    # 无意义
exception.md               # 太笼统
新功能说明.md               # 应使用英文命名
```

## 文档目录结构示例

### 单体项目（Gateway）

```
apps/gateway/
├── docs/
│   ├── exception-integration.md      # 异常系统集成文档
│   ├── authentication-guide.md       # 认证指南
│   ├── deployment.md                 # 部署文档
│   └── api/
│       ├── endpoints.md              # API 端点文档
│       └── webhooks.md               # Webhook 文档
└── src/
```

### 共享库（Exceptions）

```
libs/shared/exceptions/
├── docs/
│   ├── usage-guide.md                # 使用指南
│   ├── migration-from-v1.md          # 迁移指南
│   ├── best-practices.md             # 最佳实践
│   └── examples/
│       ├── domain-exceptions.md      # 领域异常示例
│       └── integration-testing.md    # 集成测试示例
└── src/
```

### 功能 Spec（Authentication）

```
specs/authentication/
├── docs/
│   ├── oauth-flow.md                 # OAuth 流程文档
│   ├── api-reference.md              # API 参考
│   ├── security-considerations.md    # 安全注意事项
│   └── screenshots/
│       ├── login-page.png            # 登录页面截图
│       └── oauth-consent.png         # OAuth 授权页截图
├── design.md
├── implementation.md
└── decisions.md
```

### 跨项目文档

```
docs/
├── guides/
│   ├── typescript-configuration.md   # TypeScript 配置指南
│   ├── testing-best-practices.md     # 测试最佳实践
│   └── code-review-checklist.md      # 代码审查清单
├── migration/
│   ├── jest-to-vitest.md             # Jest 到 Vitest 迁移
│   └── drizzle-to-mikro-orm.md       # Drizzle 到 MikroORM 迁移
└── updates/
    ├── spec-command-templates-sync.md
    └── decisions-template-update.md
```

## 文档分类指南

### 1. 功能设计文档

**位置：** `specs/{feature}/docs/`

**内容：**
- 功能概览
- 使用方式（带截图）
- 配置选项
- 常见用例
- API 参考

**示例：**
```
specs/authentication/docs/oauth-flow.md
specs/authentication/docs/api-reference.md
```

### 2. 应用/库技术文档

**位置：** `apps/{app}/docs/` 或 `libs/{lib}/docs/`

**内容：**
- 集成指南
- 配置说明
- 架构设计
- 性能优化
- 故障排查

**示例：**
```
apps/gateway/docs/exception-integration.md
libs/shared/exceptions/docs/usage-guide.md
```

### 3. 跨项目文档

**位置：** `docs/`

**内容：**
- 开发规范
- 最佳实践
- 迁移指南
- 工具使用

**示例：**
```
docs/guides/typescript-configuration.md
docs/migration/jest-to-vitest.md
```

### 4. API 文档

**位置：** 自动生成（Swagger/Scalar）

**内容：**
- API 端点
- 请求/响应格式
- 认证方式
- 错误代码

**访问方式：**
- Swagger UI: `http://localhost:3000/swagger`
- Scalar UI: `http://localhost:3000/docs`

## 使用建议

### 创建新文档时

1. **确定文档类型**
   - 功能文档 → `specs/{feature}/docs/`
   - 应用文档 → `apps/{app}/docs/`
   - 库文档 → `libs/{lib}/docs/`
   - 跨项目文档 → `docs/`

2. **选择合适位置**
   ```bash
   # 功能文档
   mkdir -p specs/my-feature/docs
   touch specs/my-feature/docs/usage-guide.md

   # 应用文档
   mkdir -p apps/gateway/docs
   touch apps/gateway/docs/integration-guide.md
   ```

3. **遵循命名规范**
   - 使用小写字母和连字符
   - 文件名清晰表达内容
   - 英文命名，中文内容

### 移动现有文档时

如果发现文档在错误位置：

```bash
# 从根 docs 目录移动到应用 docs 目录
git mv docs/gateway-exception.md apps/gateway/docs/exception-integration.md

# 提交更改
git commit -m "docs: move exception docs to gateway/docs"
```

### 更新文档索引

在项目的 `README.md` 或 `docs/README.md` 中维护文档索引：

```markdown
## 文档索引

### 应用文档
- [Gateway 异常集成](apps/gateway/docs/exception-integration.md)

### 库文档
- [Exceptions 使用指南](libs/shared/exceptions/docs/usage-guide.md)

### 功能文档
- [认证 API 参考](specs/authentication/docs/api-reference.md)
```

## 验证清单

- [x] 模板文件已更新
- [x] 所有现有 spec 已更新
- [x] 文档组织规范已定义
- [x] 命名规范已说明
- [x] 示例已提供

## 相关资源

- [共享模块使用规范](./decisions-template-shared-modules.md)
- [Spec 命令文档同步](./spec-command-templates-sync.md)
- [项目文档结构](../../README.md)

## 后续维护

### 添加新的文档类型时

1. 更新 `specs/_templates/decisions.md` 的文档组织表格
2. 通知团队新的文档分类
3. 创建文档模板（可选）

### 定期审查

每季度审查一次：
- 文档是否在正确位置？
- 文档命名是否规范？
- 文档索引是否完整？

---

**更新者：** AI Assistant  
**版本：** 1.0  
**最后更新：** 2026-03-06
