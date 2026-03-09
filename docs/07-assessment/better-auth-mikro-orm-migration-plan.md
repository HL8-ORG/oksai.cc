# better-auth-mikro-orm 迁移计划

**计划日期**: 2026-03-04  
**迁移范围**: 从 oksai-data-platform 迁移 better-auth-mikro-orm 到 oksai.cc  
**预计周期**: 1 天  

---

## 📋 执行摘要

### 迁移目标

**从 oksai-data-platform 复制 better-auth-mikro-orm 库到 oksai.cc 项目，为 MikroORM 迁移提供基础支持。**

### 核心收益

```
✅ 节省开发时间         > 1 周
✅ 复用已验证代码       生产环境验证
✅ 自动事务管理         Unit of Work
✅ 自动事件管理         生命周期钩子
✅ 减少 60% 样板代码    提高开发效率
```

### 预计成本

```
人力投入：1 人天
风险等级：🟢 低
业务影响：🟢 无影响（新增功能）
```

---

## 一、迁移策略

### 1.1 直接复制策略 ⭐⭐⭐⭐⭐

**原则**：保持代码原貌，最小化修改

```
步骤：
  1. 复制库代码到 oksai.cc
  2. 调整 package.json 依赖
  3. 保持原有测试
  4. 更新导入路径
  5. 验证功能正常
```

**优点**：
- ✅ 快速（< 1 天）
- ✅ 风险低（代码已验证）
- ✅ 可自定义修改
- ✅ 无需发布流程

---

## 二、迁移步骤

### 2.1 准备工作 (15 分钟)

#### 2.1.1 检查源库状态

```bash
# 1. 确认源库路径
cd /home/arligle/oks/oksai-data-plateform
ls -la libs/shared/better-auth-mikro-orm

# 2. 检查代码完整性
cat libs/shared/better-auth-mikro-orm/package.json

# 3. 确认测试通过
cd libs/shared/better-auth-mikro-orm
pnpm test
```

#### 2.1.2 检查目标项目结构

```bash
# 1. 确认 oksai.cc 项目结构
cd /home/arligle/oks/oksai.cc
ls -la libs/shared/

# 2. 确认依赖版本
cat pnpm-workspace.yaml | grep -E "(mikro-orm|better-auth)"
```

### 2.2 复制代码 (10 分钟)

```bash
# 1. 复制整个库目录
cp -r /home/arligle/oks/oksai-data-plateform/libs/shared/better-auth-mikro-orm \
      /home/arligle/oks/oksai.cc/libs/shared/

# 2. 验证复制成功
cd /home/arligle/oks/oksai.cc
ls -la libs/shared/better-auth-mikro-orm
```

### 2.3 调整配置 (20 分钟)

#### 2.3.1 更新 package.json

```json
// libs/shared/better-auth-mikro-orm/package.json
{
  "name": "@oksai/better-auth-mikro-orm",
  "version": "0.1.0",
  "description": "Mikro ORM Adapter for Better Auth - oksai.cc 定制版",
  "keywords": [
    "auth",
    "better-auth",
    "database",
    "adapter",
    "mikro-orm"
  ],
  "license": "MIT",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc -p tsconfig.build.json --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "dset": "^3.1.4"
  },
  "peerDependencies": {
    "@mikro-orm/core": ">=6.0.0",
    "better-auth": ">=1.0.0"
  },
  "devDependencies": {
    "@mikro-orm/core": "catalog:",
    "better-auth": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**修改点**：
- ✅ 更新描述为 oksai.cc 定制版
- ✅ 统一使用 catalog: 版本管理
- ✅ 迁移到 Vitest（与项目统一）

#### 2.3.2 更新 TypeScript 配置

```json
// libs/shared/better-auth-mikro-orm/tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/*.spec.ts"]
}
```

#### 2.3.3 删除 Jest 配置，使用 Vitest

```bash
# 删除 Jest 配置
rm libs/shared/better-auth-mikro-orm/jest.config.js
rm libs/shared/better-auth-mikro-orm/tsconfig.spec.json

