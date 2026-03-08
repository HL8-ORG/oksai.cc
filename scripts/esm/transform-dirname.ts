/**
 * ESM 迁移：转换 __dirname 和 __filename
 *
 * 用法：pnpm tsx scripts/esm/transform-dirname.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';

async function main() {
  const files = globSync(['apps/**/*.ts', 'libs/**/*.ts'], {
    ignore: ['**/node_modules/**', 'dist/**', '**/*.d.ts'],
  });

  let modifiedCount = 0;

  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    const original = content;

    // 检查是否使用 __dirname 或 __filename
    if (!content.includes('__dirname') && !content.includes('__filename')) {
      continue;
    }

    // 添加 ESM 兼容的导入（如果尚未存在）
    const imports = [];
    if (!content.includes('fileURLToPath')) {
      imports.push("import { fileURLToPath } from 'node:url';");
    }
    if (!content.includes('dirname') && content.includes('__dirname')) {
      imports.push("import { dirname } from 'node:path';");
    }
    if (!content.includes('filename') && content.includes('__filename')) {
      imports.push("import { filename } from 'node:path';");
    }

    if (imports.length > 0) {
      // 在文件开头插入导入
      const firstImport = content.match(/^import/m);
      if (firstImport && firstImport.index !== undefined) {
        const insertPos = firstImport.index;
        content =
          content.slice(0, insertPos) +
          imports.join('\n') +
          '\n' +
          content.slice(insertPos);
      }
    }

    // 添加 __dirname 定义（如果不存在）
    if (content.includes('__dirname') && !content.includes('const __dirname')) {
      const dirnameDef = `
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`;
      // 在第一个导入后插入
      const lastImportIndex = content.lastIndexOf('import');
      const nextLineIndex = content.indexOf('\n', lastImportIndex);
      content =
        content.slice(0, nextLineIndex + 1) +
        dirnameDef +
        content.slice(nextLineIndex + 1);
    }

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
