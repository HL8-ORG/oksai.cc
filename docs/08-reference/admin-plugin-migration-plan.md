# Better Auth Admin 插件迁移计划

> **版本**: v1.0  
> **日期**: 2026-03-11  
> **状态**: 进行中  
> **预计工期**: 4 周  
> **优先级**: P0

---

## 📋 目录

1. [背景与目标](#1-背景与目标)
2. [当前实现分析](#2-当前实现分析)
3. [Better Auth Admin 插件特性](#3-better-auth-admin-插件特性)
4. [迁移方案](#4-迁移方案)
5. [数据迁移策略](#5-数据迁移策略)
6. [迁移时间表](#6-迁移时间表)
7. [风险评估与应对](#7-风险评估与应对)
8. [验收标准](#8-验收标准)

---

## 1. 背景与目标

### 1.1 项目背景

**Phase 5 总体目标**：将 Better Auth 插件利用率从 60% 提升到 90%+

**任务 2 目标**：迁移用户模拟和管理功能到 Better Auth Admin 插件

### 1.2 迁移目标

| 维度 | 当前 | 目标 | 提升 |
|------|------|------|------|
| **代码行数** | 153 行（自定义） | 0 行（官方插件） | -153 行 |
| **维护成本** | 高（自行维护） | 低（官方维护） | ⬇️ 70% |
| **功能完整性** | 40% | 95%+ | +55% |
| **审计追踪** | 无 | 完整审计 | ✅ |
| **权限系统** | 简单检查 | 细粒度控制 | ✅ |
| **持久化** | 内存（重启丢失） | 数据库 | ✅ |

### 1.3 预期收益

**技术收益：**
- ✅ 减少 153 行自定义代码
- ✅ 获得官方维护和安全更新
- ✅ 完整的类型支持
- ✅ 更好的可扩展性

**业务收益：**
- ✅ 完整的用户管理功能
- ✅ 细粒度权限控制
- ✅ 自动审计日志
- ✅ 用户封禁/解封
- ✅ 会话管理

---

## 2. 当前实现分析

### 2.1 现有代码

**文件位置**: `apps/gateway/src/auth/impersonation.service.ts` (153 行)

**主要功能：**

```typescript
// ✅ 已实现
- impersonateUser() - 模拟用户登录
- stopImpersonating() - 停止模拟
- getImpersonationSession() - 获取模拟会话
- listActiveImpersonations() - 列出活跃模拟

// ⚠️ 问题
- 会话存储在内存（重启丢失）
- 缺少审计日志
- 权限检查简单（只检查 role）
- 缺少自动清理
- 缺少会话过期处理
```

### 2.2 存在的问题

| 问题 | 影响 | 严重程度 |
|------|------|---------|
| **内存存储** | 重启后丢失所有模拟会话 | 🔴 高 |
| **无审计日志** | 无法追溯管理操作 | 🔴 高 |
| **权限粗粒度** | 只能检查 admin/owner | 🟡 中 |
| **无自动清理** | 会话可能永久存在 | 🟡 中 |
| **无封禁管理** | 缺少用户状态管理 | 🟡 中 |
| **无会话管理** | 无法查看/撤销用户会话 | 🟡 中 |

---

## 3. Better Auth Admin 插件特性

### 3.1 核心功能

根据官方文档，Admin 插件提供：

#### 用户管理

```typescript
✅ createUser - 创建用户
✅ listUsers - 列出用户（支持搜索、过滤、分页）
✅ getUser - 获取用户详情
✅ updateUser - 更新用户信息
✅ removeUser - 删除用户
```

#### 角色与权限

```typescript
✅ setRole - 设置用户角色
✅ hasPermission - 检查权限
✅ checkRolePermission - 检查角色权限
✅ 自定义权限系统（Access Control）
```

#### 用户状态管理

```typescript
✅ banUser - 封禁用户（支持原因和过期时间）
✅ unbanUser - 解封用户
✅ 自动拒绝封禁用户登录
```

#### 会话管理

```typescript
✅ listUserSessions - 列出用户会话
✅ revokeUserSession - 撤销单个会话
✅ revokeUserSessions - 撤销所有会话
```

#### 用户模拟（重点功能）

```typescript
✅ impersonateUser - 模拟用户
✅ stopImpersonating - 停止模拟
✅ 自动审计日志
✅ 会话持久化
✅ 可配置模拟时长
✅ 防止管理员互相模拟（可配置）
```

### 3.2 高级特性

```typescript
✅ 管理员权限验证
✅ 细粒度权限控制（Access Control）
✅ 完整的审计追踪
✅ 防止权限提升
✅ 组织级权限管理
```

---

## 4. 迁移方案

### 4.1 架构设计

**迁移前：**

```
┌─────────────────────────────────────┐
│  AdminController (未实现)            │
│  ImpersonationService (153行)        │
│  - 内存存储                          │
│  - 简单权限检查                      │
│  - 无审计日志                        │
└─────────────────────────────────────┘
```

**迁移后：**

```
┌─────────────────────────────────────┐
│  AdminController (新建)              │
│  - 用户管理端点                      │
│  - 角色权限端点                      │
│  - 用户模拟端点                      │
│  - 会话管理端点                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Better Auth Admin Plugin           │
│  - 完整的管理功能                    │
│  - 自动审计日志                      │
│  - 细粒度权限控制                    │
│  - 数据库持久化                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │
│  - user 表（添加 role, banned 字段）│
│  - session 表                        │
│  - 审计日志表                        │
└─────────────────────────────────────┘
```

### 4.2 数据库 Schema 变更

**需要添加的字段（user 表）：**

```sql
-- libs/database/src/schema/auth.schema.ts

export const users = pgTable("user", {
  // ... 现有字段
  
  // ✅ 新增：角色字段
  role: text("role").default("user").notNull(),
  
  // ✅ 新增：封禁相关字段
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  bannedAt: timestamp("banned_at"),
  banExpires: timestamp("ban_expires"),
});
```

**数据库迁移文件：**

```bash
# 生成迁移
pnpm db:generate

# 迁移文件：0005_add_admin_fields.sql
```

### 4.3 权限系统设计

**定义权限声明：**

```typescript
// apps/gateway/src/auth/auth.config.ts

import { createAccessControl } from "better-auth/plugins/access";

// 定义权限
const statements = {
  user: ["create", "list", "set-role", "ban", "impersonate", "delete"],
  session: ["list", "revoke", "delete"],
  organization: ["create", "read", "update", "delete"],
} as const;

const ac = createAccessControl(statements);

// 定义角色
const adminRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "impersonate"],
  session: ["list", "revoke"],
  organization: ["create", "read", "update"],
});

const superAdminRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "impersonate", "delete"],
  session: ["list", "revoke", "delete"],
  organization: ["create", "read", "update", "delete"],
});

const userRole = ac.newRole({
  organization: ["create", "read"],
});
```

### 4.4 API 端点设计

**新建 AdminController：**

```typescript
@Controller("admin")
@UseGuards(AuthGuard)
@Roles(["admin", "superadmin"])
export class AdminController {
  
  // 用户管理
  GET    /admin/users              - 列出用户
  GET    /admin/users/:id          - 获取用户详情
  POST   /admin/users              - 创建用户
  PUT    /admin/users/:id          - 更新用户
  DELETE /admin/users/:id          - 删除用户
  
  // 角色权限
  POST   /admin/users/:id/role     - 设置用户角色
  POST   /admin/check-permission   - 检查权限
  
  // 用户状态
  POST   /admin/users/:id/ban      - 封禁用户
  POST   /admin/users/:id/unban    - 解封用户
  
  // 会话管理
  GET    /admin/users/:id/sessions - 列出用户会话
  POST   /admin/sessions/:token/revoke - 撤销会话
  
  // 用户模拟
  POST   /admin/impersonate/:id    - 模拟用户
  POST   /admin/stop-impersonating - 停止模拟
}
```

---

## 5. 数据迁移策略

### 5.1 用户角色迁移

**迁移映射表：**

| 旧系统 | Better Auth | 说明 |
|--------|-------------|------|
| `role = "admin"` | `role = "admin"` | 管理员 |
| `role = "owner"` | `role = "superadmin"` | 超级管理员 |
| `role = "user"` | `role = "user"` | 普通用户 |

**迁移脚本：**

```typescript
// scripts/migrate-admin-data.ts

import { db, users } from "@oksai/database";
import { eq } from "drizzle-orm";

async function migrateAdminData() {
  console.log("开始迁移用户角色...");
  
  const allUsers = await db.select().from(users);
  console.log(`找到 ${allUsers.length} 个用户`);
  
  for (const user of allUsers) {
    // 映射角色
    let newRole = "user";
    if (user.email === "admin@example.com") {
      newRole = "superadmin";
    } else if (user.role === "admin" || user.role === "owner") {
      newRole = "admin";
    }
    
    await db.update(users).set({
      role: newRole,
    }).where(eq(users.id, user.id));
    
    console.log(`✓ 更新用户 ${user.email} 的角色为 ${newRole}`);
  }
  
  console.log("用户角色迁移完成");
}

migrateAdminData();
```

### 5.2 模拟会话迁移

**策略：不迁移**

- ✅ 现有模拟会话存储在内存，重启后已丢失
- ✅ 迁移时通知管理员重新开始模拟
- ✅ 无需数据迁移

---

## 6. 迁移时间表

### 6.1 总体时间表（4周）

```
Week 1: 准备工作
├── 安装并配置 Admin 插件
├── 定义权限和角色
├── 创建数据库 Schema
├── 生成迁移文件
└── 编写迁移脚本

Week 2: 开发与测试
├── 创建 AdminController
├── 实现权限装饰器
├── 单元测试
└── 集成测试

Week 3: 数据迁移
├── 备份现有数据
├── 执行迁移脚本
├── 验证角色分配
└── 测试权限系统

Week 4: 上线与验证
├── 灰度发布
├── 监控错误率
├── 用户反馈收集
└── 文档更新
```

### 6.2 Week 1 详细任务

| 日期 | 任务 | 产出物 | 负责人 |
|------|------|--------|--------|
| Day 1 | 安装配置 Admin 插件 | auth.config.ts | 后端 |
| Day 2 | 定义权限和角色 | 权限配置文件 | 后端 |
| Day 3 | 创建数据库 Schema | Schema 文件 | 后端 |
| Day 4 | 生成迁移文件 | SQL 迁移文件 | 后端 |
| Day 5 | 编写迁移脚本 | 迁移脚本 | 后端 |

### 6.3 Week 2 详细任务

| 日期 | 任务 | 产出物 | 负责人 |
|------|------|--------|--------|
| Day 1-2 | 创建 AdminController | Controller 文件 | 后端 |
| Day 3 | 实现权限装饰器 | 装饰器文件 | 后端 |
| Day 4 | 单元测试 | 测试文件 | 后端 |
| Day 5 | 集成测试 | 测试文件 | 后端 |

---

## 7. 风险评估与应对

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 等级 | 应对措施 |
|------|------|------|------|---------|
| **权限系统不兼容** | 中 | 高 | 🟡 | 重新设计权限映射 |
| **数据迁移失败** | 低 | 高 | 🟡 | 完整备份、回滚方案 |
| **管理员功能中断** | 中 | 高 | 🔴 | 灰度发布、快速回滚 |
| **性能下降** | 低 | 中 | 🟢 | 性能测试、监控 |
| **用户投诉** | 低 | 中 | 🟢 | 提前通知、客服支持 |

### 7.2 应对措施

#### 风险 1: 权限系统不兼容

```typescript
// ✅ 应对措施

1. 权限映射表
   | 旧权限 | Better Auth 权限 | 说明 |
   |--------|-----------------|------|
   | role="admin" | role="admin" | 管理员 |
   | role="owner" | role="superadmin" | 超级管理员 |

2. 兼容层（过渡期）
   function mapOldRole(oldRole: string): string {
     return oldRole === "owner" ? "superadmin" : oldRole;
   }

3. 灰度发布
   - 10% 管理员使用新系统
   - 监控错误率
   - 逐步扩大到 100%
```

#### 风险 2: 数据迁移失败

```typescript
// ✅ 应对措施

1. 完整备份
   pg_dump -h localhost -U oksai oksai > backup_before_admin_migration.sql

2. 分步迁移（使用事务）
   await db.transaction(async (tx) => {
     await migrateRoles(tx);
     await validateMigration(tx);
   });

3. 回滚脚本
   scripts/rollback-admin-migration.ts
```

---

## 8. 验收标准

### 8.1 功能验收

```
✅ 用户管理
  □ 可以列出用户（支持搜索、分页）
  □ 可以创建用户
  □ 可以更新用户信息
  □ 可以删除用户

✅ 角色权限
  □ 可以设置用户角色
  □ 可以检查权限
  □ 细粒度权限生效
  □ 权限装饰器正常工作

✅ 用户状态
  □ 可以封禁用户（支持原因和过期时间）
  □ 可以解封用户
  □ 封禁用户无法登录

✅ 会话管理
  □ 可以列出用户会话
  □ 可以撤销单个会话
  □ 可以撤销所有会话

✅ 用户模拟
  □ 可以模拟用户
  □ 可以停止模拟
  □ 模拟会话持久化
  □ 自动审计日志
```

### 8.2 性能验收

```
✅ API 性能
  □ 列出用户 < 100ms
  □ 创建/更新用户 < 50ms
  □ 权限检查 < 10ms
  □ 模拟用户 < 50ms
```

### 8.3 安全验收

```
✅ 权限验证
  □ 管理员可以访问管理功能
  □ 普通用户无法访问管理功能
  □ 细粒度权限生效
  □ 防止权限提升

✅ 审计追踪
  □ 所有管理操作有日志
  □ 用户模拟有记录
  □ 可追溯历史操作
```

### 8.4 迁移验收

```
✅ 数据迁移
  □ 所有用户角色已迁移
  □ 权限映射正确
  □ 无权限丢失
  □ 数据完整性验证通过
```

---

## 9. 附录

### 9.1 参考资料

- [Better Auth Admin Plugin](https://better-auth.com/docs/plugins/admin)
- [Better Auth Access Control](https://better-auth.com/docs/plugins/access-control)
- [Better Auth 官方文档](https://better-auth.com/docs)

### 9.2 相关文档

- [docs/auth-optimization-plan.md](./auth-optimization-plan.md) - 总体优化计划
- [specs/authentication/implementation.md](../specs/authentication/implementation.md) - 实现进度
- [apps/gateway/src/auth/impersonation.service.ts](../apps/gateway/src/auth/impersonation.service.ts) - 当前实现

### 9.3 更新历史

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2026-03-11 | v1.0 | 初始版本 | AI Assistant |

---

**文档状态**: 📋 进行中  
**下一步**: Week 1 准备工作开始