# 创建 Vitest 配置
cat > libs/shared/better-auth-mikro-orm/vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
EOF
```

#### 2.3.4 更新测试文件

```typescript
// libs/shared/better-auth-mikro-orm/src/spec/adapter.spec.ts
/**
 * mikroOrmAdapter 单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { mikroOrmAdapter } from '../adapter';

// Mock better-auth
vi.mock('better-auth', () => ({
  BetterAuthError: class BetterAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'BetterAuthError';
    }
  }
}));

vi.mock('better-auth/adapters', () => ({
  createAdapter: vi.fn((config: any) => {
    const factory: any = () => config.adapter();
    factory.id = config.config.adapterId;
    factory.name = config.config.adapterName;
    return factory;
  })
}));

describe('mikroOrmAdapter', () => {
  it('应该创建适配器工厂', () => {
    const mockOrm = {
      em: {
        fork: () => ({
          create: vi.fn(),
          findOne: vi.fn(),
          find: vi.fn(),
          persistAndFlush: vi.fn(),
          flush: vi.fn(),
          removeAndFlush: vi.fn(),
          assign: vi.fn(),
          nativeUpdate: vi.fn(),
          nativeDelete: vi.fn(),
          count: vi.fn(),
        }),
      },
      config: {
        getNamingStrategy: () => ({
          getEntityName: (name: string) => name,
          classToTableName: (name: string) => name.toLowerCase(),
          propertyToColumnName: (name: string) => name,
          joinColumnName: (name: string) => `${name}_id`,
          columnNameToProperty: (name: string) => name,
          referenceColumnName: () => 'id',
        }),
      },
      getMetadata: () => ({
        has: () => true,
        get: () => ({
          className: 'User',
          tableName: 'user',
          props: [],
        }),
        getAll: () => ({}),
      }),
    };

    const adapter = mikroOrmAdapter(mockOrm as any);

    expect(adapter.id).toBe('mikro-orm-adapter');
    expect(adapter.name).toBe('Mikro ORM Adapter');
  });
});
```

### 2.4 安装依赖 (5 分钟)

```bash
# 1. 安装 dset（唯一的新依赖）
cd /home/arligle/oks/oksai.cc
pnpm add dset -w

# 2. 安装到库（peerDependencies）
cd libs/shared/better-auth-mikro-orm
pnpm install
```

### 2.5 构建测试 (10 分钟)

```bash
# 1. 构建
cd /home/arligle/oks/oksai.cc
pnpm nx build @oksai/better-auth-mikro-orm

# 2. 运行测试
pnpm nx test @oksai/better-auth-mikro-orm

# 3. 类型检查
pnpm nx typecheck @oksai/better-auth-mikro-orm
```

---

## 三、集成方案

### 3.1 在 gateway 中使用

#### 3.1.1 配置 MikroORM

```typescript
// libs/database/src/mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  dbName: process.env.DB_NAME || 'oksai',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'oksai',
  password: process.env.DB_PASSWORD || 'oksai_dev_password',
  debug: process.env.NODE_ENV === 'development',
  metadataProvider: TsMorphMetadataProvider,
});
```

#### 3.1.2 创建 Entity

```typescript
// libs/database/src/entities/user.entity.ts
import { Entity, Property, PrimaryKey, BeforeCreate } from '@mikro-orm/core';
import { AggregateRoot } from '@oksai/domain-core';

@Entity()
export class User extends AggregateRoot<UserProps> {
  @PrimaryKey()
  id: string;

  @Property()
  email: string;

  @Property()
  name: string;

  @Property({ nullable: true })
  emailVerified?: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @BeforeCreate()
  beforeCreate() {
    this.addDomainEvent(new UserCreatedEvent(this));
  }
}

// libs/database/src/entities/session.entity.ts
@Entity()
export class Session {
  @PrimaryKey()
  id: string;

  @Property()
  userId: string;

  @Property()
  token: string;

  @Property()
  expiresAt: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

#### 3.1.3 配置 Better Auth

```typescript
// libs/auth/better-auth/src/better-auth.config.ts
import type { MikroORM } from '@mikro-orm/core';
import { betterAuth } from 'better-auth';
import { organization, admin } from 'better-auth/plugins';
import { mikroOrmAdapter } from '@oksai/better-auth-mikro-orm';

/**
 * Better Auth 配置选项
 */
