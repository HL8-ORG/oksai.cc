# Better Auth MikroORM 适配器 - createSchema 功能评估

**评估日期**: 2026-03-05  
**评估对象**: `createSchema` 接口的实现必要性  
**关键结论**: 可选功能，取决于使用场景

---

## 一、问题澄清

### 1.1 文档当前表述

```markdown
| `createSchema` | ❌（当前未提供） | 未实现 |
  当前适配器未对接 Better Auth `createSchema`；
  但 MikroORM 本身已提供 SchemaGenerator |
```

### 1.2 需要澄清的要点

**✅ 正确理解**：
1. ❌ **不是** MikroORM 不支持 Schema 生成
2. ✅ **而是** 适配器未桥接 Better Auth 的 `createSchema` 接口
3. ✅ MikroORM **已具备**完整的 SchemaGenerator（CLI + 编程 API）

---

## 二、Better Auth createSchema 功能分析

### 2.1 接口定义

```typescript
// Better Auth DBAdapter 接口
export interface DBAdapter<Options> {
  // ... 其他方法
  
  createSchema?:
    | ((options: Options, file?: string) => Promise<DBAdapterSchemaCreation>)
    | undefined;  // ⚠️ 可选方法
}
```

**关键特征**：
- ✅ 接口中标记为**可选**（`?`）
- ✅ 不是核心 DBAdapter 功能
- ✅ 主要用于辅助工具

### 2.2 使用场景

#### 场景 1: Better Auth CLI 代码生成

```bash
# 用户运行 CLI 命令
better-auth generate

# Better Auth 调用适配器的 createSchema
# 生成数据库 schema 定义文件
```

**支持的适配器**：
```typescript
// packages/cli/src/generators/index.ts
export const adapters = {
  prisma: generatePrismaSchema,    // 生成 Prisma schema.prisma
  drizzle: generateDrizzleSchema,  // 生成 Drizzle schema.ts
  kysely: generateKyselySchema,    // 生成 Kysely types
};

// 如果适配器不在内置列表中，则调用 adapter.createSchema()
if (adapter.createSchema) {
  return adapter.createSchema(opts.options, opts.file);
}
```

**输出示例**：

**Prisma**:
```prisma
// schema.prisma
model User {
  id            String    @id
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

**Drizzle**:
```typescript
// schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### 场景 2: 自定义适配器 Schema 生成

```typescript
// 适配器实现 createSchema
const mikroOrmAdapter = (orm: MikroORM) => {
  return createAdapterFactory({
    config: { ... },
    adapter() { ... },
    
    // 可选：实现 createSchema
    async createSchema(options, file) {
      // 生成 MikroORM Entity 文件
      return {
        code: generatedCode,
        path: file || "./entities/auth.entity.ts",
        overwrite: false,
      };
    },
  });
};
```

---

## 三、MikroORM SchemaGenerator 能力

### 3.1 CLI 工具

```bash
# 创建 schema
mikro-orm schema:create --run

# 更新 schema
mikro-orm schema:update --run

# 删除 schema
mikro-orm schema:drop --run

# 生成迁移
mikro-orm migration:create
mikro-orm migration:up
mikro-orm migration:down
```

### 3.2 编程 API

```typescript
import { MikroORM } from "@mikro-orm/core";

const orm = await MikroORM.init({
  // 配置
});

// 获取 SchemaGenerator
const generator = orm.schema;

// 创建 schema
await generator.createSchema();

// 更新 schema
await generator.updateSchema();

// 删除 schema
await generator.dropSchema();

// 生成 SQL
const sql = await generator.generate();
console.log(sql);
```

### 3.3 Entity 定义示例

```typescript
import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  email: string;

  @Property()
  emailVerified: boolean = false;

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true })
  image?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

---

## 四、两种工作流对比

### 4.1 工作流 A: 先定义 Entity（MikroORM 推荐方式）

```
步骤 1: 手动编写 MikroORM Entity
  ↓
步骤 2: 使用 MikroORM SchemaGenerator 创建/更新数据库
  ↓
步骤 3: Better Auth 使用 Entity
```

**优点**：
- ✅ 符合 MikroORM 最佳实践
- ✅ 完全控制 Entity 设计
- ✅ 支持复杂关系和约束
- ✅ 类型安全

**缺点**：
- ⚠️ 需要手动编写 Entity
- ⚠️ 需要了解 MikroORM 装饰器

**适用场景**：
- 已有 MikroORM 项目
- 需要自定义 Entity 字段
- 复杂业务逻辑

---

### 4.2 工作流 B: 先生成 Schema（Better Auth CLI 方式）

```
步骤 1: 运行 better-auth generate
  ↓
