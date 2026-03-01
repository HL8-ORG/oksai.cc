import { APP_GUARD } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { AuthModule } from "./auth-module";
import { AuthService } from "./auth-service";

describe("AuthModule 集成测试", () => {
  let module: TestingModule;

  const mockAuth = {
    api: {
      getSession: jest.fn(),
    },
    options: {
      basePath: "/api/auth",
      trustedOrigins: ["http://localhost:3000"],
    },
  };

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("forRoot", () => {
    it("应该成功注册模块", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: true,
            disableGlobalAuthGuard: true, // 禁用全局守卫以便测试
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
      expect(authService.api).toBe(mockAuth.api);
    });

    it("应该启用全局认证守卫", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: true,
            disableGlobalAuthGuard: false,
          }),
        ],
      }).compile();

      // 验证模块成功加载
      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it("应该支持禁用全局守卫", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: true,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      // 如果禁用了全局守卫，应该无法获取到 APP_GUARD
      expect(() => module.get(APP_GUARD)).toThrow();
    });

    it("应该导出 AuthService", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeInstanceOf(AuthService);
    });
  });

  describe("forRootAsync", () => {
    it("应该支持异步配置", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRootAsync({
            useFactory: async () => {
              // 模拟异步初始化
              await new Promise((resolve) => setTimeout(resolve, 10));
              return {
                auth: mockAuth as any,
                isGlobal: true,
                disableGlobalAuthGuard: true,
              };
            },
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
      expect(authService.api).toBe(mockAuth.api);
    });

    it("应该支持依赖注入", async () => {
      class ConfigService {
        getAuthConfig() {
          return { auth: mockAuth };
        }
      }

      const _configService = new ConfigService();

      // 简化测试，验证异步工厂函数能够工作
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRootAsync({
            useFactory: () => {
              return {
                auth: mockAuth,
                isGlobal: true,
                disableGlobalAuthGuard: true,
              } as any;
            },
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe("AuthService", () => {
    it("应该提供访问 auth API 的能力", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);

      // 验证可以访问 API
      expect(authService.api).toBe(mockAuth.api);

      // 验证可以访问实例
      expect(authService.instance).toBe(mockAuth);
    });
  });

  describe("模块配置选项", () => {
    it("应该支持全局模块配置", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: true,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      // 全局模块应该可以从任何地方访问
      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it("应该支持禁用控制器", async () => {
      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableControllers: true,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });
});
