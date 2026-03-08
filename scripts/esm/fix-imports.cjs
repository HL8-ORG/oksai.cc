#!/usr/bin/env node

const {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} = require('node:fs');
const { join } = require('node:path');

function fixImportsInDir(dir) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      fixImportsInDir(fullPath);
    } else if (entry.endsWith('.ts')) {
      let content = readFileSync(fullPath, 'utf-8');

      // 替换相对路径 import（正确处理引号）
      content = content.replace(
        /from\s+(['"])(\.\.?\/[^'"]+)\1/g,
        (match, quote, path) => {
          if (path.endsWith('.js')) return match;
          return `from ${quote}${path}.js${quote}`;
        },
      );

      writeFileSync(fullPath, content, 'utf-8');
    }
  }
}

// Fix contracts
if (require('fs').existsSync('libs/shared/contracts/src')) {
  fixImportsInDir('libs/shared/contracts/src');
  console.log('✅ Fixed libs/shared/contracts');
}

// Fix eda
if (require('fs').existsSync('libs/shared/eda/src')) {
  fixImportsInDir('libs/shared/eda/src');
  console.log('✅ Fixed libs/shared/eda');
}

// Fix event-store
if (require('fs').existsSync('libs/shared/event-store/src')) {
  fixImportsInDir('libs/shared/event-store/src');
  console.log('✅ Fixed libs/shared/event-store');
}
