#!/usr/bin/env node

/**
 * Better Auth 配置验证脚本
 *
 * @description
 * 检查当前配置是否符合 Better Auth 最佳实践
 *
 * 使用方法：
 * node scripts/check-better-auth-config.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
};

const ICONS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkEnvFile() {
  log('\n📋 检查环境变量文件', COLORS.BLUE);
  log('━'.repeat(80));

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (!fs.existsSync(envPath)) {
    log(`${ICONS.ERROR} .env 文件不存在`, COLORS.RED);
    log(`${ICONS.INFO} 请复制 .env.example 并配置`, COLORS.YELLOW);
    return false;
  }

  log(`${ICONS.SUCCESS} .env 文件存在`, COLORS.GREEN);

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

  // 检查必需的环境变量
  const requiredVars = [
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'DATABASE_URL',
  ];

  const issues = [];

  requiredVars.forEach((varName) => {
    if (!envContent.includes(`${varName}=`)) {
      issues.push(`${varName} 未设置`);
      log(`${ICONS.ERROR} ${varName} 未设置`, COLORS.RED);
    } else {
      log(`${ICONS.SUCCESS} ${varName} 已设置`, COLORS.GREEN);
    }
  });

  // 检查 BETTER_AUTH_SECRET 长度
  const secretMatch = envContent.match(/BETTER_AUTH_SECRET=(.+)/);
  if (secretMatch) {
    const secret = secretMatch[1].trim();
    if (secret.length < 32) {
      issues.push('BETTER_AUTH_SECRET 长度不足 32 字符');
      log(
        `${ICONS.WARNING} BETTER_AUTH_SECRET 长度不足 32 字符（当前：${secret.length}）`,
        COLORS.YELLOW,
      );
    } else {
      log(
        `${ICONS.SUCCESS} BETTER_AUTH_SECRET 长度符合要求（${secret.length} 字符）`,
        COLORS.GREEN,
      );
    }
  }

  return issues.length === 0;
}

function checkAuthConfig() {
  log('\n⚙️  检查 Better Auth 配置', COLORS.BLUE);
  log('━'.repeat(80));

  const configPath = path.join(
    __dirname,
    '..',
    'apps',
    'gateway',
    'src',
    'auth',
    'auth.config.ts',
  );

  if (!fs.existsSync(configPath)) {
    log(`${ICONS.ERROR} auth.config.ts 文件不存在`, COLORS.RED);
    return false;
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const issues = [];

  // 检查是否显式设置了 secret 或 baseURL
  if (
    configContent.includes('secret:') &&
    !configContent.includes('process.env.BETTER_AUTH_SECRET')
  ) {
    log(
      `${ICONS.WARNING} 配置中显式设置了 secret（应该让 Better Auth 自动读取环境变量）`,
      COLORS.YELLOW,
    );
    issues.push('配置中显式设置了 secret');
  } else {
    log(
      `${ICONS.SUCCESS} 配置中未显式设置 secret（使用环境变量）`,
      COLORS.GREEN,
    );
  }

  if (
    configContent.includes('baseURL:') &&
    !configContent.includes('process.env.BETTER_AUTH_URL')
  ) {
    log(
      `${ICONS.WARNING} 配置中显式设置了 baseURL（应该让 Better Auth 自动读取环境变量）`,
      COLORS.YELLOW,
    );
    issues.push('配置中显式设置了 baseURL');
  } else {
    log(
      `${ICONS.SUCCESS} 配置中未显式设置 baseURL（使用环境变量）`,
      COLORS.GREEN,
    );
  }

  // 检查数据库适配器
  if (configContent.includes('drizzleAdapter')) {
    log(`${ICONS.SUCCESS} 使用 Drizzle ORM 适配器`, COLORS.GREEN);

    // 检查导入路径
    if (configContent.includes("from 'better-auth/adapters/drizzle'")) {
      log(
        `${ICONS.SUCCESS} Drizzle 适配器导入路径正确（支持 tree-shaking）`,
        COLORS.GREEN,
      );
    } else if (configContent.includes("from 'better-auth'")) {
      log(
        `${ICONS.WARNING} Drizzle 适配器导入路径不正确（应从 better-auth/adapters/drizzle 导入）`,
        COLORS.YELLOW,
      );
      issues.push('适配器导入路径不正确');
    }
  }

  // 检查会话配置
  if (configContent.includes('session:')) {
    log(`${ICONS.SUCCESS} 已配置会话管理`, COLORS.GREEN);

    if (configContent.includes('cookieCache:')) {
      log(`${ICONS.SUCCESS} 已启用 Cookie 缓存`, COLORS.GREEN);
    }
  }

  // 检查速率限制
  if (configContent.includes('rateLimit:')) {
    log(`${ICONS.SUCCESS} 已启用速率限制`, COLORS.GREEN);
  } else {
    log(`${ICONS.WARNING} 未启用速率限制`, COLORS.YELLOW);
  }

  return issues.length === 0;
}

function checkOAuthConfig() {
  log('\n🔐 检查 OAuth 配置', COLORS.BLUE);
  log('━'.repeat(80));

  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const oauthProviders = [
    { name: 'GitHub', prefix: 'GITHUB' },
    { name: 'Google', prefix: 'GOOGLE' },
  ];

  let configuredCount = 0;

  oauthProviders.forEach((provider) => {
    const clientId = envContent.match(
      new RegExp(`${provider.prefix}_CLIENT_ID=(.+)`),
    );
    const clientSecret = envContent.match(
      new RegExp(`${provider.prefix}_CLIENT_SECRET=(.+)`),
    );

    if (
      clientId &&
      clientSecret &&
      clientId[1].trim() &&
      clientSecret[1].trim()
    ) {
      log(`${ICONS.SUCCESS} ${provider.name} OAuth 已配置`, COLORS.GREEN);
      configuredCount++;
    } else {
      log(`${ICONS.INFO} ${provider.name} OAuth 未配置（可选）`, COLORS.BLUE);
    }
  });

  return configuredCount > 0;
}

function checkSecurity() {
  log('\n🛡️  检查安全配置', COLORS.BLUE);
  log('━'.repeat(80));

  const configPath = path.join(
    __dirname,
    '..',
    'apps',
    'gateway',
    'src',
    'auth',
    'auth.config.ts',
  );
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const issues = [];

  // 检查 NODE_ENV
  if (envContent.includes('NODE_ENV=production')) {
    if (configContent.includes('useSecureCookies')) {
      log(`${ICONS.SUCCESS} 生产环境已配置安全 Cookies`, COLORS.GREEN);
    } else {
      log(`${ICONS.WARNING} 生产环境未启用 useSecureCookies`, COLORS.YELLOW);
      issues.push('生产环境应启用 useSecureCookies');
    }
  } else {
    log(`${ICONS.INFO} 开发环境（安全配置可选）`, COLORS.BLUE);
  }

  // 检查 trustedOrigins
  if (
    configContent.includes('trustedOrigins:') ||
    envContent.includes('CORS_ORIGIN')
  ) {
    log(`${ICONS.SUCCESS} 已配置 CORS`, COLORS.GREEN);
  } else {
    log(`${ICONS.WARNING} 未配置 CORS`, COLORS.YELLOW);
    issues.push('应配置 trustedOrigins');
  }

  return issues.length === 0;
}

function generateReport(results) {
  log('\n📊 配置检查报告', COLORS.BLUE);
  log('='.repeat(80));

  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.passed).length;
  const failedChecks = totalChecks - passedChecks;

  log(`\n总检查项: ${totalChecks}`, COLORS.BLUE);
  log(`通过: ${passedChecks}`, COLORS.GREEN);
  log(`失败: ${failedChecks}`, failedChecks > 0 ? COLORS.RED : COLORS.GREEN);

  if (failedChecks === 0) {
    log(
      '\n🎉 恭喜！所有检查通过，配置符合 Better Auth 最佳实践！',
      COLORS.GREEN,
    );
    log('\n📚 下一步：', COLORS.BLUE);
    log('  • 配置 OAuth 提供商（可选）: docs/GITHUB_OAUTH_SETUP.md');
    log('  • 添加插件（可选）: docs/BETTER_AUTH_BEST_PRACTICES.md#插件推荐');
    log('  • 测试登录: http://localhost:3000/login.html');
  } else {
    log('\n⚠️  部分配置需要优化', COLORS.YELLOW);
    log('\n📖 请参考最佳实践文档: docs/BETTER_AUTH_BEST_PRACTICES.md');
  }

  log('');
}

// 运行所有检查
const results = [
  { name: '环境变量', passed: checkEnvFile() },
  { name: 'Better Auth 配置', passed: checkAuthConfig() },
  { name: 'OAuth 配置', passed: checkOAuthConfig() },
  { name: '安全配置', passed: checkSecurity() },
];

generateReport(results);
