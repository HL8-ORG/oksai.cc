import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 测试配置
 *
 * @description
 * 配置认证前端功能的 E2E 测试
 * - 测试目录: ./e2e
 * - 基础 URL: http://localhost:3001
 * - 浏览器: Chromium
 */
export default defineConfig({
  // 测试目录
  testDir: "./e2e",

  // 完全并行运行测试
  fullyParallel: true,

  // CI 上失败时禁止 only
  forbidOnly: !!process.env.CI,

  // CI 上重试失败测试
  retries: process.env.CI ? 2 : 0,

  // CI 上限制并行工作者
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: "http://localhost:3001",

    // 收集失败测试的 trace
    trace: "on-first-retry",

    // 截图配置
    screenshot: "only-on-failure",

    // 视频录制配置
    video: "on-first-retry",

    // 操作超时时间
    actionTimeout: 10000,

    // 导航超时时间
    navigationTimeout: 30000,
  },

  // 测试项目配置
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // 可选：添加更多浏览器
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    // 可选：移动端测试
    // {
    //   name: "Mobile Chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 12"] },
    // },
  ],

  // 开发服务器配置
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
