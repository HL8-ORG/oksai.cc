# specs/tenancy/examples 修正进度跟踪

## 状态： 🔄 进行中

---

## 目标

将所有 `.ts` 示例文件转换为符合架构规范的 `.md` 格式文档。

---

## 已完成

### ✅ 目录结构创建

- [x] 创建了符合规范的目录结构
- [x] `domain/tenant/`
- [x] `domain/tenant/events/`
- [x] `application/commands/`
- [x] `application/queries/`
- [x] `infrastructure/persistence/`
- [x] `infrastructure/adapters/`

### ✅ 值对象示例 (3/3)

1. **tenant-plan.vo.example.md** ✅
   - 文件命名：✅ `tenant-plan.vo.ts`
   - 类命名：✅ `TenantPlan`
   - 规范要求：✅ 符合 spec-02-domain.md

   - 代码完整度：✅ 完整
   - 说明文档：✅ 包含规范要求、关键点、使用示例

   - 状态：✅ 完成

2. **tenant-status.vo.example.md** ✅
   - 文件命名：✅ `tenant-status.vo.ts`
   - 类命名：✅ `TenantStatus`
   - 状态转换规则：✅ 清晰
   - 状态：✅ 完成

3. **tenant-quota.vo.example.md** ✅
   - 文件命名：✅ `tenant-quota.vo.ts`
   - 类命名：✅ `TenantQuota`
   - 状态：✅ 完成

---

## 进行中

### ⏳ 领域事件 (5 个文件)

1. **tenant-created.domain-event.example.md**
2. **tenant-activated.domain-event.example.md**
3. **tenant-suspended.domain-event.example.md**
4. **tenant-plan-changed.domain-event.example.md**
5. **tenant-quota-updated.domain-event.example.md**

### ⏳ 聚合根

1. **tenant.aggregate.example.md**

### ⏳ Repository 接口

1. **tenant.repository.example.md** (接口定义)

### ⏳ Command/Handler (2 个文件)

1. **create-tenant.command.example.md**
2. **create-tenant.handler.example.md**

---

## 待开始

### 🔲 基础设施层

1. **mikro-orm-tenant.repository.example.md** (实现)
2. **tenant-context.adapter.example.md**

### 🔲 应用层

1. **activate-tenant.command.example.md**
2. **activate-tenant.handler.example.md**
3. **get-tenant.query.example.md**
4. **get-tenant.handler.example.md**

### 🔲 文档

1. **README.md** (总体说明)
2. **DIRECTORY-STRUCTURE.example.md** (目录结构示例)

---

## 删除的旧文件 (稍后)

- [ ] `tenant.aggregate.example.ts`
- [ ] `tenant.repository.example.ts`
- [ ] `create-tenant.handler.example.ts`

- [ ] 旧的 README.md

---

## 预计完成时间

- **值对象**: ✅ 已完成 (3 个文件)
- **领域事件**: ⏳ 15 分钟
- **聚合根**: ⏳ 10 分钟
- **Repository 接口**: ⏳ 5 分钟
- **Command/Handler**: ⏳ 10 分钟
- **基础设施层**: ⏳ 20 分钟
- **应用层**: ⏳ 10 分钟
- **文档**: ⏳ 5 分钟
- **删除旧文件**: ⏳ 2 分钟

- **验证**: ⏳ 5 分钟

**总计**: ~1.5 小时
