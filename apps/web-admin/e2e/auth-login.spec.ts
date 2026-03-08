import { expect, test } from "@playwright/test";

/**
 * 认证登录流程 E2E 测试
 *
 * @description
 * 测试用户登录流程的关键场景
 */

test.describe("认证登录流程", () => {
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto("/login");
  });

  test("应该显示登录页面", async ({ page }) => {
    // 验证页面标题
    await expect(page.locator("h1, h2")).toContainText("登录");

    // 验证表单字段存在
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("应该显示 OAuth 登录按钮", async ({ page }) => {
    // 验证 OAuth 按钮存在
    const githubButton = page.locator("button").filter({ hasText: "GitHub" });
    const googleButton = page.locator("button").filter({ hasText: "Google" });

    // 至少有一个 OAuth 按钮
    const oauthButtons = await page.locator('button:has-text("GitHub"), button:has-text("Google")').count();
    expect(oauthButtons).toBeGreaterThan(0);
  });

  test("应该验证邮箱格式", async ({ page }) => {
    // 输入无效邮箱
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password123");

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 应该显示邮箱格式错误
    await expect(page.locator("text=/邮箱格式不正确/")).toBeVisible();
  });

  test("应该验证密码长度", async ({ page }) => {
    // 输入短密码
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "short");

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 应该显示密码长度错误
    await expect(page.locator("text=/密码至少/")).toBeVisible();
  });

  test("应该显示忘记密码链接", async ({ page }) => {
    // 验证忘记密码链接
    const forgotPasswordLink = page.locator("a").filter({ hasText: "忘记密码" });
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
  });

  test("应该显示注册链接", async ({ page }) => {
    // 验证注册链接
    const registerLink = page.locator("a").filter({ hasText: "注册" });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("成功登录后应该跳转到仪表盘", async ({ page }) => {
    // 填写有效的登录信息
    // 注意：这里需要测试环境的测试账号
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 等待跳转到仪表盘
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // 验证 URL
    expect(page.url()).toContain("/dashboard");
  });

  test("登录失败应该显示错误提示", async ({ page }) => {
    // 填写错误的登录信息
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 等待错误提示出现
    await expect(page.locator('[role="alert"], .toast')).toBeVisible({
      timeout: 5000,
    });
  });

  test("应该禁用提交按钮当表单无效时", async ({ page }) => {
    // 表单初始状态
    const submitButton = page.locator('button[type="submit"]');

    // 空表单时按钮应该被禁用
    await expect(submitButton).toBeDisabled();

    // 只填写邮箱
    await page.fill('input[name="email"]', "test@example.com");
    await expect(submitButton).toBeDisabled();

    // 填写完整信息
    await page.fill('input[name="password"]', "password123");
    await expect(submitButton).toBeEnabled();
  });
});

test.describe("OAuth 登录流程", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("点击 GitHub OAuth 应该跳转到授权页面", async ({ page, context }) => {
    // 监听新窗口
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.click('button:has-text("GitHub")'),
    ]);

    // 验证跳转到 GitHub OAuth
    expect(newPage.url()).toContain("github.com");
  });

  test("OAuth 回调应该正确处理", async ({ page }) => {
    // 访问 OAuth 回调页面
    await page.goto("/auth/callback/github");

    // 应该显示加载状态
    await expect(page.locator("text=/登录中|Loading/")).toBeVisible();

    // 等待跳转到仪表盘或显示成功消息
    // 注意：这需要模拟 OAuth 流程
  });
});