export interface BetterAuthConfigOptions {
  secret: string;
  baseURL: string;
  orm: MikroORM;
  requireEmailVerification?: boolean;
}

/**
 * 创建 Better Auth 实例
 */
export function createBetterAuthInstance(options: BetterAuthConfigOptions) {
  const { secret, baseURL, orm, requireEmailVerification = true } = options;

  return betterAuth({
    database: mikroOrmAdapter(orm, {
      debugLogs: process.env.NODE_ENV === 'development',
    }),
    
    secret,
    baseURL,
    
    emailAndPassword: {
      enabled: true,
      requireEmailVerification,
    },
    
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
      }),
      admin({
        defaultRole: 'user',
        adminRole: 'admin',
      }),
    ],
    
    advanced: {
      database: {
        generateId: false, // 使用 MikroORM 的 ID 生成
      },
    },
  });
}
```

#### 3.1.4 在 AppModule 中集成

```typescript
// apps/gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@oksai/config';
import { AuthModule } from '@oksai/nestjs-better-auth';
import { createBetterAuthInstance } from '@oksai/auth/better-auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgresql',
        dbName: configService.get('DB_NAME') || 'oksai',
        host: configService.get('DB_HOST') || 'localhost',
        port: configService.get('DB_PORT') || 5432,
        user: configService.get('DB_USER') || 'oksai',
        password: configService.get('DB_PASSWORD') || 'oksai_dev_password',
        debug: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    
    AuthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService, orm: MikroORM) => {
        const auth = createBetterAuthInstance({
          secret: configService.getRequired('BETTER_AUTH_SECRET'),
          baseURL: configService.getRequired('BETTER_AUTH_BASE_URL'),
          orm,
        });
        
        return { auth };
      },
      inject: [ConfigService, MikroORM],
    }),
  ],
})
export class AppModule {}
```

---

## 四、测试验证

### 4.1 单元测试

```bash
# 1. 运行库的单元测试
cd /home/arligle/oks/oksai.cc
pnpm nx test @oksai/better-auth-mikro-orm

# 预期：所有测试通过
```

### 4.2 集成测试

```typescript
// libs/auth/better-auth/src/better-auth.integration.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MikroORM } from '@mikro-orm/core';
import { mikroOrmAdapter } from '@oksai/better-auth-mikro-orm';
import { betterAuth } from 'better-auth';
import { User, Session } from '@oksai/database';

