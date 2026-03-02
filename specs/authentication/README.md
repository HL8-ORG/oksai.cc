# 认证系统技术规格

> 基于 Better Auth 实现完整的认证系统，对齐 Cal.com 的认证功能

## 📋 文档概览

| 文档 | 说明 |
|------|------|
| [design.md](./design.md) | 完整的技术设计文档 |
| [implementation.md](./implementation.md) | 实现进度跟踪 |
| [decisions.md](./decisions.md) | 架构决策记录 (ADR) |
| [prompts.md](./prompts.md) | 常用提示词和命令 |
| [future-work.md](./future-work.md) | 后续工作和增强项 |
| [AGENTS.md](./AGENTS.md) | AI 助手开发指南 |

## 🎯 功能对标

### Cal.com vs oksai.cc

| 功能 | Cal.com | oksai.cc | 技术方案 | 优先级 |
|------|---------|----------|----------|--------|
| 邮箱密码登录 | ✅ | 🎯 | Better Auth Credentials | P0 |
| Magic Link | ✅ | 🎯 | Better Auth Email Provider | P0 |
| Google OAuth | ✅ | 🎯 | Better Auth OAuth Provider | P0 |
| 2FA/TOTP | ✅ | 🎯 | Better Auth Two-Factor Plugin | P1 |
| API Key | ✅ | 🎯 | Passport Strategy | P1 |
| SAML SSO | ✅ | 🎯 | BoxyHQ Jackson | P2 |
| 组织/团队 | ✅ | 🎯 | Better Auth Organization | P1 |

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

**当前状态：** 未开始

**Phase 0 (已完成)：**
- ✅ Better Auth + NestJS 集成 (nestjs-better-auth)
- ✅ Drizzle ORM 数据库层
- ✅ 项目基础架构

**Phase 1 (P0 - 核心认证)：**
- [ ] Better Auth 核心配置
- [ ] 邮箱密码注册/登录
- [ ] 邮箱验证
- [ ] 密码重置
- [ ] Magic Link 登录
- [ ] Google OAuth 登录
- [ ] 前端登录/注册页面

**Phase 2 (P1 - 高级特性)：**
- [ ] 2FA/TOTP 认证
- [ ] 备用码
- [ ] API Key 认证
- [ ] 组织/团队管理

**Phase 3 (P2 - 企业级功能)：**
- [ ] SAML SSO 集成
- [ ] 组织角色管理
- [ ] Session 缓存优化

## 🚀 快速开始

### 1. 阅读技术规格

```bash
# 查看完整设计
cat specs/authentication/design.md

# 查看实现进度
cat specs/authentication/implementation.md

# 查看架构决策
cat specs/authentication/decisions.md
```

### 2. 开始开发

```bash
# 查看下一步任务
cat specs/authentication/implementation.md | grep "下一步" -A 20

# 开始实现
# 按照 implementation.md 中的步骤逐一实现
```

### 3. 更新进度

```bash
# 完成任务后更新 implementation.md
# 记录重要决策到 decisions.md
```

## 🔑 关键决策

### 1. 认证框架：Better Auth

**理由：** 技术栈匹配、已完成 NestJS 集成、现代特性丰富

### 2. Session 策略：JWT

**理由：** 性能优势、扩展性好、与 Cal.com 一致

### 3. API Key 认证：Passport Strategy

**理由：** 标准化、灵活性、与 NestJS 集成

### 4. 2FA 实现：Better Auth Plugin

**理由：** 集成简单、安全性有保障

## 📚 参考资源

- [Better Auth 官方文档](https://www.better-auth.com)
- [Cal.com 认证实现](/home/arligle/forks/cal.com/packages/features/auth/)
- [BoxyHQ SAML Jackson](https://github.com/boxyhq/jackson)
- [NestJS Passport](https://docs.nestjs.com/security/authentication)
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 🤝 贡献指南

1. 开始前阅读 `AGENTS.md`
2. 遵循 `design.md` 中的技术设计
3. 更新 `implementation.md` 的进度
4. 记录重要决策到 `decisions.md`

---

**文档版本：** 1.0.0  
**最后更新：** 2026年3月2日  
**维护者：** oksai.cc 团队
