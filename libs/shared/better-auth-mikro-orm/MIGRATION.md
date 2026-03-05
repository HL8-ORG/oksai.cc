# Better Auth MikroORM 适配器 - 迁移指南

本指南帮助你从其他数据库适配器（如 Drizzle ORM）迁移到 MikroORM 适配器。

## 目录

- [从 Drizzle ORM 迁移](#从-drizzle-orm-迁移)
- [从 Prisma 迁移](#从-prisma-迁移)
- [从其他适配器迁移](#从其他适配器迁移)
- [数据迁移](#数据迁移)
- [常见问题](#常见问题)

---

## 从 Drizzle ORM 迁移

### 1. 安装依赖

```bash
# 卸载 Drizzle 相关包
pnpm remove drizzle-orm drizzle-kit

# 安装 MikroORM
pnpm add @mikro-orm/core @mikro-orm/postgresql
```

### 2. Schema 定义对比

#### Drizzle Schema

```typescript
// drizzle/schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### MikroORM Entity

```typescript
// entities/user.entity.ts
import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity()
@Unique({ properties: ["email"] })
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "string", nullable: true })
  image?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string) {
    this.email = email;
  }
}
```

```typescript
// entities/session.entity.ts
import { Entity, PrimaryKey, Property, Index, Unique, ManyToOne } from "@mikro-orm/core";
import { User } from "./user.entity";

@Entity()
@Unique({ properties: ["token"] })
export class Session {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  @Index()
  userId: string;

  @Property({ type: "Date" })
  expiresAt: Date;

  @Property({ type: "string" })
  token: string;

  @Property({ type: "string", nullable: true })
  ipAddress?: string;

  @Property({ type: "string", nullable: true })
  userAgent?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(userId: string, token: string, expiresAt: Date) {
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
  }
}
```

### 3. 配置更新

#### Drizzle 配置

```typescript
// auth.ts (Drizzle)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});
```

#### MikroORM 配置

```typescript
// auth.ts (MikroORM)
import { betterAuth } from "better-auth";
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { orm } from "./orm";

export const auth = betterAuth({
  database: mikroOrmAdapter(orm, {
    debugLogs: process.env.NODE_ENV === "development",
    supportsJSON: true,
  }),
  advanced: {
    database: {
      generateId: false, // 禁用 Better Auth 的 ID 生成
    },
  },
});
```

### 4. 初始化 MikroORM

```typescript
// orm.ts
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User, Session, Account } from "./entities";

export const orm = await MikroORM.init({
  driver: PostgreSqlDriver,
  dbName: process.env.DB_NAME || "your-database",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  entities: [User, Session, Account],
  debug: process.env.NODE_ENV === "development",
});
```

### 5. 迁移工具

创建自动迁移脚本：

```typescript
// scripts/migrate-to-mikro-orm.ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface DrizzleField {
  name: string;
  type: string;
  nullable?: boolean;
  default?: any;
  references?: string;
  unique?: boolean;
  primary?: boolean;
}

/**
 * 将 Drizzle Schema 转换为 MikroORM Entity
 */
function drizzleToMikroOrm(tableName: string, fields: DrizzleField[]): string {
  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1, -1);

  let entityCode = `import { Entity, PrimaryKey, Property, Unique, Index, ManyToOne } from "@mikro-orm/core";\n\n`;
  entityCode += `@Entity()\n`;

  // 收集唯一字段
  const uniqueFields = fields.filter((f) => f.unique && !f.primary);
  if (uniqueFields.length > 0) {
    entityCode += `@Unique({ properties: [${uniqueFields.map((f) => `"${f.name}"`).join(", ")}] })\n`;
  }

  entityCode += `export class ${className} {\n`;

  for (const field of fields) {
    if (field.primary) {
      entityCode += `  @PrimaryKey()\n`;
      entityCode += `  ${field.name}: string = crypto.randomUUID();\n\n`;
    } else {
      const mikroOrmType = mapDrizzleTypeToMikroOrm(field.type);
      const nullable = field.nullable ? ", nullable: true" : "";
      const defaultValue = field.default ? `, default: ${JSON.stringify(field.default)}` : "";

      if (field.references) {
        const refClassName = field.references.charAt(0).toUpperCase() + field.references.slice(1, -1);
        entityCode += `  @ManyToOne(() => ${refClassName})\n`;
        entityCode += `  @Index()\n`;
        entityCode += `  ${field.name}: ${refClassName};\n\n`;
      } else {
        entityCode += `  @Property({ type: "${mikroOrmType}"${nullable}${defaultValue} })\n`;
        if (field.unique) {
          entityCode += `  @Index()\n`;
        }
        entityCode += `  ${field.name}${field.nullable ? "?" : ""}: ${mikroOrmType};\n\n`;
      }
    }
  }

  entityCode += `}\n`;

  return entityCode;
}

