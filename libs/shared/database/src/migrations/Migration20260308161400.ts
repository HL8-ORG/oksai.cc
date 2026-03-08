/**
 * 多租户迁移 - Organization 关联 Tenant
 *
 * 为 organization 表添加 tenant_id 字段
 */

import { Migration } from "@mikro-orm/migrations";

export class Migration20260308161400 extends Migration {
  override async up(): Promise<void> {
    const knex = this.getKnex();

    // 1. 为 organization 表添加 tenant_id 字段（如果不存在）
    await knex.raw(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'organization' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE "organization" ADD COLUMN tenant_id VARCHAR(36);
        END IF;
      END $$;
    `);

    // 2. 创建索引（如果不存在）
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'organization' AND indexname = 'idx_organization_tenant_id'
        ) THEN
          CREATE INDEX idx_organization_tenant_id ON "organization"(tenant_id);
        END IF;
      END $$;
    `);

    console.log("✅ Migration completed: Added tenant_id to organization table");
  }

  override async down(): Promise<void> {
    const knex = this.getKnex();

    // 1. 删除索引
    await knex.raw(`
      DROP INDEX IF EXISTS idx_organization_tenant_id;
    `);

    // 2. 删除字段
    await knex.raw(`
      ALTER TABLE "organization" DROP COLUMN IF EXISTS tenant_id;
    `);

    console.log("✅ Migration rolled back: Removed tenant_id from organization table");
  }
}