describe('Better Auth + MikroORM Integration', () => {
  let orm: MikroORM;
  let auth: any;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'postgresql',
      dbName: 'test_better_auth',
      entities: [User, Session],
    });

    const generator = orm.getSchemaGenerator();
    await generator.createSchema();

    auth = betterAuth({
      database: mikroOrmAdapter(orm, {
        debugLogs: true,
      }),
      secret: 'test-secret-key-at-least-32-characters-long',
      baseURL: 'http://localhost:3000',
    });
  });

  afterAll(async () => {
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema();
    await orm.close();
  });

  it('应该创建用户', async () => {
    const user = await auth.api.signUpEmail({
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('应该登录用户', async () => {
    const result = await auth.api.signInEmail({
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### 4.3 E2E 测试

```typescript
// apps/gateway/src/auth/auth.controller.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Auth Controller (e2e)', () => {
  let app: any;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/sign-up/email', () => {
    it('应该注册新用户', () => {
      return request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('newuser@example.com');
        });
    });
  });

  describe('POST /api/auth/sign-in/email', () => {
    it('应该登录用户', () => {
      return request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
        });
    });
  });
});
```

---

## 五、迁移检查清单

### 5.1 代码迁移

```
✅ 复制库代码
  [ ] libs/shared/better-auth-mikro-orm/

✅ 更新配置文件
  [ ] package.json
  [ ] tsconfig.json
  [ ] vitest.config.ts

✅ 删除旧配置
  [ ] jest.config.js
  [ ] tsconfig.spec.json

✅ 更新测试文件
  [ ] adapter.spec.ts
  [ ] adapter-utils.spec.ts
  [ ] create-adapter-error.spec.ts

✅ 更新导入路径
  [ ] 所有相对导入使用 .js 扩展名
  [ ] 确保与 ESM 兼容
```

### 5.2 依赖管理

```
✅ 安装依赖
  [ ] pnpm add dset -w
  [ ] cd libs/shared/better-auth-mikro-orm && pnpm install

✅ 确认版本
  [ ] @mikro-orm/core: catalog:
  [ ] better-auth: catalog:
  [ ] vitest: catalog:
  [ ] typescript: catalog:
```

### 5.3 构建与测试

```
✅ 构建
  [ ] pnpm nx build @oksai/better-auth-mikro-orm

✅ 测试
  [ ] pnpm nx test @oksai/better-auth-mikro-orm

✅ 类型检查
  [ ] pnpm nx typecheck @oksai/better-auth-mikro-orm
```

### 5.4 集成验证

```
✅ Entity 定义
  [ ] User Entity
  [ ] Session Entity
  [ ] Account Entity (可选)

✅ Better Auth 配置
  [ ] mikroOrmAdapter 集成
  [ ] NestJS Module 集成

✅ 功能测试
  [ ] 用户注册
  [ ] 用户登录
  [ ] Session 管理
```

---

## 六、风险与缓解

### 6.1 潜在风险

| 风险 | 概率 | 影响 | 缓解措施 |
|:---|:---:|:---:|:---|
| **依赖版本冲突** | 🟢 低 | 🟡 中 | 统一使用 catalog: |
| **测试迁移失败** | 🟡 中 | 🟡 中 | 使用 Vitest 兼容 API |
| **Entity 定义不匹配** | 🟡 中 | 🟡 中 | 参考 Better Auth Schema |
| **导入路径错误** | 🟢 低 | 🟢 低 | 使用 .js 扩展名 |

### 6.2 回滚策略

```bash
# 如果迁移失败，立即回滚
cd /home/arligle/oks/oksai.cc
rm -rf libs/shared/better-auth-mikro-orm
git checkout libs/shared/better-auth-mikro-orm  # 如果已提交

# 回滚成本：< 5 分钟
```

---

## 七、时间表

### 7.1 详细时间安排

```
09:00 - 09:15 (15 分钟)
  ├── 检查源库状态
  └── 检查目标项目结构

09:15 - 09:25 (10 分钟)
  └── 复制库代码

09:25 - 09:45 (20 分钟)
  ├── 更新 package.json
  ├── 更新 TypeScript 配置
  ├── 删除 Jest 配置
  └── 更新测试文件

09:45 - 09:50 (5 分钟)
  └── 安装依赖

09:50 - 10:00 (10 分钟)
  ├── 构建测试
  └── 运行测试

10:00 - 12:00 (2 小时)
  ├── 配置 MikroORM
  ├── 创建 Entity
  ├── 配置 Better Auth
  └── 集成到 AppModule

12:00 - 13:00 (1 小时)
  └── 午餐休息

13:00 - 15:00 (2 小时)
  ├── 编写集成测试
  └── 编写 E2E 测试

15:00 - 16:00 (1 小时)
  └── 测试验证与调试

16:00 - 17:00 (1 小时)
  ├── 更新文档
  └── Code Review
```

**总计：1 天（8 小时）**

---

## 八、成功标准

### 8.1 技术标准

```
✅ 构建成功
  [ ] pnpm nx build @oksai/better-auth-mikro-orm 无错误

✅ 测试通过
  [ ] 单元测试：100% 通过
  [ ] 集成测试：100% 通过
  [ ] E2E 测试：100% 通过

✅ 类型安全
  [ ] pnpm nx typecheck 无错误

✅ 集成成功
  [ ] gateway 可启动
  [ ] Better Auth 路由可访问
  [ ] 用户注册/登录正常
```

### 8.2 功能标准

```
✅ 用户认证
  [ ] POST /api/auth/sign-up/email 正常
  [ ] POST /api/auth/sign-in/email 正常
  [ ] POST /api/auth/sign-out 正常

✅ Session 管理
  [ ] Session 正确创建
  [ ] Session 正确验证
  [ ] Session 正确删除

✅ 事件管理
  [ ] 用户创建时生成事件
  [ ] 事件正确持久化
```

---

## 九、后续计划

### 9.1 短期优化 (1-2 周)

```
1. 完善 Entity 定义
   ├── User Entity 优化
   ├── Session Entity 优化
   └── 其他 Better Auth Entity

2. 增强测试覆盖
   ├── 增加边界测试
   ├── 增加错误场景测试
   └── 性能测试

3. 文档完善
   ├── README.md
   ├── API 文档
   └── 集成指南
```

### 9.2 长期优化 (1-2 月)

```
1. 功能增强
   ├── 支持缓存
   ├── 支持事务
   └── 支持批量操作

2. 性能优化
   ├── 查询优化
   ├── 序列化优化
   └── 缓存策略

3. 社区贡献
   ├── 发布为独立包
   ├── 编写最佳实践
   └── 分享经验
```

---

## 十、总结

### 10.1 迁移价值

```
✅ 节省时间
  - 迁移成本：1 天
  - 节省开发：> 1 周
  - 净收益：> 4 天

✅ 代码质量
  - 复用已验证代码
  - 减少 Bug 风险
  - 长期维护成本低

✅ 技术债务
  - 统一 ORM 方案
  - 简化代码结构
  - 提高开发效率
```

### 10.2 关键成功因素

```
✅ 准备充分
  - 源库质量高
  - 目标结构清晰
  - 依赖版本统一

✅ 执行细致
  - 逐步验证
  - 充分测试
  - 及时记录

✅ 文档完善
  - 迁移文档
  - 使用文档
  - 测试文档
```

---

## 附录

### A. 文件清单

```
迁移文件：
  libs/shared/better-auth-mikro-orm/
  ├── src/
  │   ├── adapter.ts
  │   ├── index.ts
  │   ├── utils/
  │   │   ├── adapterUtils.ts
  │   │   └── createAdapterError.ts
  │   └── spec/
  │       ├── adapter.spec.ts
  │       └── utils/
  ├── package.json
  ├── tsconfig.json
  └── vitest.config.ts

新增文件：
  libs/database/src/entities/
  ├── user.entity.ts
  ├── session.entity.ts
  └── account.entity.ts

  libs/auth/better-auth/src/
  ├── better-auth.config.ts
  └── better-auth.integration.spec.ts
```

### B. 命令速查

```bash
# 迁移命令
cp -r /home/arligle/oks/oksai-data-plateform/libs/shared/better-auth-mikro-orm \
      /home/arligle/oks/oksai.cc/libs/shared/

# 安装依赖
cd /home/arligle/oks/oksai.cc
pnpm add dset -w

# 构建
pnpm nx build @oksai/better-auth-mikro-orm

# 测试
pnpm nx test @oksai/better-auth-mikro-orm

# 类型检查
pnpm nx typecheck @oksai/better-auth-mikro-orm
```

### C. 故障排除

```
问题 1：依赖版本冲突
解决：使用 catalog: 统一版本

问题 2：测试失败
解决：检查 Vitest 配置，确保 Mock 正确

问题 3：Entity 找不到
解决：检查 MikroORM 配置，确保 entities 路径正确

问题 4：导入路径错误
解决：使用 .js 扩展名，确保 ESM 兼容
```

---

**文档版本**: 1.0  
**创建日期**: 2026-03-04  
**最后更新**: 2026-03-04  
**负责人**: Team Lead  
**预计完成**: 2026-03-04
