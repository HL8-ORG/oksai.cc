# `libs/shared/better-auth-mikro-orm` 对 Better Auth DBAdapter 关键契约支持评估

**评估日期**: 2026-03-05  
**评估对象**: `libs/shared/better-auth-mikro-orm`  
**契约来源**: `forks/better-auth/packages/core/src/db/adapter/index.ts` 中 `DBAdapter` / `CustomAdapter` 定义  
**结论摘要**: **已支持核心 DBAdapter 关键契约，可用于当前主线；但存在“事务语义与高级 join 能力”边界。**

---

## 1. 评估口径

本次评估按“关键契约”分为两层：

1. **运行时必须能力（P0）**：`create/findOne/findMany/update/updateMany/delete/deleteMany/count/transaction/id`
2. **扩展能力（P1）**：`createSchema`、`options`、`join` 的高级路径

同时区分：

- **直接实现**：在 `libs/shared/better-auth-mikro-orm/src/adapter.ts` 中显式实现
- **工厂补全**：由 `createAdapterFactory` 自动补全（如 `transaction`、`id`、`options`）

---

## 2. 逐项契约对照


| 契约项            | 支持情况     | 支持方式 | 说明                                                |
| -------------- | -------- | ---- | ------------------------------------------------- |
| `create`       | ✅        | 直接实现 | 使用 `em.create + persistAndFlush`                  |
| `findOne`      | ✅        | 直接实现 | 支持 `where` 与 `select`                             |
| `findMany`     | ✅        | 直接实现 | 支持 `where/limit/offset/sortBy`                    |
| `update`       | ✅        | 直接实现 | `em.assign + flush`，不存在返回 `null`                  |
| `updateMany`   | ✅        | 直接实现 | `em.nativeUpdate`                                 |
| `delete`       | ✅        | 直接实现 | 先查后删，幂等                                           |
| `deleteMany`   | ✅        | 直接实现 | `em.nativeDelete`                                 |
| `count`        | ✅        | 直接实现 | `em.count`                                        |
| `transaction`  | ✅（语义受限）  | 工厂补全 | 当前未注入自定义 transaction，默认是顺序执行回调（as-is transaction） |
| `id`           | ✅        | 工厂补全 | 由 `adapterId` 注入                                  |
| `options`      | ✅        | 工厂补全 | 暴露 `adapterConfig`                                |
| `createSchema` | ⚠️（可选，未桥接） | 未桥接 | 适配器未桥接 Better Auth `createSchema` 接口；但 MikroORM 本身已提供完整的 SchemaGenerator（CLI + API）；此功能为可选增强，计划在 Phase 3 根据用户反馈实现；详见 `docs/better-auth-mikro-orm-createschema-evaluation.md` |


---

## 3. 关键发现

### 3.1 已满足“可运行主链路”的关键契约

该库已覆盖 Better Auth 认证主流程所依赖的核心 CRUD 契约，并且具备：

- where 操作符映射（`in/contains/starts_with/ends_with/gt/gte/lt/lte/ne`）
- 实体名/表名映射能力
- 输入输出标准化与错误统一封装
- `em.fork()` 上下文隔离，降低 EntityManager 污染风险

因此在当前迁移主线中，可判定为 **“关键契约已支持”**。

### 3.2 `transaction` 为“契约满足、语义弱保证”

`DBAdapter` 要求存在 `transaction` 方法。  
当前实现未在 `adapter.ts` 传入 `config.transaction`，因此由 Better Auth 工厂使用默认兜底逻辑：

- 能调用 `transaction(cb)`（契约层面满足）
- 但不等价于 MikroORM 的真实数据库事务边界（语义层面弱保证）

这意味着：

- 对一般认证流程可用
- 对“多写操作强一致场景”需谨慎，建议后续补强

### 3.3 join 高级路径存在边界

当前适配器本体未实现原生 join 参数处理。  
在 Better Auth 默认（未开启 `experimental.joins`）场景下，工厂可走 fallback join 逻辑，不阻塞使用。  
若未来开启 `experimental.joins` 并期待适配器原生 join，则需要额外实现。

---

## 4. 测试与证据

本库当前测试通过情况：

- `src/spec/adapter.spec.ts`
- `src/spec/utils/adapter-utils.spec.ts`
- `src/spec/utils/create-adapter-error.spec.ts`

合计 **32/32 通过**（Vitest）。

说明：

- 单元测试覆盖较完整（方法存在性、输入输出规范化、where 操作符映射、错误封装）
- 但仍需补“真实数据库 + Better Auth 全链路”集成测试，以验证事务语义与复杂关系模型

---

## 5. 最终结论

## 结论：是，已支持 Better Auth DBAdapter 关键契约（可用于当前主线）。

但需明确两个边界：

1. `transaction` 当前为工厂兜底语义，不是强事务保证
2. `createSchema`（适配器层对接）与高级原生 join 仍未覆盖

> 补充说明：MikroORM 新版已具备 SchemaGenerator（CLI 与编程 API）。当前缺口是“本适配器尚未桥接 Better Auth `createSchema`”，不是 MikroORM 本身不支持。参考：[MikroORM SchemaGenerator](https://mikro-orm.nodejs.cn/docs/schema-generator)

---

## 6. 建议的下一步

1. **补强事务语义**：将 MikroORM `transactional` 能力接入 `config.transaction`
2. **增加集成测试**：引入真实 PostgreSQL 场景验证事务回滚与并发一致性
3. **明确功能边界文档**：将“支持矩阵/限制项”写入该库 README，避免误用
4. **按需评估 `createSchema`**：若团队需要 Better Auth 生成 schema，则补实现；否则在文档中保持明确“不支持”

