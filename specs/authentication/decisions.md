# 认证系统架构决策记录

## ADR-001：认证框架选择 - Better Auth vs NextAuth.js

### 背景

需要选择一个现代化的认证框架来对齐 Cal.com 的认证功能。Cal.com 使用 NextAuth.js，但我们的技术栈是 TanStack Start + NestJS，需要评估框架兼容性。

### 备选方案

1. **NextAuth.js** — Cal.com 使用的方案，成熟稳定，生态丰富
   - ✅ 成熟稳定，社区大
   - ✅ 与 Cal.com 实现一致，便于参考
   - ❌ 主要面向 Next.js，对其他框架支持有限
   - ❌ 与 NestJS 集成需要自定义适配

2. **Better Auth** — 新兴的 TypeScript 认证框架
   - ✅ 框架无关，支持多种运行时
   - ✅ 原生 TypeScript，类型安全
   - ✅ 插件系统灵活（2FA, Organization, Admin）
   - ✅ 已完成 NestJS 集成（nestjs-better-auth）
   - ❌ 相对较新，社区较小
   - ❌ 文档不如 NextAuth.js 完善

3. **Passport.js** — Node.js 传统认证中间件
   - ✅ 成熟稳定，策略丰富
   - ✅ NestJS 官方支持 (@nestjs/passport)
   - ❌ 配置复杂，学习曲线陡
   - ❌ 缺少现代特性（2FA、Organization 需要额外集成）

### 决策

**选择 Better Auth**

**理由：**
1. **技术栈匹配**：Better Auth 是框架无关的，完美适配 TanStack Start + NestJS 架构
2. **已完成集成**：项目已完成 `nestjs-better-auth` 库的开发和测试，提供完整的 NestJS 集成
3. **现代特性**：Better Auth 的插件系统（2FA、Organization、Admin）提供了企业级功能
4. **类型安全**：原生 TypeScript 支持，端到端类型安全
5. **灵活性**：可以根据需要自定义 Provider 和插件

**参考：**
- Cal.com 使用 NextAuth.js，但我们需要适配不同架构
- Better Auth 提供了与 Cal.com 相当的功能特性

### 影响

- ✅ 无需额外适配 Next.js 特性
- ✅ 可以使用现有的 nestjs-better-auth 集成
- ⚠️ 需要参考 Cal.com 的认证逻辑，而非直接使用代码
- ⚠️ 需要学习和适应 Better Auth 的 API

---

## ADR-002：Session 策略 - JWT vs Database Session

### 背景

Cal.com 使用 JWT Session 策略（无状态），需要决定 oksai.cc 的 Session 管理方式。

### 备选方案

1. **JWT Session (无状态)** — Cal.com 的方案
   - ✅ 无需数据库存储 Session
   - ✅ 易于水平扩展
   - ✅ 跨服务共享 Session
   - ❌ 无法主动撤销（需要黑名单）
   - ❌ Payload 大小受限

2. **Database Session (有状态)** — 传统方案
   - ✅ 可以立即撤销 Session
   - ✅ 支持并发登录控制
   - ✅ 可以记录 Session 元数据（IP、User Agent）
   - ❌ 需要数据库查询
   - ❌ 扩展性较差

3. **Hybrid (JWT + Database)** — 混合方案
   - ✅ 结合两者优点
   - ✅ JWT 用于快速验证
   - ✅ Database 用于撤销和元数据
   - ❌ 实现复杂度高
   - ❌ 性能开销大

### 决策

**选择 JWT Session（与 Cal.com 一致）**

**理由：**
1. **性能优势**：无需每次请求都查询数据库
2. **扩展性好**：适合微服务架构和水平扩展
3. **与 Cal.com 一致**：便于参考实现
4. **Better Auth 支持**：Better Auth 原生支持 JWT Session

**缓解措施：**
- 使用短期 JWT Token（7 天）+ Refresh Token
- 实现可选的 Session 黑名单（用于紧急撤销）
- 记录关键操作的审计日志

### 影响

- ✅ Session 管理简单高效
- ✅ 适合微服务架构
- ⚠️ Session 撤销有延迟（Token 过期后）
- ⚠️ 需要额外的黑名单机制（可选）

---

## ADR-003：API Key 认证实现方式

### 背景

Cal.com 使用 API Key 认证来支持 API 访问，需要决定如何在 NestJS 中实现 API Key 认证。

### 备选方案

1. **自定义 NestJS Guard** — 在 NestJS 层实现
   - ✅ 与 NestJS 架构一致
   - ✅ 可以使用装饰器控制
   - ✅ 可以与其他认证方式共存
   - ❌ 需要自己实现验证逻辑

2. **Passport Strategy** — 使用 @nestjs/passport
   - ✅ 标准化的 Strategy 接口
   - ✅ 与 NestJS AuthGuard 集成
   - ✅ 可以与其他 Strategy 组合
   - ❌ 需要额外的 passport 依赖

3. **Better Auth 插件** — 扩展 Better Auth
   - ✅ 统一的认证入口
   - ✅ 可以使用 Better Auth 的工具函数
   - ❌ Better Auth 不原生支持 API Key
   - ❌ 需要自定义插件

### 决策

**选择 Passport Strategy（HeaderAPIKeyStrategy）**

**理由：**
1. **标准化**：Passport 是 NestJS 认证的标准方案
2. **灵活性**：可以与其他 Strategy（JWT, OAuth）组合使用
3. **成熟稳定**：passport-headerapikey 是成熟的开源库
4. **易于使用**：通过 @UseGuards(ApiKeyGuard) 装饰器控制

