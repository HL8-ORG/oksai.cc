# 文档重组计划

**目标**: 将 docs/ 目录下的 60+ 个文档按照类型统一归档管理  
**创建时间**: 2026-03-06  
**状态**: 执行中

---

## 新目录结构

```
docs/
├── README.md                           # 文档索引（保留）
│
├── 01-quick-start/                    # 快速开始
│   ├── project-overview.md            # 项目概览
│   └── development-setup.md           # 开发环境设置
│
├── 02-architecture/                   # 架构文档
│   ├── AUTHENTICATION_ARCHITECTURE.md # 认证系统架构
│   ├── ARCHITECTURE.md                # 系统架构
│   └── system-architecture.md         # 系统架构（forks）
│
├── 03-guides/                         # 开发指南
│   ├── typescript-configuration.md    # TypeScript 配置
│   ├── entity-design-guide.md         # Entity 设计指南
│   ├── mikro-orm-usage-guide.md       # MikroORM 使用指南
│   ├── logger-usage-guide.md          # Logger 使用指南
│   ├── config-usage-guide.md          # Config 使用指南
│   ├── context-usage-guide.md         # Context 使用指南
│   └── contracts-management-guide.md  # Contracts 管理指南
│
├── 04-migration/                      # 迁移文档
│   ├── vitest-migration.md            # Vitest 迁移
│   ├── drizzle-to-mikro-orm.md        # Drizzle → MikroORM
│   ├── mikro-orm-migration-progress.md # MikroORM 迁移进度
│   ├── mikro-orm-migration-plan.md    # MikroORM 迁移计划
│   ├── mikro-orm-migration-phase2-progress.md
│   ├── mikro-orm-gateway-migration-complete.md
│   ├── mikro-orm-migration-final-summary.md
│   ├── drizzle-removal-plan.md
│   ├── drizzle-removal-progress.md
│   ├── drizzle-removal-phase4-complete.md
│   └── drizzle-removal-project-complete.md
│
├── 05-features/                       # 功能实现
│   ├── BETTER_AUTH_INTEGRATION.md     # Better Auth 集成
│   ├── BETTER_AUTH_BEST_PRACTICES.md  # Better Auth 最佳实践
│   ├── BETTER_AUTH_OPTIMIZATION.md    # Better Auth 优化
│   ├── GITHUB_OAUTH_SETUP.md          # GitHub OAuth
│   ├── GOOGLE_OAUTH_SETUP.md          # Google OAuth
│   ├── FRONTEND_ALIGNMENT.md          # 前端对齐
│   ├── FRONTEND_SETUP.md              # 前端设置
│   ├── FRONTEND_STARTUP.md            # 前端启动
│   ├── LINT_MECHANISM.md              # Lint 机制
│   ├── IMPLEMENTATION_SUMMARY.md      # 实现总结
│   ├── IMPLEMENTATION_COMPLETE.md     # 实现完成
│   ├── VERIFICATION_CHECKLIST.md      # 验证清单
│   ├── session-optimization-plan.md   # 会话优化
│   └── oauth-provider-migration-evaluation.md
│
├── 06-operations/                     # 运维部署
│   ├── DEPLOYMENT.md                  # 部署指南
│   ├── operations/                    # 运维文档（保留）
│   └── setup/                         # 设置文档（保留）
│
├── 07-assessment/                     # 项目评估
│   ├── PROJECT-EVALUATION.md          # 项目评估
│   ├── PROJECT-ASSESSMENT-2026-03-05.md
│   ├── phase5-final-completion-report.md
│   ├── phase5-work-summary-20260304.md
│   ├── phase6-decision-recommendation.md
│   ├── phase6-optimization-plan.md
│   ├── GATEWAY_STARTUP_VERIFICATION.md
│   ├── GATEWAY_VERIFICATION_SUMMARY.md
│   ├── PHASE5-TASK1-SUMMARY.md
│   ├── authentication-system-evaluation.md
│   ├── authentication-development-summary-20260304.md
│   ├── architecture-feasibility-assessment.md
│   └── drizzle-orm-event-sourcing-assessment.md
│
├── 08-reference/                      # 参考文档
│   ├── admin-plugin-completion-report.md
│   ├── admin-plugin-deployment-guide.md
│   ├── admin-plugin-deployment-record.md
│   ├── admin-plugin-migration-plan.md
│   ├── admin-plugin-migration-week1-report.md
│   ├── api-key-migration-summary.md
│   ├── api-key-migration-week1-report.md
│   ├── api-key-migration-week3-report.md
│   ├── better-auth-adapter-factory-deep-analysis.md
│   ├── better-auth-mikro-orm-createschema-evaluation.md
│   ├── better-auth-mikro-orm-library-assessment.md
│   ├── better-auth-core-deep-analysis.md
│   └── DOCUMENTATION_MIGRATION.md
│
└── archive/                           # 历史归档
    ├── auth/                          # 旧认证文档
    ├── hardcode-migration-examples.md
    └── [其他过时文档]
```