步骤 2: 自动生成 Entity 文件
  ↓
步骤 3: 使用 MikroORM SchemaGenerator 创建数据库
```

**优点**：
- ✅ 快速启动
- ✅ 自动生成标准 Entity
- ✅ 减少手动编码

**缺点**：
- ⚠️ 生成的 Entity 可能不够灵活
- ⚠️ 需要实现 createSchema 桥接
- ⚠️ 可能需要手动调整生成的代码

**适用场景**：
- 新项目快速原型
- 标准 Better Auth 使用场景
- 不需要复杂 Entity 设计

---

## 五、实现 createSchema 的评估

### 5.1 是否必须实现？

**结论**: ❌ **不是必须的**

**理由**：
1. ✅ `createSchema` 是 DBAdapter 接口中的**可选**方法
2. ✅ MikroORM **已有**完整的 SchemaGenerator
3. ✅ 大多数 MikroORM 用户使用**工作流 A**（先定义 Entity）
4. ✅ 当前适配器已支持所有**核心**功能（95% 对齐度）

### 5.2 实现的好处

如果实现 `createSchema`，将获得：

**1. Better Auth CLI 支持** ✅
```bash
# 用户可以运行
better-auth generate

# 自动生成 MikroORM Entity 文件
```

**2. 更好的开箱即用体验** ✅
- 快速启动新项目
- 减少手动编码
- 标准化 Entity 结构

**3. 与其他适配器功能对齐** ✅
- Prisma: 支持 ✅
- Drizzle: 支持 ✅
- Kysely: 支持 ✅
- MikroORM: 支持 ⏳

### 5.3 实现成本

**工作量**: 1-2 天

**核心代码**（约 100-150 行）：
```typescript
// libs/shared/better-auth-mikro-orm/src/create-schema.ts
import type { BetterAuthOptions } from "better-auth";
import type { DBAdapterSchemaCreation } from "better-auth/adapters";
import { getAuthTables } from "better-auth/db";

export async function createSchema(
  options: BetterAuthOptions,
  file?: string
): Promise<DBAdapterSchemaCreation> {
  // 1. 获取 Better Auth schema
  const tables = getAuthTables(options);
  
  // 2. 生成 MikroORM Entity 代码
  const code = generateMikroORMEntities(tables);
  
  // 3. 返回结果
  return {
    code,
    path: file || "./entities/auth.entity.ts",
    overwrite: false,  // 默认不覆盖
  };
}

function generateMikroORMEntities(tables: any): string {
  let code = `import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";\n\n`;
  
  for (const [modelName, table] of Object.entries(tables)) {
    code += generateEntityClass(modelName, table);
  }
  
  return code;
}

function generateEntityClass(modelName: string, table: any): string {
  const className = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  let code = `@Entity()\nexport class ${className} {\n`;
  
  for (const [fieldName, field] of Object.entries(table.fields)) {
    code += `  ${generateProperty(fieldName, field)}\n`;
  }
  
  code += `}\n\n`;
  
  return code;
}

function generateProperty(fieldName: string, field: any): string {
  const decorators: string[] = [];
  
  if (fieldName === "id") {
    decorators.push("@PrimaryKey()");
  } else {
    const propOptions: string[] = [];
    
    if (field.required === false) {
      propOptions.push("nullable: true");
    }
    
    if (field.defaultValue) {
      propOptions.push(`default: ${JSON.stringify(field.defaultValue)}`);
    }
    
    if (field.references) {
      // 处理外键关系
      return generateRelation(fieldName, field);
    }
    
    const decorator = propOptions.length > 0
      ? `@Property({ ${propOptions.join(", ")} })`
      : "@Property()";
    
    decorators.push(decorator);
  }
  
  const tsType = mapFieldTypeToTS(field.type);
  
  return `${decorators.join("\n  ")}\n  ${fieldName}: ${tsType};`;
}

function generateRelation(fieldName: string, field: any): string {
  const referencedModel = field.references.model;
  const referencedClass = referencedModel.charAt(0).toUpperCase() + referencedModel.slice(1);
  
  return `@ManyToOne(() => ${referencedClass})\n  ${fieldName}: ${referencedClass};`;
}

