import 'reflect-metadata';
import {
  AllowAnonymous,
  OptionalAuth,
  Roles,
  OrgRoles,
  Session,
  Public,
  Optional,
  BeforeHook,
  AfterHook,
  Hook,
} from './decorators';
import { BEFORE_HOOK_KEY, AFTER_HOOK_KEY, HOOK_KEY } from './symbols';

describe('Decorators', () => {
  describe('@AllowAnonymous', () => {
    it('应该定义为函数', () => {
      expect(AllowAnonymous).toBeDefined();
      expect(typeof AllowAnonymous).toBe('function');
    });

    it('应该返回装饰器函数', () => {
      const decorator = AllowAnonymous();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('@OptionalAuth', () => {
    it('应该定义为函数', () => {
      expect(OptionalAuth).toBeDefined();
      expect(typeof OptionalAuth).toBe('function');
    });

    it('应该返回装饰器函数', () => {
      const decorator = OptionalAuth();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('@Roles', () => {
    it('应该定义为函数', () => {
      expect(Roles).toBeDefined();
      expect(typeof Roles).toBe('function');
    });

    it('应该接受角色数组参数', () => {
      const roles = ['admin', 'user'];
      const decorator = Roles(roles);
      expect(typeof decorator).toBe('function');
    });

    it('应该支持单个角色', () => {
      const roles = ['admin'];
      const decorator = Roles(roles);
      expect(typeof decorator).toBe('function');
    });
  });

  describe('@OrgRoles', () => {
    it('应该定义为函数', () => {
      expect(OrgRoles).toBeDefined();
      expect(typeof OrgRoles).toBe('function');
    });

    it('应该接受组织角色数组参数', () => {
      const roles = ['owner', 'admin'];
      const decorator = OrgRoles(roles);
      expect(typeof decorator).toBe('function');
    });
  });

  describe('@Public (deprecated)', () => {
    it('应该是 AllowAnonymous 的别名', () => {
      expect(Public).toBe(AllowAnonymous);
    });
  });

  describe('@Optional (deprecated)', () => {
    it('应该是 OptionalAuth 的别名', () => {
      expect(Optional).toBe(OptionalAuth);
    });
  });

  describe('@Session', () => {
    it('应该定义为参数装饰器', () => {
      expect(Session).toBeDefined();
      expect(typeof Session).toBe('function');
    });
  });

  describe('@BeforeHook', () => {
    it('应该定义为函数', () => {
      expect(BeforeHook).toBeDefined();
      expect(typeof BeforeHook).toBe('function');
    });

    it('应该接受可选的路径参数', () => {
      const decoratorWithPath = BeforeHook('/sign-in');
      const decoratorWithoutPath = BeforeHook();
      expect(typeof decoratorWithPath).toBe('function');
      expect(typeof decoratorWithoutPath).toBe('function');
    });
  });

  describe('@AfterHook', () => {
    it('应该定义为函数', () => {
      expect(AfterHook).toBeDefined();
      expect(typeof AfterHook).toBe('function');
    });

    it('应该接受可选的路径参数', () => {
      const decoratorWithPath = AfterHook('/sign-in');
      const decoratorWithoutPath = AfterHook();
      expect(typeof decoratorWithPath).toBe('function');
      expect(typeof decoratorWithoutPath).toBe('function');
    });
  });

  describe('@Hook', () => {
    it('应该定义为类装饰器', () => {
      expect(Hook).toBeDefined();
      expect(typeof Hook).toBe('function');
    });

    it('应该在类上设置元数据', () => {
      @Hook()
      class TestClass {}

      const metadata = Reflect.getMetadata(HOOK_KEY, TestClass);
      expect(metadata).toBe(true);
    });
  });

  describe('装饰器组合', () => {
    it('应该支持多个装饰器同时使用', () => {
      class TestClass {
        @AllowAnonymous()
        @OptionalAuth()
        testMethod() {}
      }

      // 只要不抛出错误就说明装饰器可以组合使用
      expect(TestClass).toBeDefined();
    });
  });
});
