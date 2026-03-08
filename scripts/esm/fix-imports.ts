#!/usr/bin/env tsx
/**
 * ESM Import Path Fixer
 * 正确地为相对路径 import 添加 .js 后缀
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'glob';

const files = await glob('libs/shared/{contracts,eda}/**/*.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf-8');

  // 替换相对路径 import
  content = content.replace(
    /from\s+['"](\.\.?\/[^'"]+)(['"])/g,
    (match, path, quote) => {
      // 如果已经有 .js 后缀，跳过
      if (path.endsWith('.js')) return match;
      // 添加 .js 后缀
      return `from '${path}.js'${quote}`;
    },
  );

  writeFileSync(file, content, 'utf-8');
}

console.log(`✅ Fixed ${files.length} files`);
