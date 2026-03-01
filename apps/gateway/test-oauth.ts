/**
 * OAuth 集成测试脚本
 *
 * @description
 * 测试 GitHub 和 Google OAuth 登录流程
 *
 * 使用方法：
 * tsx apps/gateway/test-oauth.ts
 */

import process from "node:process";

const BASE_URL = "http://localhost:3000/api";

interface TestResult {
  name: string;
  method: string;
  url: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
}

async function testEndpoint(
  name: string,
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      name,
      method,
      url: `${BASE_URL}${path}`,
      status: response.status,
      success: response.ok || response.status === 400, // 400 也算成功（缺少 OAuth 配置）
      data,
    };
  } catch (error: any) {
    return {
      name,
      method,
      url: `${BASE_URL}${path}`,
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testOAuthProvider(provider: "github" | "google") {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔐 测试 ${provider.toUpperCase()} OAuth`);
  console.log("=".repeat(80));

  const tests: TestResult[] = [];

  // 1. 测试 OAuth 登录启动
  console.log(`\n1️⃣  测试 ${provider} OAuth 登录启动...`);
  const result = await testEndpoint(`${provider} OAuth Init`, "POST", "/auth/sign-in/social", { provider });

  tests.push(result);

  if (result.success && result.data?.url) {
    console.log(`   ✅ OAuth 流程启动成功`);
    console.log(`   📍 授权 URL: ${result.data.url.substring(0, 100)}...`);
    console.log(`\n   💡 请在浏览器中访问以下 URL 完成 OAuth 授权：`);
    console.log(`   ${result.data.url}`);
  } else if (result.data?.message?.includes("not configured")) {
    console.log(`   ⚠️  ${provider.toUpperCase()} OAuth 未配置`);
    console.log(`   📖 请查看文档配置：docs/${provider.toUpperCase()}_OAUTH_SETUP.md`);
  } else {
    console.log(`   ❌ OAuth 启动失败`);
    console.log(`   错误: ${JSON.stringify(result.data)}`);
  }

  return tests;
}

async function checkOAuthConfiguration() {
  console.log("\n📋 OAuth 配置检查");
  console.log("─".repeat(80));

  const envVars = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };

  const providers = {
    github: !!(envVars.GITHUB_CLIENT_ID && envVars.GITHUB_CLIENT_SECRET),
    google: !!(envVars.GOOGLE_CLIENT_ID && envVars.GOOGLE_CLIENT_SECRET),
  };

  console.log("\n环境变量检查：");
  Object.entries(envVars).forEach(([key, value]) => {
    const icon = value ? "✅" : "❌";
    const masked = value ? `${value.substring(0, 10)}...` : "未设置";
    console.log(`  ${icon} ${key}: ${masked}`);
  });

  console.log("\nOAuth 提供商状态：");
  Object.entries(providers).forEach(([provider, configured]) => {
    const icon = configured ? "✅" : "⚠️";
    const status = configured ? "已配置" : "未配置";
    console.log(`  ${icon} ${provider.toUpperCase()}: ${status}`);
  });

  return providers;
}

async function runOAuthTests() {
  console.log("🧪 Better Auth OAuth 集成测试");
  console.log("━".repeat(80));

  // 检查配置
  const providers = await checkOAuthConfiguration();

  const allTests: TestResult[] = [];

  // 测试已配置的 OAuth 提供商
  if (providers.github) {
    const githubTests = await testOAuthProvider("github");
    allTests.push(...githubTests);
    await sleep(1000);
  }

  if (providers.google) {
    const googleTests = await testOAuthProvider("google");
    allTests.push(...googleTests);
    await sleep(1000);
  }

  // 如果没有配置任何 OAuth，显示帮助信息
  if (!providers.github && !providers.google) {
    console.log("\n⚠️  未检测到 OAuth 配置");
    console.log("─".repeat(80));
    console.log("\n📖 配置指南：");
    console.log("  • GitHub OAuth: docs/GITHUB_OAUTH_SETUP.md");
    console.log("  • Google OAuth: docs/GOOGLE_OAUTH_SETUP.md");
    console.log("\n💡 快速开始：");
    console.log("  1. 选择一个 OAuth 提供商（推荐 GitHub）");
    console.log("  2. 按照文档创建 OAuth 应用");
    console.log("  3. 将 Client ID 和 Secret 添加到 .env 文件");
    console.log("  4. 重启应用：pnpm dev");
    console.log("  5. 再次运行此测试");
    console.log("\n🎨 或者访问登录页面测试：");
    console.log("  http://localhost:3000/login.html");
    return;
  }

  // 输出总结
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 测试总结");
  console.log("=".repeat(80));

  const successCount = allTests.filter((t) => t.success).length;
  const totalTests = allTests.length;

  console.log(`\n✅ 通过: ${successCount}/${totalTests}`);

  if (successCount === totalTests) {
    console.log("\n🎉 OAuth 集成测试完成！");
    console.log("\n🎯 下一步：");
    console.log("  1. 访问登录页面测试完整流程：http://localhost:3000/login.html");
    console.log("  2. 查看数据库中的用户和账号记录");
    console.log("  3. 配置另一个 OAuth 提供商");
  }
}

// 运行测试
runOAuthTests().catch(console.error);
