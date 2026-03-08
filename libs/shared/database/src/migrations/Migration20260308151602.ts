import { Migration } from "@mikro-orm/migrations";

/**
 * 多租户支持迁移
 *
 * 此迁移为数据库添加多租户支持：
 * 1. 增强 tenant 表（添加 slug, owner_id, quota 字段）
 * 2. 为 9 个实体添加 tenant_id 列
 * 3. 创建索引以优化查询性能
 */
export class Migration20260308151602 extends Migration {
  override async up(): Promise<void> {
    // ========== 1. 增强 tenant 表 ==========
    this.addSql(`
      -- 添加 slug 字段（唯一标识）
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "slug" VARCHAR(100);
      
      -- 添加 owner_id 字段
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "owner_id" VARCHAR(36);
      
      -- 添加配额字段
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "max_organizations" INTEGER DEFAULT 1;
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "max_members" INTEGER DEFAULT 10;
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "max_storage" BIGINT DEFAULT 1073741824;
      
      -- 添加配置和元数据字段
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';
    `);

    // 创建索引
    this.addSql(`
      -- 为 slug 创建唯一索引
      CREATE UNIQUE INDEX IF NOT EXISTS "tenant_slug_unique" ON "tenant" ("slug");
      
      -- 为 owner_id 创建索引
      CREATE INDEX IF NOT EXISTS "tenant_owner_id_index" ON "tenant" ("owner_id");
      
      -- 为 status 创建索引
      CREATE INDEX IF NOT EXISTS "tenant_status_index" ON "tenant" ("status");
    `);

    // 更新现有数据（为已存在的租户生成 slug）
    this.addSql(`
      UPDATE "tenant" 
      SET "slug" = LOWER(REGEXP_REPLACE("name", '\\s+', '-', 'g'))
      WHERE "slug" IS NULL;
    `);

    // ========== 2. 为实体添加 tenant_id ==========
    const entities = [
      "account",
      "api_key",
      "oauth_access_token",
      "oauth_authorization_code",
      "oauth_client",
      "oauth_refresh_token",
      "session",
      "webhook",
      "webhook_delivery",
    ];

    for (const entity of entities) {
      const tableName = entity;
      const indexName = `${tableName}_tenant_id_index`;

      // 添加 tenant_id 列
      this.addSql(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN IF NOT EXISTS "tenant_id" VARCHAR(36);
      `);

      // 创建索引
      this.addSql(`
        CREATE INDEX IF NOT EXISTS "${indexName}" 
        ON "${tableName}" ("tenant_id");
      `);
    }

    // ========== 3. 特殊处理：domain_event 已有 tenant_id，只需添加索引 ==========
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "domain_event_tenant_id_index" 
      ON "domain_event" ("tenant_id");
    `);

    // ========== 4. 为 user 表添加 tenant_id 索引（如果不存在）==========
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "user_tenant_id_index" 
      ON "user" ("tenant_id");
    `);
  }

  override async down(): Promise<void> {
    // ========== 1. 移除 tenant 表的新字段 ==========
    this.addSql(`
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "slug";
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "owner_id";
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "max_organizations";
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "max_members";
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "max_storage";
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "settings";
      ALTER TABLE "tenant" DROP COLUMN IF EXISTS "metadata";
    `);

    // 删除 tenant 表的索引
    this.addSql(`
      DROP INDEX IF EXISTS "tenant_slug_unique";
      DROP INDEX IF EXISTS "tenant_owner_id_index";
      DROP INDEX IF EXISTS "tenant_status_index";
    `);

    // ========== 2. 移除实体的 tenant_id 列 ==========
    const entities = [
      "account",
      "api_key",
      "oauth_access_token",
      "oauth_authorization_code",
      "oauth_client",
      "oauth_refresh_token",
      "session",
      "webhook",
      "webhook_delivery",
    ];

    for (const entity of entities) {
      const tableName = entity;
      const indexName = `${tableName}_tenant_id_index`;

      // 删除索引
      this.addSql(`DROP INDEX IF EXISTS "${indexName}";`);

      // 删除列
      this.addSql(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "tenant_id";`);
    }

    // 删除其他索引
    this.addSql(`
      DROP INDEX IF EXISTS "domain_event_tenant_id_index";
      DROP INDEX IF EXISTS "user_tenant_id_index";
    `);
  }
}