function mapFieldTypeToTS(type: string): string {
  const typeMap: Record<string, string> = {
    "string": "string",
    "number": "number",
    "boolean": "boolean",
    "date": "Date",
    "json": "Record<string, any>",
    "string[]": "string[]",
    "number[]": "number[]",
  };
  
  return typeMap[type] || "any";
}
```

**集成到适配器**：
```typescript
// libs/shared/better-auth-mikro-orm/src/adapter.ts
export const mikroOrmAdapter = (
  orm: MikroORM,
  config?: MikroOrmAdapterConfig
) => {
  return createAdapterFactory({
    config: { ... },
    adapter() { ... },
    
    // 添加 createSchema 支持
    createSchema: async (options, file) => {
      const { createSchema } = await import("./create-schema.js");
      return createSchema(options, file);
    },
  });
};
```

### 5.4 实现优先级

**建议优先级**: **P3（低优先级）**

**理由**：
1. ✅ 核心功能已完整（95% 对齐度）
2. ✅ MikroORM 已有 SchemaGenerator
3. ⚠️ 大多数用户不需要此功能
4. ⚠️ 可作为后续增强

---

## 六、使用场景对比

### 6.1 场景 1: 新项目快速启动

**需求**: 快速创建认证系统，不想手动编写 Entity

**方案 A（当前）**: 手动编写 Entity
```typescript
// 手动编写 User Entity
@Entity()
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();
  
  @Property()
  email: string;
  
  // ... 更多字段
}

// 手动编写 Session Entity
@Entity()
export class Session {
  @PrimaryKey()
  id: string = crypto.randomUUID();
  
  @Property()
  userId: string;
  
  // ... 更多字段
}
```

**方案 B（实现 createSchema 后）**: 自动生成
```bash
# 运行 CLI 命令
better-auth generate --file ./entities/auth.entity.ts

# 自动生成 Entity 文件
```

**结论**: 方案 B 更快，但方案 A 更灵活

---

### 6.2 场景 2: 已有 MikroORM 项目

**需求**: 已有 MikroORM 项目，需要集成 Better Auth

**当前方案**: ✅ **完全支持**
```typescript
// 1. 已有 User Entity
@Entity()
export class User {
  @PrimaryKey()
  id: string;
  
  @Property()
  email: string;
  
  // 自定义字段
  @Property()
  customField: string;
}

// 2. 配置 Better Auth
const adapter = mikroOrmAdapter(orm);

// 3. 正常使用
```

**是否需要 createSchema**: ❌ **不需要**
- 已有 Entity 定义
- 使用 MikroORM SchemaGenerator 管理数据库

---

### 6.3 场景 3: 标准 Better Auth 使用

**需求**: 使用 Better Auth 标准功能，不需要自定义

**当前方案**: ⚠️ **需要手动编写 Entity**
```typescript
// 需要手动编写标准 Entity
@Entity()
export class User {
  @PrimaryKey()
  id: string;
  
  @Property()
  email: string;
  
  @Property()
  emailVerified: boolean;
  
  // ... 更多标准字段
}
```

**实现 createSchema 后**: ✅ **可自动生成**
```bash
# 一键生成所有标准 Entity
better-auth generate
```

**结论**: 如果大量用户使用标准场景，实现 createSchema 有价值

---

## 七、推荐方案

### 7.1 短期（当前）

**状态**: ❌ 不实现 createSchema

**文档说明**:
```markdown
## createSchema 功能

**当前状态**: 未实现

**原因**:
1. MikroORM 已提供完整的 SchemaGenerator
2. 大多数用户直接使用 MikroORM Entity 定义
3. createSchema 是 Better Auth 接口中的可选方法

**替代方案**:
- 使用 MikroORM CLI: `mikro-orm schema:create`
- 手动编写 Entity（推荐）
- 参考示例: `examples/entity-design.ts`

