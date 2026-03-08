import { expect, test } from "@playwright/test";

/**
 * 双因素认证（2FA）流程 E2E 测试
 *
 * @description
 * 测试 2FA 设置和验证流程的关键场景
 */

test.describe("2FA 设置流程", () => {
  test.beforeEach(async ({ page }) => {
    // 模拟已登录状态
    // 注意：实际测试需要先登录或使用测试 cookie
    await page.goto("/2fa-setup");
  });

  test("应该显示 2FA 设置页面", async ({ page }) => {
    // 验证页面标题
    await expect(page.locator("h2")).toContainText("双因素认证设置");

    // 应该显示密码验证表单
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("继续")')).toBeVisible();
  });

  test("应该要求输入密码验证", async ({ page }) => {
    // 验证密码步骤提示
    await expect(page.locator("text=/安全验证/")).toBeVisible();
    await expect(page.locator("text=/密码/")).toBeVisible();
  });

  test("输入正确密码应该进入扫码步骤", async ({ page }) => {
    // 输入密码
    await page.fill('input[name="password"]', "correct-password");

    // 点击继续
    await page.click('button:has-text("继续")');

    // 应该显示 QR Code
    await expect(page.locator("img[alt*='QR']")).toBeVisible({ timeout: 5000 });

    // 应该显示手动输入密钥的选项
    await expect(page.locator("text=/手动输入密钥/")).toBeVisible();
  });

  test("输入错误密码应该显示错误", async ({ page }) => {
    // 输入错误密码
    await page.fill('input[name="password"]', "wrong-password");

    // 点击继续
    await page.click('button:has-text("继续")');

    // 应该显示错误消息
    await expect(page.locator('[role="alert"], .error')).toBeVisible({
      timeout: 5000,
    });
  });

  test("应该显示验证码输入框", async ({ page }) => {
    // 先完成密码验证
    await page.fill('input[name="password"]', "correct-password");
    await page.click('button:has-text("继续")');

    // 等待验证码输入框
    await expect(page.locator('input[name="code"]')).toBeVisible({
      timeout: 5000,
    });

    // 验证码输入框应该有最大长度限制
    const codeInput = page.locator('input[name="code"]');
    await expect(codeInput).toHaveAttribute("maxlength", "6");
  });

  test("输入正确验证码应该显示备用码", async ({ page }) => {
    // 完成密码验证
    await page.fill('input[name="password"]', "correct-password");
    await page.click('button:has-text("继续")');

    // 等待验证码输入框
    await page.waitForSelector('input[name="code"]', { timeout: 5000 });

    // 输入验证码
    await page.fill('input[name="code"]', "123456");

    // 点击验证按钮
    await page.click('button:has-text("验证并启用")');

    // 应该显示备用码页面
    await expect(page.locator("text=/备用码/")).toBeVisible({ timeout: 5000 });
  });

  test("备用码页面应该显示下载按钮", async ({ page }) => {
    // 跳转到备用码步骤（模拟）
    // 实际测试需要完成前面的步骤
    await page.goto("/2fa-setup?step=backup");

    // 应该显示备用码
    await expect(page.locator("code")).toHaveCount(10); // 10 个备用码

    // 应该显示下载按钮
    await expect(page.locator('button:has-text("下载备用码")')).toBeVisible();
  });

  test("点击完成应该跳转到仪表盘", async ({ page }) => {
    // 跳转到备用码步骤（模拟）
    await page.goto("/2fa-setup?step=backup");

    // 点击完成按钮
    await page.click('button:has-text("完成")');

    // 应该跳转到仪表盘
    await page.waitForURL("**/dashboard", { timeout: 5000 });
  });
});

test.describe("2FA 验证流程", () => {
  test.beforeEach(async ({ page }) => {
    // 模拟已登录但需要 2FA 验证
    await page.goto("/2fa-verify");
  });

  test("应该显示 2FA 验证页面", async ({ page }) => {
    // 验证页面标题
    await expect(page.locator("h2")).toContainText("双因素认证");

    // 应该显示验证码输入框
    await expect(page.locator('input[name="code"]')).toBeVisible();
  });

  test("应该支持 TOTP 验证码", async ({ page }) => {
    // 输入 6 位验证码
    await page.fill('input[name="code"]', "123456");

    // 点击验证按钮
    await page.click('button:has-text("验证")');

    // 应该跳转到仪表盘
    await page.waitForURL("**/dashboard", { timeout: 5000 });
  });

  test("应该支持备用码验证", async ({ page }) => {
    // 点击"使用备用码"
    await page.click('button:has-text("使用备用码")');

    // 应该显示备用码输入框
    await expect(page.locator('input[placeholder*="备用码"]')).toBeVisible();

    // 输入备用码
    await page.fill('input[name="code"]', "abcd-efgh-ijkl-mnop");

    // 点击验证
    await page.click('button:has-text("验证")');

    // 应该跳转到仪表盘
    await page.waitForURL("**/dashboard", { timeout: 5000 });
  });

  test("输入错误验证码应该显示错误", async ({ page }) => {
    // 输入错误验证码
    await page.fill('input[name="code"]', "000000");

    // 点击验证
    await page.click('button:has-text("验证")');

    // 应该显示错误消息
    await expect(page.locator("text=/验证码错误/")).toBeVisible({
      timeout: 5000,
    });
  });

  test("应该在 TOTP 和备用码之间切换", async ({ page }) => {
    // 初始状态应该显示 TOTP 输入框
    await expect(page.locator('input[maxlength="6"]')).toBeVisible();

    // 切换到备用码
    await page.click('button:has-text("使用备用码")');
    await expect(page.locator('input[placeholder*="备用码"]')).toBeVisible();

    // 切换回 TOTP
    await page.click('button:has-text("使用验证器")');
    await expect(page.locator('input[maxlength="6"]')).toBeVisible();
  });

  test("验证码输入框应该只接受数字", async ({ page }) => {
    const codeInput = page.locator('input[name="code"]');

    // 尝试输入字母
    await codeInput.fill("abc123");

    // 应该只保留数字
    const value = await codeInput.inputValue();
    expect(value).toBe("123");
  });

  test("应该显示返回登录的选项", async ({ page }) => {
    // 应该显示返回登录的链接或按钮
    const backButton = page.locator('button:has-text("返回"), a:has-text("返回登录")');
    await expect(backButton).toBeVisible();
  });
});

test.describe("2FA 集成流程", () => {
  test("登录已启用 2FA 的账号应该要求验证", async ({ page }) => {
    // 访问登录页
    await page.goto("/login");

    // 输入已启用 2FA 的账号
    await page.fill('input[name="email"]', "2fa-user@example.com");
    await page.fill('input[name="password"]', "password123");

    // 点击登录
    await page.click('button[type="submit"]');

    // 应该跳转到 2FA 验证页面
    await page.waitForURL("**/2fa-verify", { timeout: 5000 });

    // 应该显示 2FA 验证界面
    await expect(page.locator("h2")).toContainText("双因素认证");
  });

  test("取消 2FA 验证应该返回登录页", async ({ page }) => {
    // 访问 2FA 验证页
    await page.goto("/2fa-verify");

    // 点击返回按钮
    await page.click('button:has-text("返回"), a:has-text("返回登录")');

    // 应该跳转到登录页
    await page.waitForURL("**/login", { timeout: 5000 });
  });
});
