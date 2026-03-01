import { AuthService } from "./auth-service";

describe("AuthService", () => {
  let service: AuthService;
  let mockAuth: any;
  let mockOptions: any;

  beforeEach(() => {
    // 创建 Better Auth 实例的 mock
    mockAuth = {
      api: {
        getSession: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
      },
      options: {
        basePath: "/api/auth",
      },
    };

    mockOptions = {
      auth: mockAuth,
    };

    service = new AuthService(mockOptions);
  });

  describe("api", () => {
    it("应该返回 auth 实例的 API", () => {
      expect(service.api).toBe(mockAuth.api);
    });

    it("应该允许通过 API 访问 getSession", () => {
      const getSession = service.api.getSession;
      expect(getSession).toBeDefined();
    });
  });

  describe("instance", () => {
    it("应该返回完整的 auth 实例", () => {
      expect(service.instance).toBe(mockAuth);
    });

    it("应该允许访问 auth 实例的选项", () => {
      const instance = service.instance;
      expect(instance.options.basePath).toBe("/api/auth");
    });
  });

  describe("泛型支持", () => {
    it("应该支持泛型类型以扩展 auth 实例", () => {
      // 模拟带有额外 API 的 auth 实例
      const extendedMockAuth = {
        ...mockAuth,
        api: {
          ...mockAuth.api,
          customMethod: jest.fn(),
        },
      };

      const extendedService = new AuthService<{
        api: typeof extendedMockAuth.api;
      }>({
        auth: extendedMockAuth,
      });

      // TypeScript 会识别 customMethod
      expect(extendedService.api.customMethod).toBeDefined();
    });
  });
});