function mapDrizzleTypeToMikroOrm(drizzleType: string): string {
  const typeMap: Record<string, string> = {
    text: "string",
    varchar: "string",
    boolean: "boolean",
    timestamp: "Date",
    integer: "number",
    json: "json",
  };

  return typeMap[drizzleType] || "string";
}

// 使用示例
const userFields: DrizzleField[] = [
  { name: "id", type: "text", primary: true },
  { name: "email", type: "text", unique: true },
  { name: "name", type: "text", nullable: true },
  { name: "createdAt", type: "timestamp", default: "now()" },
];

const userEntity = drizzleToMikroOrm("users", userFields);
console.log(userEntity);
```

---

## 从 Prisma 迁移

### 1. Schema 定义对比

#### Prisma Schema

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]

  @@map("user")
}

model Session {
  id         String   @id @default(uuid())
  userId     String
  expiresAt  DateTime
  token      String   @unique
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}
```

#### MikroORM Entity

```typescript
// entities/user.entity.ts
@Entity()
@Unique({ properties: ["email"] })
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "boolean", default: false })
  emailVerified: boolean = false;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "string", nullable: true })
  image?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(email: string) {
    this.email = email;
  }
}
```

### 2. 关键差异

| 特性 | Prisma | MikroORM |
|-----|--------|----------|
| 关系定义 | `@relation` | `@ManyToOne`, `@OneToMany` |
| 默认值 | `@default()` | `default: value` |
| 更新时间 | `@updatedAt` | `onUpdate: () => new Date()` |
| 可选字段 | `String?` | `nullable: true` |
| 唯一约束 | `@unique` | `@Unique({ properties: [...] })` |
| 表名映射 | `@@map("name")` | `@Entity({ tableName: "name" })` |

---

## 从其他适配器迁移

### Kysely → MikroORM

```typescript
// Kysely Schema
interface UserTable {
  id: Generated<string>;
  email: string;
  name: string | null;
}

// MikroORM Entity
@Entity()
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "string", nullable: true })
  name?: string;
}
```

### TypeORM → MikroORM

```typescript
// TypeORM Entity
@Entity("user")
export class User {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// MikroORM Entity
@Entity()
@Unique({ properties: ["email"] })
export class User {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: "string" })
  email: string;

  @Property({ type: "string", nullable: true })
  name?: string;

  @Property({ type: "Date" })
  createdAt: Date = new Date();

  @Property({ type: "Date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

---

## 数据迁移

### 1. 导出现有数据

```bash
# PostgreSQL
pg_dump -U postgres -d your-database --data-only --inserts > data.sql

# 或使用 CSV
psql -U postgres -d your-database -c "COPY (SELECT * FROM user) TO STDOUT WITH CSV HEADER" > users.csv
```

### 2. 创建 MikroORM Schema

```bash
# 生成迁移
pnpm mikro-orm migration:create --initial

# 运行迁移
pnpm mikro-orm migration:up
```

### 3. 导入数据

```typescript
// scripts/import-data.ts
import { orm } from "../src/orm";
import { User } from "../src/entities/user.entity";
import fs from "node:fs";
import { parse } from "csv-parse/sync";

