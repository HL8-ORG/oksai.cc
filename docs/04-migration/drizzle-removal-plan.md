# Drizzle ORM 清理计划

**清理日期**: 2026-03-05  
**清理目标**: 统一使用 MikroORM，移除 Drizzle ORM  
**预计工作量**: 2-3 天

---

## 一、清理原因

### 1.1 当前问题

```
项目同时使用两套 ORM:
  - MikroORM: 主业务逻辑
  - Drizzle: Better Auth 认证系统
```

**影响**:
- ⚠️ 两套 ORM 学习成本
- ⚠️ Schema 重复维护
- ⚠️ 迁移脚本分离
- ⚠️ 依赖冗余

### 1.2 清理后的收益

```
统一技术栈:
  ✅ 单一 ORM（MikroORM）
  ✅ 减少学习成本
  ✅ Schema 统一管理
  ✅ 依赖更清晰
```

---

## 二、清理范围

### 2.1 需要修改的文件

#### 1. 认证配置文件（高优先级）

```
apps/gateway/src/auth/auth.config.ts
  - 移除: drizzleAdapter
  - 替换: mikroOrmAdapter
  - 移除: drizzle, postgres.js 导入
  - 使用: MikroORM 实例
```

#### 2. 示例配置文件

```
apps/gateway/src/auth/auth.config.example.ts
  - 更新示例为 MikroORM
```

#### 3. API Key 服务

```
apps/gateway/src/auth/api-key.service.ts
  - 移除: drizzle-orm 导入和使用
  - 替换: MikroORM EntityManager
  - 重写: 数据库操作逻辑
```

### 2.2 需要删除的文件

```
libs/database/drizzle.config.ts
libs/database/drizzle/
  ├── 0000_flippant_gwen_stacy.sql
  ├── 0001_talented_logan.sql
  ├── 0002_thankful_slayback.sql
  ├── 0003_lumpy_onslaught.sql
  ├── 0004_mean_owl.sql
  ├── 0005_strong_fixer.sql
  ├── meta/
  ├── relations.ts
  └── schema.ts
```

### 2.3 需要移除的依赖

```json
{
  "dependencies": {
    "drizzle-orm": "移除",
    "postgres.js": "移除（Drizzle 使用）"
  },
  "devDependencies": {
    "drizzle-kit": "移除"
  }
}
```

---

## 三、详细清理步骤

### 步骤 1: 迁移 Better Auth 到 MikroORM（P0）

#### 1.1 修改 auth.config.ts

**当前代码**:
```typescript
// apps/gateway/src/auth/auth.config.ts
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function createAuth(configService: ConfigService): any {
  const databaseUrl = configService.getRequired("DATABASE_URL");
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    // ...
  });
}
```

**修改后**:
```typescript
// apps/gateway/src/auth/auth.config.ts
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";

export function createAuth(configService: ConfigService): any {
  const databaseUrl = configService.getRequired("DATABASE_URL");

  // 初始化 MikroORM
  const orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    clientUrl: databaseUrl,
    entities: ['./dist/entities'], // 或使用 ts-morph
    debug: configService.get("NODE_ENV") === "development",
  });

  return betterAuth({
    database: mikroOrmAdapter(orm, {
      debugLogs: configService.get("NODE_ENV") === "development",
    }),
    // ...
  });
}
```

**注意**: MikroORM 初始化是异步的，可能需要调整 `createAuth` 函数签名。

#### 1.2 修改 auth.module.ts

**当前代码**:
```typescript
// apps/gateway/src/auth/auth.module.ts
import { Module } from "@nestjs/common";

@Module({
  // ...
})
export class AuthFeatureModule {}
```

**修改后**:
```typescript
// apps/gateway/src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { MikroOrmDatabaseModule } from "@oksai/database";

@Module({
  imports: [
    MikroOrmDatabaseModule, // 提供 MikroORM 实例
    // ...
  ],
  providers: [
    {
      provide: "AUTH_INSTANCE",
      useFactory: (configService: ConfigService, orm: MikroORM) => {
        return createAuth(configService, orm);
      },
      inject: [ConfigService, MikroORM],
    },
    // ...
  ],
})
export class AuthFeatureModule {}
```

---

### 步骤 2: 迁移 API Key 服务（P0）

#### 2.1 分析当前实现

**当前代码**:
```typescript
// apps/gateway/src/auth/api-key.service.ts
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@oksai/database";
import { apiKeys } from "@oksai/database/schema";

export class ApiKeyService {
  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const result = await db
      .insert(apiKeys)
      .values({ userId, name: dto.name, ... })
      .returning();
    
    return result[0];
  }

  async validateApiKey(hashedKey: string) {
    const result = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.hashedKey, hashedKey),
          isNull(apiKeys.expiresAt) // 或检查是否过期
        )
      );
    
    return result[0];
  }
}
```

