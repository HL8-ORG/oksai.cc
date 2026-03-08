import "reflect-metadata";
import {
  AdminOnly,
  AfterHook,
  AllowAnonymous,
  BeforeHook,
  Hook,
  MemberOnly,
  Optional,
  OptionalAuth,
  OrgAdminOnly,
  OrgRoles,
  OwnerOnly,
  Public,
  Roles,
  Session,
  SuperAdminOnly,
} from "./decorators";
import { HOOK_KEY } from "./symbols.js";

describe("Decorators", () => {
  describe("@AllowAnonymous", () => {
    it("应该定义为函数", () => {
      expect(AllowAnonymous).toBeDefined();
      expect(typeof AllowAnonymous).toBe("function");
    });

    it("应该返回装饰器函数", () => {
      const decorator = AllowAnonymous();
      expect(typeof decorator).toBe("function");
    });
  });

  describe("@OptionalAuth", () => {
    it("应该定义为函数", () => {
      expect(OptionalAuth).toBeDefined();
      expect(typeof OptionalAuth).toBe("function");
    });

    it("应该返回装饰器函数", () => {
      const decorator = OptionalAuth();
      expect(typeof decorator).toBe("function");
    });
  });

  describe("@Roles", () => {
    it("应该定义为函数", () => {
      expect(Roles).toBeDefined();
      expect(typeof Roles).toBe("function");
    });

    it("应该接受角色数组参数", () => {
      const roles = ["admin", "user"];
      const decorator = Roles(roles);
      expect(typeof decorator).toBe("function");
    });

    it("应该支持单个角色", () => {
      const roles = ["admin"];
      const decorator = Roles(roles);
      expect(typeof decorator).toBe("function");
    });
  });

  describe("@OrgRoles", () => {
    it("应该定义为函数", () => {
      expect(OrgRoles).toBeDefined();
      expect(typeof OrgRoles).toBe("function");
    });

    it("应该接受组织角色数组参数", () => {
      const roles = ["owner", "admin"];
      const decorator = OrgRoles(roles);
      expect(typeof decorator).toBe("function");
    });
  });

  describe("@Public (deprecated)", () => {
    it("应该是 AllowAnonymous 的别名", () => {
      expect(Public).toBe(AllowAnonymous);
    });
  });

  describe("@Optional (deprecated)", () => {
    it("应该是 OptionalAuth 的别名", () => {
      expect(Optional).toBe(OptionalAuth);
    });
  });

  describe("@Session", () => {
    it("应该定义为参数装饰器", () => {
      expect(Session).toBeDefined();
      expect(typeof Session).toBe("function");
    });
  });

  describe("@BeforeHook", () => {
    it("应该定义为函数", () => {
      expect(BeforeHook).toBeDefined();
      expect(typeof BeforeHook).toBe("function");
    });

    it("应该接受可选的路径参数", () => {
      const decoratorWithPath = BeforeHook("/sign-in");
      const decoratorWithoutPath = BeforeHook();
      expect(typeof decoratorWithPath).toBe("function");
      expect(typeof decoratorWithoutPath).toBe("function");
    });
  });

  describe("@AfterHook", () => {
    it("应该定义为函数", () => {
      expect(AfterHook).toBeDefined();
      expect(typeof AfterHook).toBe("function");
    });

    it("应该接受可选的路径参数", () => {
      const decoratorWithPath = AfterHook("/sign-in");
      const decoratorWithoutPath = AfterHook();
      expect(typeof decoratorWithPath).toBe("function");
      expect(typeof decoratorWithoutPath).toBe("function");
    });
  });

  describe("@Hook", () => {
    it("应该定义为类装饰器", () => {
      expect(Hook).toBeDefined();
      expect(typeof Hook).toBe("function");
    });

    it("应该在类上设置元数据", () => {
      @Hook()
      class TestClass {}

      const metadata = Reflect.getMetadata(HOOK_KEY, TestClass);
      expect(metadata).toBe(true);
    });
  });

  describe("装饰器组合", () => {
    it("应该支持多个装饰器同时使用", () => {
      class TestClass {
        @AllowAnonymous()
        @OptionalAuth()
        testMethod() {}
      }

      // 只要不抛出错误就说明装饰器可以组合使用
      expect(TestClass).toBeDefined();
    });
  });

  describe("组合装饰器（便捷方法）", () => {
    describe("@AdminOnly", () => {
      it("应该定义为函数", () => {
        expect(AdminOnly).toBeDefined();
        expect(typeof AdminOnly).toBe("function");
      });

      it("应该设置 admin 角色", () => {
        class TestClass {
          @AdminOnly()
          adminMethod() {}
        }

        const metadata = Reflect.getMetadata("ROLES", TestClass.prototype.adminMethod);
        expect(metadata).toEqual(["admin"]);
      });
    });

    describe("@SuperAdminOnly", () => {
      it("应该定义为函数", () => {
        expect(SuperAdminOnly).toBeDefined();
        expect(typeof SuperAdminOnly).toBe("function");
      });

      it("应该设置 superadmin 角色", () => {
        class TestClass {
          @SuperAdminOnly()
          superAdminMethod() {}
        }

        const metadata = Reflect.getMetadata("ROLES", TestClass.prototype.superAdminMethod);
        expect(metadata).toEqual(["superadmin"]);
      });
    });

    describe("@OwnerOnly", () => {
      it("应该定义为函数", () => {
        expect(OwnerOnly).toBeDefined();
        expect(typeof OwnerOnly).toBe("function");
      });

      it("应该设置 owner 组织角色", () => {
        class TestClass {
          @OwnerOnly()
          ownerMethod() {}
        }

        const metadata = Reflect.getMetadata("ORG_ROLES", TestClass.prototype.ownerMethod);
        expect(metadata).toEqual(["owner"]);
      });
    });

    describe("@OrgAdminOnly", () => {
      it("应该定义为函数", () => {
        expect(OrgAdminOnly).toBeDefined();
        expect(typeof OrgAdminOnly).toBe("function");
      });

      it("应该设置 owner 和 admin 组织角色", () => {
        class TestClass {
          @OrgAdminOnly()
          orgAdminMethod() {}
        }

        const metadata = Reflect.getMetadata("ORG_ROLES", TestClass.prototype.orgAdminMethod);
        expect(metadata).toEqual(["owner", "admin"]);
      });
    });

    describe("@MemberOnly", () => {
      it("应该定义为函数", () => {
        expect(MemberOnly).toBeDefined();
        expect(typeof MemberOnly).toBe("function");
      });

      it("应该设置 owner、admin 和 member 组织角色", () => {
        class TestClass {
          @MemberOnly()
          memberMethod() {}
        }

        const metadata = Reflect.getMetadata("ORG_ROLES", TestClass.prototype.memberMethod);
        expect(metadata).toEqual(["owner", "admin", "member"]);
      });
    });
  });
});