**未来计划**:
- Phase 3 可能实现（根据用户反馈）
- 用于支持 Better Auth CLI 代码生成
```

### 7.2 中期（可选，Phase 3）

**条件**: 如果用户反馈强烈

**实现步骤**:
1. 创建 `create-schema.ts` 文件（100-150 行）
2. 实现 Better Auth schema → MikroORM Entity 转换
3. 集成到适配器
4. 添加测试和文档

**工作量**: 1-2 天

**优先级**: P3（低优先级）

---

## 八、对比其他适配器

### 8.1 Prisma 适配器

**实现**: ✅ 已实现 createSchema

**原因**:
- Prisma Schema 是独立的 DSL
- 用户需要先生成 schema.prisma 文件
- Better Auth CLI 生成是标准工作流

**输出**:
```prisma
// schema.prisma
model User {
  id String @id
  email String @unique
  // ...
}
```

---

### 8.2 Drizzle 适配器

**实现**: ✅ 已实现 createSchema

**原因**:
- Drizzle 使用 TypeScript 定义 schema
- 用户需要 schema.ts 文件
- Better Auth CLI 生成是常见工作流

**输出**:
```typescript
// schema.ts
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  // ...
});
```

---

### 8.3 MikroORM 适配器

**实现**: ❌ 当前未实现

**是否必要**: ⚠️ **不如 Prisma/Drizzle 必要**

**原因**:
- MikroORM 使用装饰器定义 Entity
- Entity 定义更灵活、功能更强
- 大多数用户直接编写 Entity
- MikroORM 已有完整 SchemaGenerator

**对比总结**:

| 适配器 | createSchema | 必要性 | 原因 |
|--------|--------------|--------|------|
| Prisma | ✅ | **高** | Prisma Schema 是独立 DSL |
| Drizzle | ✅ | **高** | Drizzle Schema 是独立文件 |
| **MikroORM** | ❌ | **中** | Entity 是 TypeScript 类，更灵活 |

---

## 九、用户反馈收集

### 9.1 需要了解的问题

1. **使用场景**:
   - 新项目还是已有项目？
   - 是否需要快速启动？
   - 是否需要自定义 Entity？

2. **工作流偏好**:
   - 倾向于手动编写 Entity？
   - 还是希望自动生成？
   - 是否使用 Better Auth CLI？

3. **功能需求**:
   - createSchema 是否必需？
   - 优先级如何？
   - 是否可以等待 Phase 3？

### 9.2 建议的反馈渠道

1. GitHub Issues
2. 项目 Discussion
3. 用户访谈
4. 社区调查

---

## 十、结论与建议

### 10.1 核心结论

1. **✅ 事实澄清**:
   - ❌ **不是** MikroORM 不支持
   - ✅ **而是** 适配器未桥接
   - ✅ MikroORM 已有完整 SchemaGenerator

2. **⚠️ 实现必要性**:
   - ❌ **不是必须**（接口可选）
   - ⚠️ **锦上添花**（提升体验）
   - ✅ **优先级低**（核心功能已完整）

3. **📊 功能对齐度**:
   - 核心 CRUD: 100% ✅
   - 事务支持: 100% ✅
   - 操作符: 100% ✅
   - createSchema: 0% ❌（可选）
   - **总体对齐度**: **95%** ⭐⭐

### 10.2 文档更新建议

**当前文档**:
```markdown
| `createSchema` | ❌（当前未提供） | 未实现 |
  当前适配器未对接 Better Auth `createSchema`；
  但 MikroORM 本身已提供 SchemaGenerator |
```

**建议更新为**:
```markdown
| `createSchema` | ⚠️（可选，未实现） | 未桥接 |
  适配器未桥接 Better Auth `createSchema` 接口；
  但 MikroORM 本身已提供完整的 SchemaGenerator（CLI + API）；
  此功能为可选增强，计划在 Phase 3 根据用户反馈实现；
  当前可使用 `mikro-orm schema:create` 或手动编写 Entity |
```

### 10.3 行动计划

**立即（P0）**:
- ✅ 更新文档说明
- ✅ 创建评估文档（本文档）

**中期（P3，可选）**:
- ⏳ 收集用户反馈
- ⏳ 评估实现优先级
- ⏳ 实现 createSchema 桥接（如果需要）

---

## 十一、附录

### 11.1 相关文档

- [Better Auth CLI 文档](https://www.better-auth.com/docs/cli)
- [MikroORM SchemaGenerator](https://mikro-orm.nodejs.cn/docs/schema-generator)
- [MikroORM Entity 定义](https://mikro-orm.nodejs.cn/docs/defining-entities)

### 11.2 示例代码

**手动编写 Entity 示例**:
```typescript
// entities/user.entity.ts
import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  email: string;

  @Property()
  emailVerified: boolean = false;

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true })
  image?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

**使用 MikroORM SchemaGenerator**:
```bash
# 创建数据库 schema
mikro-orm schema:create --run

# 生成迁移
mikro-orm migration:create

# 应用迁移
mikro-orm migration:up
```

---

**文档版本**: 1.0  
**最后更新**: 2026-03-05  
**维护者**: oksai.cc 团队