async function importUsers() {
  const em = orm.em.fork();

  // 从 CSV 读取
  const csvData = fs.readFileSync("users.csv", "utf-8");
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  // 批量插入
  const users = records.map((record: any) => {
    return em.create(User, {
      id: record.id,
      email: record.email,
      name: record.name,
      emailVerified: record.email_verified === "true",
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  });

  await em.flush();
  console.log(`✅ 导入了 ${users.length} 个用户`);
}

importUsers();
```

### 4. 验证数据完整性

```typescript
// scripts/verify-migration.ts
import { orm } from "../src/orm";
import { User, Session } from "../src/entities";

async function verifyMigration() {
  const em = orm.em.fork();

  // 验证用户数量
  const userCount = await em.count(User);
  console.log("用户总数:", userCount);

  // 验证会话数量
  const sessionCount = await em.count(Session);
  console.log("会话总数:", sessionCount);

  // 验证关系
  const usersWithSessions = await em.find(User, {}, {
    populate: ["sessions"],
  });

  console.log("有会话的用户:", usersWithSessions.length);

  // 验证数据一致性
  for (const user of usersWithSessions) {
    const sessions = await em.find(Session, { userId: user.id });
    if (sessions.length !== user.sessions.length) {
      console.error(`❌ 用户 ${user.id} 的会话数量不一致`);
    }
  }

  console.log("✅ 数据验证完成");
}

verifyMigration();
```

---

## 常见问题

### Q1: 如何处理关系映射？

**Drizzle**: 使用 `references()` 定义外键
**MikroORM**: 使用 `@ManyToOne`, `@OneToMany` 装饰器

```typescript
// Drizzle
userId: text("user_id").references(() => users.id)

// MikroORM
@ManyToOne(() => User)
user: User;
```

### Q2: 如何迁移默认值？

```typescript
// Drizzle
emailVerified: boolean("email_verified").default(false)

// MikroORM
@Property({ type: "boolean", default: false })
emailVerified: boolean = false;
```

### Q3: 如何处理唯一约束？

```typescript
// Drizzle
email: text("email").unique()

// MikroORM
@Entity()
@Unique({ properties: ["email"] })
export class User {
  @Property({ type: "string" })
  email: string;
}
```

### Q4: 如何处理索引？

```typescript
// Drizzle
userId: text("user_id").notNull()

// MikroORM
@Property({ type: "string" })
@Index()
userId: string;
```

### Q5: 迁移后性能是否有变化？

MikroORM 的性能通常与 Drizzle 相当或更好，特别是在：

- ✅ 复杂查询（使用 QueryBuilder）
- ✅ 批量操作（使用 `nativeInsert`/`nativeUpdate`）
- ✅ 关联加载（使用 `populate`）

但在以下场景可能稍慢：

- ⚠️ 简单的 CRUD 操作（因为额外的抽象层）
- ⚠️ 大批量插入（建议使用 `nativeInsert`）

### Q6: 如何处理 JSON 字段？

```typescript
// Drizzle
metadata: json("metadata")

// MikroORM
@Property({ type: "json", nullable: true })
metadata?: Record<string, any>;
```

### Q7: 如何处理枚举？

```typescript
// Drizzle
role: text("role", { enum: ["user", "admin"] }).default("user")

// MikroORM
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Entity()
export class User {
  @Property({ type: "string", default: UserRole.USER })
  role: UserRole = UserRole.USER;
}
```

### Q8: 迁移后如何调试？

1. **启用 MikroORM 调试模式**:

```typescript
const orm = await MikroORM.init({
  // ...其他配置
  debug: true, // 启用调试日志
});
```

2. **启用 Better Auth 调试**:

```typescript
const adapter = mikroOrmAdapter(orm, {
  debugLogs: {
    isRunningAdapterTests: true,
  },
});
```

3. **查看 SQL 查询**:

```typescript
orm.config.set("debug", true);
```

---

## 迁移检查清单

### 迁移前

- [ ] 备份现有数据库
- [ ] 导出现有数据（CSV 或 SQL）
- [ ] 记录现有的 Schema 定义
- [ ] 测试环境验证迁移

### 迁移中

- [ ] 安装 MikroORM 依赖
- [ ] 创建 Entity 定义
- [ ] 配置 MikroORM 连接
- [ ] 更新 Better Auth 配置
- [ ] 生成迁移文件
- [ ] 运行迁移
- [ ] 导入数据

### 迁移后

- [ ] 验证数据完整性
- [ ] 测试所有认证流程
- [ ] 测试事务支持
- [ ] 性能测试
- [ ] 更新文档
- [ ] 删除旧的依赖

---

## 获取帮助

如果在迁移过程中遇到问题：

1. 查阅 [MikroORM 官方文档](https://mikro-orm.io/docs/)
2. 查看 [Better Auth 文档](https://www.better-auth.com/docs)
3. 在 [GitHub Issues](https://github.com/oksai/oksai.cc/issues) 提问
4. 查看 [LIMITATIONS.md](./LIMITATIONS.md) 了解限制

---

**维护者**: oksai.cc 团队
**最后更新**: 2026-03-05
