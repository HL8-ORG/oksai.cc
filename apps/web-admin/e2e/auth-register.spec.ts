import { expect, test } from "@playwright/test";

/**
 * 认证注册流程 E2E 测试
 *
 * @description
 * 测试用户注册流程的关键场景
 */

test.describe("认证注册流程", () => {
  test.beforeEach(async ({ page }) => {
    // 访问注册页面
    await page.goto("/register");
  });

  test("应该显示注册页面", async ({ page }) => {
    // 验证页面标题
    await expect(page.locator("h1, h2")).toContainText("注册");

    // 验证表单字段存在
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("应该验证所有必填字段", async ({ page }) => {
    // 点击注册按钮（不填写任何信息）
    await page.click('button[type="submit"]');

    // 应该显示必填字段错误
    await expect(page.locator("text=/姓名不能为空/")).toBeVisible();
    await expect(page.locator("text=/邮箱不能为空/")).toBeVisible();
    await expect(page.locator("text=/密码不能为空/")).toBeVisible();
  });

  test("应该验证邮箱格式", async ({ page }) => {
    // 输入无效邮箱
    await page.fill('input[name="email"]', "invalid-email");
    await page.click('button[type="submit"]');

    // 应该显示邮箱格式错误
    await expect(page.locator("text=/邮箱格式不正确/")).toBeVisible();
  });

  test("应该验证密码强度", async ({ page }) => {
    // 输入弱密码
    await page.fill('input[name="password"]', "weak");
    await page.click('button[type="submit"]');

    // 应该显示密码强度错误
    await expect(page.locator("text=/密码至少/")).toBeVisible();
  });

  test("应该验证密码确认匹配", async ({ page }) => {
    // 填写不匹配的密码
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "DifferentPassword123");

    await page.click('button[type="submit"]');

    // 应该显示密码不匹配错误
    await expect(page.locator("text=/密码不匹配/")).toBeVisible();
  });

  test("成功注册应该显示验证提示", async ({ page }) => {
    // 填写有效的注册信息
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    // 点击注册按钮
    await page.click('button[type="submit"]');

    // 等待成功提示
    await expect(page.locator("text=/验证邮件|查收验证邮件/")).toBeVisible({
      timeout: 10000,
    });
  });

  test("邮箱已注册应该显示错误", async ({ page }) => {
    // 使用已注册的邮箱
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "existing@example.com");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");

    // 点击注册按钮
    await page.click('button[type="submit"]');

    // 等待错误提示
    await expect(page.locator("text=/邮箱已被注册|邮箱已存在/")).toBeVisible({
      timeout: 5000,
    });
  });

  test("应该显示登录链接", async ({ page }) => {
    // 验证登录链接
    const loginLink = page.locator("a").filter({ hasText: "登录" });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("应该禁用提交按钮当表单无效时", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // 空表单时按钮应该被禁用
    await expect(submitButton).toBeDisabled();

    // 只填写部分信息
    await page.fill('input[name="name"]', "Test");
    await expect(submitButton).toBeDisabled();

    // 填写完整信息
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "Password123");
    await page.fill('input[name="confirmPassword"]', "Password123");
    await expect(submitButton).toBeEnabled();
  });
});

test.describe("邮箱验证流程", () => {
  test("访问有效验证链接应该成功验证", async ({ page }) => {
    // 访问验证链接（带有效的 token）
    await page.goto("/verify-email?token=valid-token");

    // 应该显示验证成功消息
    await expect(page.locator("text=/验证成功|邮箱已验证/")).toBeVisible({
      timeout: 5000,
    });

    // 应该自动跳转到登录页或仪表盘
    await page.waitForURL("**/login", { timeout: 10000 });
  });

  test("访问无效验证链接应该显示错误", async ({ page }) => {
    // 访问验证链接（带无效的 token）
    await page.goto("/verify-email?token=invalid-token");

    // 应该显示验证失败消息
    await expect(page.locator("text=/验证失败|链接已过期/")).toBeVisible({
      timeout: 5000,
    });
  });

  test("访问过期验证链接应该显示错误", async ({ page }) => {
    // 访问验证链接（带过期的 token）
    await page.goto("/verify-email?token=expired-token");

    // 应该显示链接过期消息
    await expect(page.locator("text=/链接已过期/")).toBeVisible({
      timeout: 5000,
    });

    // 应该显示重新发送验证邮件的按钮
    await expect(page.locator('button:has-text("重新发送")')).toBeVisible();
  });
});
