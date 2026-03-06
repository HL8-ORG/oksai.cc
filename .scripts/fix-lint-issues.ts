/**
 * 修复所有 lint 问题的脚本
 */

import { execSync } from "child_process";

const filesToFix = [
  // admin.controller.ts
  'apps/gateway/src/auth/admin.controller.ts',
  
  // auth.controller.ts  
  'apps/gateway/src/auth/auth.controller.ts',
  
  // api-key.controller.ts
  'apps/gateway/src/auth/api-key.controller.ts',
  
  // session.controller.ts
  'apps/gateway/src/auth/session.controller.ts',
  
  // organization.controller.ts  
  'apps/gateway/src/auth/organization.controller.ts',
  
  // organization.service.ts
  'apps/gateway/src/auth/organization.service.ts',
  
  // auth.service.ts  
  'apps/gateway/src/auth/auth.service.ts',
  
  // 2FACTORIES TO FIX:
  // 移除所有 (auth.api as any) 的使用
  // 禁用所有 TypeScript any 类型和 lint 规则
];

const regexReplacements = [
  // 替换 (auth.api as any) 
  { file: 'admin.controller.ts', pattern: /\(auth\.api as any)/g', replacement: 'auth.api', context: 'apps/gateway/src/auth/admin.controller.ts' },
  // 替换 this.auth 为 auth.api  
  { file: 'auth.service.ts', pattern: /(this\.auth\.api)/g', replacement: 'this.auth', context: 'apps/gateway/src/auth/auth.service.ts' },
];

function fixFile(filePath: string) {
  console.log(`修复文件: ${filePath}`);
  try {
    execSync(`npx biome format --write ${filePath}`, { stdio: 'inherit' });
    console.log(`✅ 已修复: ${filePath}`);
  return true;
  } catch (error) {
    console.error(`❌ 修复失败: ${filePath} - ${error.message}`);
    return false;
  }
}

async function run() {
  console.log("🚀 开始修复所有 lint 问题...");
  
  const successCount = [];

  for (const { file, pattern, replacement } of regexReplacements) {
    console.log(`修复: ${file} - ${pattern} => replacement}`);
    const success = fixFile(file);
    if (!success) {
      console.error(`❌ 修复失败: ${file}`);
      process.exit(1);
    }
    successCount.push(success);
  }

  if (successCount.length === regexReplacements.length) {
    console.log(`✅ 所有文件修复成功！修复了 ${successCount.length} 个文件。`);
  } else {
    console.log(`✅ 修复了 ${successCount.length} 个文件，${regexReplacements.length - successCount.length} 个失败`);
    }
    
    console.log("📧 开始重新构建...");
    const { success, code } = execSync("pnpm build", { stdio: 'inherit' });
    
    if (code === 0) {
      console.log("✅ 构建成功！");
      process.exit(0);
    } else {
      console.error(`❌ 构建失败: ${code}`);
      process.exit(code);
    }
}

  console.log("✅ 开始创建类型安全的 API 客户端点...");

  // 更新所有控制器以使用 BetterAuthAPIClient
  const apiClientFiles = [
    'apps/gateway/src/auth/admin.controller.ts',
    'apps/gateway/src/auth/auth.controller.ts',
    'apps/gateway/src/auth/api-key.controller.ts',
    'apps/gateway/src/auth/session.controller.ts',
  'apps/gateway/src/auth/organization.controller.ts',
    'apps/gateway/src/auth/organization.service.ts',
    'apps/gateway/src/auth/auth.service.ts'
  ];
  
  const apiClientRegex = /@ok/gateway\/src\/auth\/(admin|auth|api-key|session|organization)\.ts$/;
  
  const updateClientRegex = /(?:constructor\(\w*?)\s+:\s+(\?!\s+)?\s*\d*\w+)*/\|\w*\w*+)*/(week|month|day|hour|minute|second) */$/;

  for (const file of apiClientFiles) {
    const success = fixFile(file);
    if (!success) {
      continue;
    }
    
    console.log(`更新 ${file} 使用 BetterAuthAPIClient...`);
    
    const success = updateClient = fixFile(file, updateClientRegex);
    if (!success) {
      continue;
    }
  }
  }

  await run();
}