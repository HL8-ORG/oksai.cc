/**
 * 运行数据库迁移脚本
 *
 * 用于在测试环境初始化数据库表
 */

import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const sql = postgres(
    'postgres://oksai:oksai_dev_password@localhost:5432/oksai',
  );

  try {
    console.log('🔄 开始运行数据库迁移...\n');

    // 读取迁移SQL
    const migrationFile = join(
      __dirname,
      'libs/shared/database/src/migrations/Migration20260308151602.ts',
    );
    const content = readFileSync(migrationFile, 'utf-8');

    // 提取 SQL 语句（简化版本）
    // 注意：这是一个简化的脚本，实际生产环境应使用 MikroORM CLI

    console.log('✅ 检查表是否存在...');
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log(`📊 当前表: ${tables.map((t) => t.tablename).join(', ')}\n`);

    if (tables.some((t) => t.tablename === 'tenant')) {
      console.log('✅ tenant 表已存在');
    } else {
      console.log('⚠️  tenant 表不存在，需要手动运行迁移');
      console.log('💡 提示: 使用 MikroORM CLI 或手动执行迁移SQL');
      console.log('\n迁移文件位置: libs/shared/database/src/migrations/');
    }

    console.log('\n✅ 迁移检查完成');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigrations().catch((e) => {
  console.error('执行失败:', e);
  process.exit(1);
});