---

## 移动计划

### Phase 1: 创建目录结构

```bash
mkdir -p docs/01-quick-start
mkdir -p docs/02-architecture
mkdir -p docs/03-guides
mkdir -p docs/04-migration
mkdir -p docs/05-features
mkdir -p docs/06-operations
mkdir -p docs/07-assessment
mkdir -p docs/08-reference
mkdir -p docs/archive
```

### Phase 2: 移动文档

#### 02-architecture (架构)
- AUTHENTICATION_ARCHITECTURE.md
- ARCHITECTURE.md

#### 03-guides (开发指南)
- entity-design-guide.md
- mikro-orm-usage-guide.md
- logger-usage-guide.md
- config-usage-guide.md
- context-usage-guide.md
- contracts-management-guide.md

#### 04-migration (迁移)
- drizzle-to-mikro-orm.md
- mikro-orm-migration-progress.md
- mikro-orm-migration-plan.md
- mikro-orm-migration-phase2-progress.md
- mikro-orm-gateway-migration-complete.md
- mikro-orm-migration-final-summary.md
- drizzle-removal-plan.md
- drizzle-removal-progress.md
- drizzle-removal-phase4-complete.md
- drizzle-removal-project-complete.md

#### 05-features (功能)
- BETTER_AUTH_INTEGRATION.md
- BETTER_AUTH_BEST_PRACTICES.md
- BETTER_AUTH_OPTIMIZATION.md
- GITHUB_OAUTH_SETUP.md
- GOOGLE_OAUTH_SETUP.md
- FRONTEND_ALIGNMENT.md
- FRONTEND_SETUP.md
- FRONTEND_STARTUP.md
- LINT_MECHANISM.md
- IMPLEMENTATION_SUMMARY.md
- IMPLEMENTATION_COMPLETE.md
- VERIFICATION_CHECKLIST.md
- session-optimization-plan.md
- oauth-provider-migration-evaluation.md

#### 07-assessment (评估)
- PROJECT-EVALUATION.md
- PROJECT-ASSESSMENT-2026-03-05.md
- phase5-final-completion-report.md
- phase5-work-summary-20260304.md
- phase6-decision-recommendation.md
- phase6-optimization-plan.md
- GATEWAY_STARTUP_VERIFICATION.md
- GATEWAY_VERIFICATION_SUMMARY.md
- PHASE5-TASK1-SUMMARY.md
- authentication-system-evaluation.md
- authentication-development-summary-20260304.md
- architecture-feasibility-assessment.md
- drizzle-orm-event-sourcing-assessment.md

#### 08-reference (参考)
- admin-plugin-completion-report.md
- admin-plugin-deployment-guide.md
- admin-plugin-deployment-record.md
- admin-plugin-migration-plan.md
- admin-plugin-migration-week1-report.md
- api-key-migration-summary.md
- api-key-migration-week1-report.md
- api-key-migration-week3-report.md
- better-auth-adapter-factory-deep-analysis.md
- better-auth-mikro-orm-createschema-evaluation.md
- better-auth-mikro-orm-library-assessment.md
- better-auth-core-deep-analysis.md
- DOCUMENTATION_MIGRATION.md

#### archive (归档)
- hardcode-migration-examples.md
- auth/ (整个目录)

---

## 执行步骤

### Step 1: 创建新目录结构
### Step 2: 移动文档到对应目录
### Step 3: 更新 docs/README.md 链接
### Step 4: 验证所有链接有效
### Step 5: 提交更改

---

## 预期收益

1. **清晰的分类** - 文档按类型组织，易于查找
2. **更好的维护性** - 新文档有明确的归属
3. **减少混乱** - 根目录不再有大量散乱文档
4. **易于扩展** - 每个类别可以独立扩展
5. **历史归档** - 过时文档有专门存放位置

---

**维护者**: Oksai Team  
**最后更新**: 2026-03-06
