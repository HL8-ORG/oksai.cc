#!/usr/bin/env node

/**
 * Gateway 启动验证脚本
 *
 * @description
 * 验证 apps/gateway 配置和依赖项，无需数据库连接
 *
 * 使用方法：
 * node scripts/verify-gateway-startup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
};

const ICONS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  ROCKET: '🚀',
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    log(`${ICONS.SUCCESS} ${description}: ${filePath}`, COLORS.GREEN);
    return true;
  } else {
    log(`${ICONS.ERROR} ${description} 不存在: ${filePath}`, COLORS.RED);
    return false;
  }
}

function checkPackageJson() {
  log('\n📦 检查 package.json 配置', COLORS.BLUE);
  log('━'.repeat(80));

  const packageJsonPath = path.join(
    __dirname,
    '..',
    'apps',
    'gateway',
    'package.json'
  );

  if (!fs.existsSync(packageJsonPath)) {
    log(`${ICONS.ERROR} package.json 不存在`, COLORS.RED);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // 检查必需的依赖
  const requiredDeps = [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    'better-auth',
    'drizzle-orm',
    '@oksai/nestjs-better-auth',
    '@oksai/database',
  ];

  let allDepsOk = true;

  requiredDeps.forEach((dep) => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      log(`${ICONS.SUCCESS} 依赖 ${dep} 已配置`, COLORS.GREEN);
    } else {
      log(`${ICONS.ERROR} 缺少依赖: ${dep}`, COLORS.RED);
      allDepsOk = false;
    }
  });

  return allDepsOk;
}

function checkTypeScriptConfig() {
  log('\n⚙️  检查 TypeScript 配置', COLORS.BLUE);
  log('━'.repeat(80));

  const checks = [
    { path: 'apps/gateway/tsconfig.json', desc: 'TypeScript 配置' },
    { path: 'apps/gateway/tsconfig.app.json', desc: '应用配置' },
  ];

  return checks.every((check) => checkFileExists(check.path, check.desc));
}

function checkAuthConfig() {
  log('\n🔐 检查 Better Auth 配置', COLORS.BLUE);
  log('━'.repeat(80));

  const checks = [
    { path: 'apps/gateway/src/auth/auth.config.ts', desc: 'Auth 配置文件' },
    { path: 'apps/gateway/src/auth/auth.ts', desc: 'Auth 实例文件' },
  ];

  const filesExist = checks.every((check) =>
    checkFileExists(check.path, check.desc)
  );

  if (!filesExist) return false;

  // 检查配置内容
  const configPath = path.join(
    __dirname,
    '..',
    'apps',
    'gateway',
    'src',
    'auth',
    'auth.config.ts'
  );
  const configContent = fs.readFileSync(configPath, 'utf-8');

  let configOk = true;

  // 检查是否使用了正确的导入
  if (configContent.includes("from 'better-auth/adapters/drizzle'")) {
    log(`${ICONS.SUCCESS} Drizzle 适配器导入路径正确`, COLORS.GREEN);
  } else {
    log(`${ICONS.WARNING} Drizzle 适配器导入路径可能不正确`, COLORS.YELLOW);
  }

  // 检查是否配置了数据库
  if (configContent.includes('database:')) {
    log(`${ICONS.SUCCESS} 已配置数据库适配器`, COLORS.GREEN);
  } else {
    log(`${ICONS.ERROR} 未配置数据库适配器`, COLORS.RED);
    configOk = false;
  }

  // 检查是否配置了会话管理
  if (configContent.includes('session:')) {
    log(`${ICONS.SUCCESS} 已配置会话管理`, COLORS.GREEN);
  } else {
    log(`${ICONS.WARNING} 未配置会话管理`, COLORS.YELLOW);
  }

  return configOk;
}

function checkModuleConfig() {
  log('\n📦 检查 NestJS 模块配置', COLORS.BLUE);
  log('━'.repeat(80));

  const checks = [
    { path: 'apps/gateway/src/app.module.ts', desc: 'App 模块' },
    { path: 'apps/gateway/src/main.ts', desc: '启动文件' },
  ];

  const filesExist = checks.every((check) =>
    checkFileExists(check.path, check.desc)
  );

  if (!filesExist) return false;

  // 检查 app.module.ts
  const modulePath = path.join(
    __dirname,
    '..',
    'apps',
    'gateway',
    'src',
    'app.module.ts'
  );
  const moduleContent = fs.readFileSync(modulePath, 'utf-8');

  let moduleOk = true;

  if (moduleContent.includes('AuthModule')) {
    log(`${ICONS.SUCCESS} 已导入 AuthModule`, COLORS.GREEN);
  } else {
    log(`${ICONS.ERROR} 未导入 AuthModule`, COLORS.RED);
    moduleOk = false;
  }

  // 检查 main.ts
  const mainPath = path.join(
    __dirname,
    '..',
    'apps',
    'gateway',
    'src',
    'main.ts'
  );
  const mainContent = fs.readFileSync(mainPath, 'utf-8');

  if (mainContent.includes('bodyParser: false')) {
    log(
      `${ICONS.SUCCESS} main.ts 已禁用 body parser（Better Auth 需要）`,
      COLORS.GREEN
    );
  } else {
    log(`${ICONS.ERROR} main.ts 未禁用 body parser`, COLORS.RED);
    moduleOk = false;
  }

  return moduleOk;
}

function checkEnvironmentVariables() {
  log('\n🔑 检查环境变量', COLORS.BLUE);
  log('━'.repeat(80));

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (!fs.existsSync(envPath)) {
    log(
      `${ICONS.WARNING} .env 文件不存在，请从 .env.example 复制`,
      COLORS.YELLOW
    );
    log(`${ICONS.INFO} 运行: cp .env.example .env`, COLORS.CYAN);
    return false;
  }

  log(`${ICONS.SUCCESS} .env 文件存在`, COLORS.GREEN);

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
  ];

  let allVarsOk = true;

  requiredVars.forEach((varName) => {
    if (envContent.includes(`${varName}=`)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1].trim()) {
        log(`${ICONS.SUCCESS} ${varName} 已设置`, COLORS.GREEN);
      } else {
        log(`${ICONS.WARNING} ${varName} 已定义但为空`, COLORS.YELLOW);
      }
    } else {
      log(`${ICONS.ERROR} ${varName} 未设置`, COLORS.RED);
      allVarsOk = false;
    }
  });

  return allVarsOk;
}

function checkDatabaseSchema() {
  log('\n🗄️  检查数据库 Schema', COLORS.BLUE);
  log('━'.repeat(80));

  const checks = [
    { path: 'libs/database/src/schema/index.ts', desc: '数据库 Schema' },
    { path: 'libs/database/src/index.ts', desc: '数据库导出' },
  ];

  const filesExist = checks.every((check) =>
    checkFileExists(check.path, check.desc)
  );

  if (!filesExist) return false;

  // 检查 schema 内容
  const schemaPath = path.join(
    __dirname,
    '..',
    'libs',
    'database',
    'src',
    'schema',
    'index.ts'
  );
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  const requiredTables = ['users', 'sessions', 'accounts'];
  let schemaOk = true;

  requiredTables.forEach((table) => {
    if (schemaContent.includes(`export const ${table}`)) {
      log(`${ICONS.SUCCESS} Schema 包含 ${table} 表`, COLORS.GREEN);
    } else {
      log(`${ICONS.ERROR} Schema 缺少 ${table} 表`, COLORS.RED);
      schemaOk = false;
    }
  });

  return schemaOk;
}

function checkPublicFiles() {
  log('\n🎨 检查静态文件', COLORS.BLUE);
  log('━'.repeat(80));

  const checks = [{ path: 'apps/gateway/public/login.html', desc: '登录页面' }];

  return checks.every((check) => checkFileExists(check.path, check.desc));
}

function checkNodeModules() {
  log('\n📦 检查 node_modules', COLORS.BLUE);
  log('━'.repeat(80));

  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    log(`${ICONS.ERROR} node_modules 不存在`, COLORS.RED);
    log(`${ICONS.INFO} 请运行: pnpm install`, COLORS.CYAN);
    return false;
  }

  log(`${ICONS.SUCCESS} node_modules 存在`, COLORS.GREEN);

  // 检查关键依赖
  const criticalDeps = ['@nestjs/core', 'better-auth', 'drizzle-orm'];

  let allDepsOk = true;

  criticalDeps.forEach((dep) => {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      log(`${ICONS.SUCCESS} ${dep} 已安装`, COLORS.GREEN);
    } else {
      log(`${ICONS.ERROR} ${dep} 未安装`, COLORS.RED);
      allDepsOk = false;
    }
  });

  return allDepsOk;
}

function generateStartupGuide(results) {
  log('\n' + '='.repeat(80), COLORS.BLUE);
  log('📋 启动验证报告', COLORS.BLUE);
  log('='.repeat(80));

  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.passed).length;
  const failedChecks = totalChecks - passedChecks;

  log(`\n总检查项: ${totalChecks}`, COLORS.BLUE);
  log(`通过: ${passedChecks}`, COLORS.GREEN);
  log(`失败: ${failedChecks}`, failedChecks > 0 ? COLORS.RED : COLORS.GREEN);

  if (failedChecks === 0) {
    log('\n🎉 所有检查通过！准备启动', COLORS.GREEN);
    log('\n' + `${ICONS.ROCKET} 启动步骤：`, COLORS.CYAN);
    log('');
    log('  1️⃣  启动数据库：');
    log(
      '      docker-compose -f docker/docker-compose.yml up -d postgres redis',
      COLORS.CYAN
    );
    log('');
    log('  2️⃣  初始化数据库：');
    log('      pnpm db:push', COLORS.CYAN);
    log('');
    log('  3️⃣  启动应用：');
    log('      pnpm dev', COLORS.CYAN);
    log('');
    log('  4️⃣  访问应用：');
    log('      • API: http://localhost:3000/api', COLORS.CYAN);
    log('      • 登录页: http://localhost:3000/login.html', COLORS.CYAN);
    log('      • 健康检查: http://localhost:3000/api/health', COLORS.CYAN);
    log('');
    log('  5️⃣  测试认证：');
    log('      pnpm test:auth', COLORS.CYAN);
    log('');
  } else {
    log('\n⚠️  部分检查未通过，请先修复上述问题', COLORS.YELLOW);
    log('\n📖 常见问题解决方案：');
    log('');
    log('  • node_modules 不存在: pnpm install', COLORS.CYAN);
    log('  • .env 不存在: cp .env.example .env', COLORS.CYAN);
    log('  • 数据库未启动: pnpm docker:up', COLORS.CYAN);
    log('');
  }
}

// 运行所有检查
const results = [
  { name: 'Package.json 配置', passed: checkPackageJson() },
  { name: 'TypeScript 配置', passed: checkTypeScriptConfig() },
  { name: 'Better Auth 配置', passed: checkAuthConfig() },
  { name: 'NestJS 模块配置', passed: checkModuleConfig() },
  { name: '环境变量', passed: checkEnvironmentVariables() },
  { name: '数据库 Schema', passed: checkDatabaseSchema() },
  { name: '静态文件', passed: checkPublicFiles() },
  { name: '依赖安装', passed: checkNodeModules() },
];

generateStartupGuide(results);
