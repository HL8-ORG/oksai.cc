/**
 * ESM 迁移：自动添加 .js 后缀到相对导入
 *
 * 用法：pnpm tsx scripts/esm/add-js-extensions.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';

async function main() {
  const files = globSync(['apps/**/*.ts', 'libs/**/*.ts'], {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  });

  let modifiedCount = 0;

  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    const original = content;

    // 匹配相对导入（不含 .js 后缀）
    content = content.replace(
      /(import\s+.*?from\s+['"])(\.[^'"]+)(?<!\.js)(['"])/g,
      '$1$2.js$3',
    );

    // 匹配动态导入
    content = content.replace(
      /(import\(['"])(\.[^'"]+)(?<!\.js)(['"]\))/g,
      '$1$2.js$3',
    );

    if (content !== original) {
      writeFileSync(file, content, 'utf-8');
      modifiedCount++;
      console.log(`✅ Updated: ${file}`);
    }
  }

  console.log(`\n📊 统计:`);
  console.log(`   扫描文件: ${files.length}`);
  console.log(`   修改文件: ${modifiedCount}`);
}

main().catch(console.error);
