/**
 * 认证 API 测试脚本
 *
 * @description
 * 测试 Better Auth 集成的各种端点
 *
 * 使用方法：
 * 1. 确保服务已启动：pnpm dev
 * 2. 运行测试：tsx apps/gateway/test-auth.ts
 */

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
      success: response.ok,
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

async function runTests() {
  console.log("🧪 开始测试 Better Auth 集成\n");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const tests: TestResult[] = [];

  // 1. 健康检查（公开）
  console.log("1️⃣  测试健康检查（公开端点）...");
  tests.push(await testEndpoint("Health Check", "GET", "/health"));
  await sleep(500);

  // 2. API 根路由（需要认证）
  console.log("2️⃣  测试 API 根路由（需要认证）...");
  tests.push(await testEndpoint("API Root (No Auth)", "GET", "/"));
  await sleep(500);

  // 3. 用户注册
  console.log("3️⃣  测试用户注册...");
  const timestamp = Date.now();
  tests.push(
    await testEndpoint("User Registration", "POST", "/auth/sign-up/email", {
      email: `test${timestamp}@example.com`,
      password: "Test123456!",
      name: "Test User",
    })
  );
  await sleep(500);

  // 4. 公开路由
  console.log("4️⃣  测试公开路由（@AllowAnonymous）...");
  tests.push(await testEndpoint("Public Route", "GET", "/users/public"));
  await sleep(500);

  // 5. 可选认证路由
  console.log("5️⃣  测试可选认证路由（@OptionalAuth）...");
  tests.push(await testEndpoint("Optional Auth Route", "GET", "/users/optional"));
  await sleep(500);

  // 6. 受保护路由（需要认证）
  console.log("6️⃣  测试受保护路由（需要认证）...");
  tests.push(await testEndpoint("Protected Route (No Auth)", "GET", "/users/me"));

  // 输出结果
  console.log("\n📊 测试结果：\n");
  console.log("━".repeat(80));

  tests.forEach((result, index) => {
    const icon = result.success ? "✅" : "❌";
    const status = result.success ? `\x1b[32m${result.status}\x1b[0m` : `\x1b[31m${result.status}\x1b[0m`;

    console.log(`${icon} ${index + 1}. ${result.name}`);
    console.log(`   ${result.method} ${result.url}`);
    console.log(`   Status: ${status}`);

    if (result.data) {
      console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }

    if (result.error) {
      console.log(`   Error: \x1b[31m${result.error}\x1b[0m`);
    }

    console.log("─".repeat(80));
  });

  const successCount = tests.filter((t) => t.success).length;
  const totalTests = tests.length;

  console.log(`\n📈 总结：${successCount}/${totalTests} 测试通过\n`);

  if (successCount === totalTests) {
    console.log("🎉 所有测试通过！\n");
  } else {
    console.log("⚠️  部分测试失败，请检查日志\n");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 运行测试
runTests().catch(console.error);