#### 2.2 MikroORM 实现

**修改后**:
```typescript
// apps/gateway/src/auth/api-key.service.ts
import { EntityManager } from "@mikro-orm/core";
import { ApiKey } from "@oksai/database/entities";

export class ApiKeyService {
  constructor(private readonly em: EntityManager) {}

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const randomString = randomBytes(32).toString("hex");
    const apiKey = `oks_${randomString}`;
    const hashedKey = createHash("sha256").update(apiKey).digest("hex");
    const prefix = apiKey.substring(0, 11);
    const expiresAt = dto.expiresIn ? new Date(Date.now() + dto.expiresIn * 1000) : null;

    const keyEntity = this.em.create(ApiKey, {
      userId,
      name: dto.name || null,
      prefix,
      hashedKey,
      expiresAt,
    });

    await this.em.persistAndFlush(keyEntity);

    return { ...keyEntity, apiKey }; // 返回明文 key（仅此一次）
  }

  async validateApiKey(hashedKey: string) {
    const key = await this.em.findOne(ApiKey, {
      hashedKey,
    });

    if (!key) {
      return null;
    }

    // 检查是否过期
    if (key.expiresAt && key.expiresAt < new Date()) {
      return null;
    }

    // 检查是否被撤销
    if (key.revokedAt) {
      return null;
    }

    return key;
  }
}
```

#### 2.3 更新模块提供者

```typescript
// apps/gateway/src/auth/auth.module.ts
providers: [
  {
    provide: ApiKeyService,
    useFactory: (em: EntityManager) => {
      return new ApiKeyService(em);
    },
    inject: [EntityManager],
  },
],
```

---

### 步骤 3: 创建 MikroORM Entity（P0）

如果还没有 Better Auth 相关的 MikroORM Entity，需要创建：

```typescript
// libs/database/src/entities/user.entity.ts
import { Entity, PrimaryKey, Property, OneToMany, Collection } from "@mikro-orm/core";
import { Session } from "./session.entity";
import { Account } from "./account.entity";
import { ApiKey } from "./api-key.entity";

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

  @OneToMany(() => Session, session => session.user)
  sessions = new Collection<Session>(this);

  @OneToMany(() => Account, account => account.user)
  accounts = new Collection<Account>(this);

  @OneToMany(() => ApiKey, apiKey => apiKey.user)
  apiKeys = new Collection<ApiKey>(this);
}
```

```typescript
// libs/database/src/entities/session.entity.ts
import { Entity, PrimaryKey, Property, ManyToOne, Index } from "@mikro-orm/core";
import { User } from "./user.entity";

@Entity()
export class Session {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  @Index()
  userId: string;

  @Property()
  expiresAt: Date;

  @Property()
  token: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @ManyToOne(() => User)
  user: User;
}
```

```typescript
// libs/database/src/entities/api-key.entity.ts
import { Entity, PrimaryKey, Property, ManyToOne, Index } from "@mikro-orm/core";
import { User } from "./user.entity";

@Entity()
export class ApiKey {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property()
  @Index()
  userId: string;

  @Property({ nullable: true })
  name?: string;

  @Property()
  prefix: string;

  @Property()
  @Index()
  hashedKey: string;

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property({ nullable: true })
  revokedAt?: Date;

  @Property()
  createdAt: Date = new Date();

  @ManyToOne(() => User)
  user: User;
}
```

---

### 步骤 4: 删除 Drizzle 文件（P1）

```bash
# 删除 Drizzle 配置
rm libs/database/drizzle.config.ts

# 删除 Drizzle 迁移文件
rm -rf libs/database/drizzle/

# 删除 Drizzle schema（如果已迁移到 MikroORM Entity）
rm libs/database/src/schema/auth.schema.ts  # 如果有
```

---

### 步骤 5: 移除 Drizzle 依赖（P1）

#### 5.1 修改 package.json

```bash
# 移除依赖
pnpm remove drizzle-orm drizzle-kit postgres.js

# 如果不再需要，也可以移除
pnpm remove @types/pg  # 如果仅 Drizzle 使用
```

#### 5.2 更新脚本

**移除**:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**保留/更新**:
```json
{
  "scripts": {
    "db:create": "mikro-orm schema:create --run",
    "db:update": "mikro-orm schema:update --run",
    "db:drop": "mikro-orm schema:drop --run",
    "migration:create": "mikro-orm migration:create",
    "migration:up": "mikro-orm migration:up",
    "migration:down": "mikro-orm migration:down"
  }
}
```

