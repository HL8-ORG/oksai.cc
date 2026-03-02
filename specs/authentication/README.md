# 认证系统技术规格

> 基于 Better Auth 实现完整的认证系统，对齐 Cal.com 的认证功能

## 📋 文档概览

| 文档 | 说明 |
|------|------|
| [design.md](./design.md) | 完整的技术设计文档（含用户故事、BDD 场景） |
| [implementation.md](./implementation.md) | 实现进度跟踪 |
| [decisions.md](./decisions.md) | 架构决策记录 (ADR) |
| [prompts.md](./prompts.md) | 常用提示词和命令（含工作流程） |
| [future-work.md](./future-work.md) | 后续工作和增强项 |
| [AGENTS.md](./AGENTS.md) | AI 助手开发指南（含 TDD/BDD 模式） |

## 🎯 核心用户故事

### 主用户故事

```gherkin
作为 用户
我想要 使用邮箱密码注册和登录系统
以便于 访问需要认证的功能
```

### 验收标准（INVEST 原则）

| 原则 | 说明 | 检查点 |
|:---|:---|:---|
| **I**ndependent | 独立性 | ✅ 不依赖其他功能 |
| **N**egotiable | 可协商 | ✅ 实现细节可讨论 |
| **V**aluable | 有价值 | ✅ 提供基础认证能力 |
| **E**stimable | 可估算 | ✅ 工作量明确 |
| **S**mall | 足够小 | ✅ 可分阶段实现 |
| **T**estable | 可测试 | ✅ 有明确的验收场景 |

## 📚 BDD 场景示例

### 正常流程

```gherkin
Scenario: 用户成功注册并验证邮箱
  Given 用户在注册页面
  When 输入有效的邮箱和密码
  And 点击注册按钮
  Then 系统发送验证邮件
  And 用户收到验证邮件
  And 点击验证链接
  Then 邮箱验证成功
  And 可以正常登录
```

### 异常流程

```gherkin
Scenario: 用户注册时邮箱已被占用
  Given 邮箱 "test@example.com" 已注册
  When 用户使用相同邮箱注册
  Then 注册失败
  And 显示错误信息 "邮箱已被占用"
```

完整 BDD 场景见 `design.md` 和 `features/authentication.feature`

## 🔄 开发工作流程

遵循标准的 Spec 优先开发流程：

```
用户故事 → BDD 场景 → TDD 循环 → 代码实现
    ↓          ↓          ↓          ↓
 design.md  feature文件  单元测试   生产代码
```

### TDD 循环

1. 🔴 **Red**: 编写失败的单元测试
2. 🟢 **Green**: 用最简代码让测试通过
3. 🔵 **Refactor**: 优化代码，保持测试通过

详见 `specs/_templates/workflow.md`

## 🏗️ 技术架构

```
Web 应用 (TanStack Start)
    ↓
Better Auth Core (JWT + Drizzle)
    ↓
NestJS Gateway (nestjs-better-auth)
    ↓
PostgreSQL (Drizzle ORM)
```

## 📊 实现进度

**当前状态：** Phase 1 已完成 ✅

**Phase 0 (已完成 ✅)：**
- ✅ Better Auth + NestJS 集成 (nestjs-better-auth)
- ✅ Drizzle ORM 数据库层
- ✅ 项目基础架构
- ✅ 单元测试和集成测试 (100% 通过)

**Phase 1 (P0 - 核心认证) - 已完成 ✅：**
- ✅ Better Auth 核心配置
- ✅ 邮箱密码注册/登录
- ✅ 邮箱验证
- ✅ 密码重置
- ✅ Magic Link 登录
- ✅ Google/GitHub OAuth 登录
- ✅ 前端登录/注册页面
- ✅ 2FA 基础配置
- ✅ 集成测试 (18/18 通过)

**Phase 2 (P1 - 高级特性) - 进行中：**
- [ ] 完善 2FA/TOTP 认证（测试和前端 UI）
- [ ] 备用码生成和使用
- [ ] API Key 认证
- [ ] 组织/团队管理

**Phase 3 (P2 - 企业级功能)：**
- [ ] SAML SSO 集成
- [ ] 组织角色管理
- [ ] Session 缓存优化

## 🚀 快速开始

### 1. 阅读技术规格

```bash
# 查看完整设计（含用户故事和 BDD 场景）
cat specs/authentication/design.md

# 查看实现进度
cat specs/authentication/implementation.md

# 查看架构决策
cat specs/authentication/decisions.md

# 查看开发工作流程
cat specs/_templates/workflow.md
```

### 2. 开始开发

```bash
# 查看下一步任务
cat specs/authentication/implementation.md | grep "下一步" -A 20

# 运行测试验证当前状态
pnpm vitest run libs/auth/
pnpm vitest run apps/gateway/src/auth/
```

### 3. 遵循工作流程

1. **用户故事**: 确认 `design.md` 中的用户故事
2. **BDD 场景**: 编写/更新 `features/authentication.feature`
3. **TDD 循环**:
   - 🔴 Red: 编写失败的测试
   - 🟢 Green: 实现最简代码
   - 🔵 Refactor: 优化代码
4. **更新进度**: 记录到 `implementation.md`

## 🧪 测试策略

### 单元测试（70%）
- 领域层：聚合根、实体、值对象
- 应用层：Service、Guard
- 覆盖率：核心功能 80%+

### 集成测试（20%）
- 基础设施层：Repository 实现
- 应用层：完整认证流程
- 当前进度：18/18 通过

### E2E 测试（10%）
- 关键业务流程
- API 端到端验证

## 🔑 关键决策

### 1. 认证框架：Better Auth

**理由：** 技术栈匹配、已完成 NestJS 集成、现代特性丰富

### 2. Session 策略：JWT

**理由：** 性能优势、扩展性好、与 Cal.com 一致

### 3. 测试框架：Vitest

**理由：** 更快的速度、更好的 watch 模式、与 NestJS v12 对齐

### 4. 工作流程：BDD + TDD

**理由：** 确保需求清晰、测试覆盖完整、代码质量可控

## 📚 参考资源

### 内部资源
- [开发工作流程](../_templates/workflow.md)
- [测试指南](../../specs-testing/README.md)
- [Vitest 迁移报告](../../VITEST_MIGRATION.md)

### 外部资源
- [Better Auth 官方文档](https://www.better-auth.com)
- [Cal.com 认证实现](/home/arligle/forks/cal.com/packages/features/auth/)
- [NestJS 认证文档](https://docs.nestjs.com/security/authentication)
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 🤝 贡献指南

1. 开始前阅读 `AGENTS.md` 和 `specs/_templates/workflow.md`
2. 遵循 `design.md` 中的技术设计和用户故事
3. 编写 BDD 场景（`features/authentication.feature`）
4. 使用 TDD 开发（Red-Green-Refactor）
5. 更新 `implementation.md` 的进度
6. 记录重要决策到 `decisions.md`
7. 确保测试通过（`pnpm vitest run`）

---

**文档版本：** 2.0.0  
**最后更新：** 2026年3月3日  
**维护者：** oksai.cc 团队
