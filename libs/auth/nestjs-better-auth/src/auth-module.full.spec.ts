import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth-module';
import { AuthService } from './auth-service';
import { Hook, BeforeHook } from './decorators';
import { Injectable, Controller, Get } from '@nestjs/common';
import type { AuthHookContext } from './decorators';

describe('AuthModule 完整测试', () => {
  let module: TestingModule;

  const createFullMockAuth = (options: any = {}) => ({
    api: {
      getSession: jest.fn().mockResolvedValue(null),
      getActiveMemberRole: jest.fn().mockResolvedValue({ role: 'member' }),
    },
    options: {
      basePath: '/api/auth',
      trustedOrigins: ['http://localhost:3000'],
      hooks: {},
      ...options,
    },
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('模块注册', () => {
    it('应该成功注册 forRoot', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
      expect(authService.api).toBe(mockAuth.api);
    });

    it('应该成功注册 forRootAsync', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRootAsync({
            useFactory: () =>
              Promise.resolve({
                auth: mockAuth as any,
                disableGlobalAuthGuard: true,
              }),
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该支持全局模块', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: true,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该支持非全局模块', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: false,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('全局守卫配置', () => {
    it('应该启用全局守卫', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: false,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该禁用全局守卫', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('CORS 配置', () => {
    it('应该配置 CORS（数组形式 trustedOrigins）', async () => {
      const mockAuth = createFullMockAuth({
        trustedOrigins: ['http://localhost:3000', 'https://example.com'],
      });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            disableTrustedOriginsCors: false,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该禁用 CORS', async () => {
      const mockAuth = createFullMockAuth({
        trustedOrigins: ['http://localhost:3000'],
      });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            disableTrustedOriginsCors: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该处理无 trustedOrigins', async () => {
      const mockAuth = createFullMockAuth({
        trustedOrigins: undefined,
      });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('Body Parser 配置', () => {
    it('应该启用 body parser', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            disableBodyParser: false,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该禁用 body parser', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            disableBodyParser: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该启用 raw body parser', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            enableRawBodyParser: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('控制器配置', () => {
    it('应该启用控制器', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            disableControllers: false,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该禁用控制器', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            disableControllers: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('自定义中间件', () => {
    it('应该支持自定义中间件', async () => {
      const mockAuth = createFullMockAuth();
      const customMiddleware = jest.fn((req, res, next) => next());

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
            middleware: customMiddleware as any,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('钩子系统', () => {
    it('应该配置钩子提供者', async () => {
      @Hook()
      @Injectable()
      class TestHookProvider {
        @BeforeHook('/sign-in')
        async handleHook(ctx: AuthHookContext) {
          console.log('Hook executed');
        }
      }

      const mockAuth = createFullMockAuth({ hooks: {} });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
        providers: [TestHookProvider],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该处理无钩子提供者', async () => {
      const mockAuth = createFullMockAuth({ hooks: {} });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('basePath 配置', () => {
    it('应该使用默认 basePath', async () => {
      const mockAuth = createFullMockAuth();

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });

    it('应该使用自定义 basePath', async () => {
      const mockAuth = createFullMockAuth({
        basePath: '/custom/auth',
      });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            disableGlobalAuthGuard: true,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });

  describe('组合选项', () => {
    it('应该支持多个选项组合', async () => {
      const mockAuth = createFullMockAuth({
        trustedOrigins: ['http://localhost:3000'],
        hooks: {},
      });

      module = await Test.createTestingModule({
        imports: [
          AuthModule.forRoot({
            auth: mockAuth as any,
            isGlobal: true,
            disableGlobalAuthGuard: true,
            disableTrustedOriginsCors: false,
            disableBodyParser: false,
            enableRawBodyParser: false,
            disableControllers: false,
          }),
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });
});