---

### 步骤 6: 更新文档（P1）

#### 6.1 更新 README

**移除**:
- Drizzle ORM 相关说明
- Drizzle 命令文档

**添加**:
- MikroORM 统一说明
- MikroORM 命令文档

#### 6.2 更新 AGENTS.md

```markdown
## 数据库

**ORM**: MikroORM

**Schema 管理**: MikroORM SchemaGenerator

**迁移**: MikroORM Migrator

**命令**:
\`\`\`bash
# 创建 schema
mikro-orm schema:create --run

# 更新 schema
mikro-orm schema:update --run

# 生成迁移
mikro-orm migration:create

# 应用迁移
mikro-orm migration:up
\`\`\`
```

---

## 四、测试计划

### 4.1 功能测试

#### 认证功能
- [ ] 用户注册
- [ ] 用户登录（邮箱密码）
- [ ] OAuth 登录（Google、GitHub）
- [ ] Magic Link 登录
- [ ] 2FA 认证
- [ ] Session 管理
- [ ] 密码重置

#### API Key 功能
- [ ] 创建 API Key
- [ ] 验证 API Key
- [ ] 撤销 API Key
- [ ] API Key 过期检查

#### Admin 功能
- [ ] 用户管理
- [ ] 角色管理
- [ ] 权限检查

### 4.2 数据迁移测试

- [ ] 验证现有用户数据
- [ ] 验证现有 Session 数据
- [ ] 验证现有 API Key 数据
- [ ] 检查数据完整性

### 4.3 性能测试

- [ ] 登录性能（与 Drizzle 对比）
- [ ] API Key 验证性能
- [ ] Session 查询性能

---

## 五、回滚计划

如果迁移出现问题，可以快速回滚：

### 5.1 代码回滚

```bash
# Git 回滚
git checkout HEAD~1 -- apps/gateway/src/auth/
```

### 5.2 依赖回滚

```bash
# 重新安装 Drizzle
pnpm add drizzle-orm postgres.js
pnpm add -D drizzle-kit
```

### 5.3 数据回滚

- Drizzle 迁移文件仍然保留在 `libs/database/drizzle/`（备份）
- 可以重新运行 Drizzle 迁移

---

## 六、执行清单

### Phase 1: 准备工作（0.5 天）

- [ ] 备份当前代码（Git tag: `pre-drizzle-removal`）
- [ ] 备份数据库
- [ ] 创建 MikroORM Entity（如果还没有）
- [ ] 测试 MikroORM Entity

### Phase 2: 迁移 Better Auth（1 天）

- [ ] 修改 `auth.config.ts` 使用 MikroORM 适配器
- [ ] 修改 `auth.module.ts` 提供者配置
- [ ] 测试认证功能
- [ ] 修复问题

### Phase 3: 迁移 API Key 服务（0.5 天）

- [ ] 重写 `api-key.service.ts` 使用 MikroORM
- [ ] 测试 API Key 功能
- [ ] 修复问题

### Phase 4: 清理 Drizzle（0.5 天）

- [ ] 删除 Drizzle 配置和迁移文件
- [ ] 移除 Drizzle 依赖
- [ ] 更新脚本
- [ ] 更新文档

### Phase 5: 测试验证（0.5 天）

- [ ] 运行完整测试套件
- [ ] 手动测试关键功能
- [ ] 性能测试
- [ ] 文档验证

---

## 七、风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| MikroORM 适配器功能不完整 | 高 | 低 | 已验证 95% 对齐度 |
| 数据迁移失败 | 高 | 低 | 备份数据库，保留 Drizzle 文件 |
| 性能下降 | 中 | 低 | 性能测试对比 |
| 认证流程中断 | 高 | 低 | 分阶段迁移，充分测试 |

---

## 八、完成标准

- [ ] 所有认证功能正常工作
- [ ] API Key 功能正常工作
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] Drizzle 相关代码已移除
- [ ] Drizzle 依赖已移除
- [ ] 性能无明显下降

---

## 九、相关文档

- [MikroORM 适配器文档](../libs/shared/better-auth-mikro-orm/README.md)
- [MikroORM 官方文档](https://mikro-orm.io/docs)
- [Better Auth 集成指南](../specs/nestjs-better-auth/design.md)

---

**文档版本**: 1.0  
**创建日期**: 2026-03-05  
**预计完成**: 2026-03-08  
**负责人**: oksai.cc 团队