**实现：**
- 使用 passport-headerapikey 策略
- API Key 格式：`oks_<random_string>`
- 存储：SHA256 hash + prefix
- 支持过期时间和撤销

### 影响

- ✅ API Key 认证实现标准化
- ✅ 可以与 Better Auth 共存
- ⚠️ 需要安装额外的 passport 依赖
- ⚠️ 需要自定义 API Key 管理逻辑

---

## ADR-004：2FA 实现方案

### 背景

Cal.com 使用自定义的 2FA 实现（基于 otplib），需要决定使用 Better Auth 插件还是自定义实现。

### 备选方案

1. **Better Auth Two-Factor Plugin** — 使用官方插件
   - ✅ 开箱即用，集成简单
   - ✅ 与 Better Auth 深度集成
   - ✅ 支持 TOTP 和备用码
   - ❌ 定制性有限

2. **自定义实现** — 参考 Cal.com 实现
   - ✅ 完全可控，可以定制
   - ✅ 可以复用 Cal.com 的逻辑
   - ❌ 开发和维护成本高
   - ❌ 需要自己处理安全性

### 决策

**选择 Better Auth Two-Factor Plugin**

**理由：**
1. **集成简单**：无需重复造轮子
2. **安全性**：Better Auth 团队维护，安全性有保障
3. **功能完整**：支持 TOTP、备用码、QR Code 生成
4. **与 NestJS 集成**：可以通过 nestjs-better-auth 使用

**参考：**
- Cal.com 的 2FA 实现：`/home/arligle/forks/cal.com/apps/web/app/api/auth/two-factor/`

### 影响

- ✅ 2FA 功能快速实现
- ✅ 安全性有保障
- ⚠️ 定制性有限，可能需要 fork 插件

---

## ADR-005：SAML SSO 实现方案

### 背景

Cal.com 使用 BoxyHQ 的 Jackson 实现 SAML SSO，需要决定是否采用相同方案。

### 备选方案

1. **BoxyHQ Jackson** — Cal.com 的方案
   - ✅ 与 Cal.com 一致，便于参考
   - ✅ 成熟的 SAML 解决方案
   - ✅ 支持多租户
   - ❌ 需要额外的数据库（SAML_DATABASE_URL）
   - ❌ 配置复杂

2. **自定义 SAML 实现** — 使用 samlify 等库
   - ✅ 更灵活
   - ❌ 开发成本高
   - ❌ 安全性需要自己保证

3. **暂不实现** — Phase 2 再考虑
   - ✅ 可以先专注核心功能
   - ❌ 企业客户需要 SAML SSO

### 决策

**选择 BoxyHQ Jackson（Phase 2 实现）**

**理由：**
1. **与 Cal.com 一致**：便于参考实现
2. **成熟稳定**：BoxyHQ 是专业的 SAML 解决方案提供商
3. **多租户支持**：适合 SaaS 产品
4. **社区支持**：开源项目，社区活跃

**时间规划：**
- Phase 1: 专注核心认证（邮箱密码、OAuth、Magic Link）
- Phase 2: 实现 SAML SSO（P2 优先级）

### 影响

- ✅ 企业级 SSO 功能有保障
- ⚠️ 需要额外的数据库配置
- ⚠️ 实现时间较晚（Phase 2）

---

## ADR-006：数据库 Schema 设计 - 完全遵循 Better Auth vs 自定义扩展

### 背景

Better Auth 有自己的数据库 Schema，但我们需要支持一些 Cal.com 特有的字段（如 username、locale、timezone）。

### 备选方案

1. **完全遵循 Better Auth Schema** — 不添加自定义字段
   - ✅ 简单，无需额外迁移
   - ✅ 与 Better Auth 完全兼容
   - ❌ 无法支持所有 Cal.com 功能

2. **扩展 Better Auth Schema** — 添加自定义字段
   - ✅ 可以支持所有功能
   - ✅ 灵活性高
   - ⚠️ 需要额外的迁移文件
   - ⚠️ 需要确保与 Better Auth 兼容

3. **混合方案** — Better Auth 核心 + 自定义关联表
   - ✅ 核心表与 Better Auth 一致
   - ✅ 自定义字段在关联表
   - ❌ 查询需要 JOIN
   - ❌ 复杂度高

### 决策

**选择扩展 Better Auth Schema**

**理由：**
1. **功能需求**：需要支持 username、locale、timezone、role 等字段
2. **Drizzle 支持**：Drizzle ORM 允许轻松扩展 Schema
3. **兼容性**：Better Auth 允许在核心表上添加自定义字段
4. **性能**：单表查询比关联表更快

**实现：**
- Better Auth 核心字段保持不变
- 添加自定义字段：username、locale、timezone、role、locked
- 使用 Drizzle 的 `pgTable` 定义 Schema

### 影响

- ✅ 支持所有必要功能
- ✅ 查询性能好
- ⚠️ 需要额外的迁移文件
- ⚠️ 需要确保与 Better Auth 未来版本兼容

---

## 总结

| 决策点 | 选择 | 主要原因 |
|--------|------|----------|
| 认证框架 | Better Auth | 技术栈匹配、已完成集成、现代特性 |
| Session 策略 | JWT | 性能优势、扩展性好、与 Cal.com 一致 |
| API Key 认证 | Passport Strategy | 标准化、灵活性、与 NestJS 集成 |
| 2FA 实现 | Better Auth Plugin | 集成简单、安全性有保障 |
| SAML SSO | BoxyHQ Jackson (Phase 2) | 与 Cal.com 一致、成熟稳定 |
| 数据库 Schema | 扩展 Better Auth | 支持所有功能、查询性能好 |

---

**文档版本：** 1.0.0  
**最后更新：** 2026年3月2日
