/**
 * 认证服务集成测试
 */

import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

describe("AuthService (Integration)", () => {
  let service: AuthService;
  let mockAuthAPI: any;

  beforeEach(async () => {
    // Mock Better Auth API
    mockAuthAPI = {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      verifyEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      signInSocial: vi.fn(),
      sendMagicLink: vi.fn(),
      enableTwoFactor: vi.fn(),
      verifyTwoFactor: vi.fn(),
      disableTwoFactor: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useFactory: () => new AuthService(mockAuthAPI),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("用户注册", () => {
    const signUpDto = {
      email: "test@example.com",
      password: "password123",
      name: "测试用户",
    };

    it("应该成功注册用户", async () => {
      const mockResult = {
        user: {
          id: "user-id",
          email: signUpDto.email,
          name: signUpDto.name,
          emailVerified: false,
        },
      };

      mockAuthAPI.signUpEmail.mockResolvedValue(mockResult);

      const result = await service.signUp(signUpDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("注册成功，请查收验证邮件");
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(signUpDto.email);
      expect(mockAuthAPI.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: signUpDto.email,
          password: signUpDto.password,
          name: signUpDto.name,
        },
      });
    });

    it("注册失败时应该抛出 BadRequestException", async () => {
      mockAuthAPI.signUpEmail.mockResolvedValue(null);

      await expect(service.signUp(signUpDto)).rejects.toThrow(BadRequestException);
    });

    it("邮箱已存在时应该抛出错误", async () => {
      mockAuthAPI.signUpEmail.mockRejectedValue(new Error("邮箱已被注册"));

      await expect(service.signUp(signUpDto)).rejects.toThrow("邮箱已被注册");
    });
  });

  describe("用户登录", () => {
    const signInDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("应该成功登录", async () => {
      const mockResult = {
        user: {
          id: "user-id",
          email: signInDto.email,
          name: "测试用户",
          emailVerified: true,
        },
        session: {
          id: "session-id",
          token: "session-token",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      mockAuthAPI.signInEmail.mockResolvedValue(mockResult);

      const result = await service.signIn(signInDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("登录成功");
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(mockAuthAPI.signInEmail).toHaveBeenCalledWith({
        body: {
          email: signInDto.email,
          password: signInDto.password,
        },
      });
    });

    it("邮箱或密码错误时应该抛出 UnauthorizedException", async () => {
      mockAuthAPI.signInEmail.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });

    it("密码错误时应该抛出错误", async () => {
      mockAuthAPI.signInEmail.mockRejectedValue(new Error("密码错误"));

      await expect(service.signIn(signInDto)).rejects.toThrow("密码错误");
    });
  });

  describe("邮箱验证", () => {
    const verifyEmailDto = {
      token: "verification-token",
    };

    it("应该成功验证邮箱", async () => {
      const mockResult = {
        user: {
          id: "user-id",
          email: "test@example.com",
          emailVerified: true,
        },
      };

      mockAuthAPI.verifyEmail.mockResolvedValue(mockResult);

      const result = await service.verifyEmail(verifyEmailDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("邮箱验证成功");
      expect(result.user?.emailVerified).toBe(true);
      expect(mockAuthAPI.verifyEmail).toHaveBeenCalledWith({
        body: {
          token: verifyEmailDto.token,
        },
      });
    });

    it("Token 无效时应该抛出 BadRequestException", async () => {
      mockAuthAPI.verifyEmail.mockResolvedValue(null);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("忘记密码", () => {
    const forgotPasswordDto = {
      email: "test@example.com",
    };

    it("应该成功发送重置邮件", async () => {
      mockAuthAPI.requestPasswordReset.mockResolvedValue({});

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("密码重置邮件已发送，请查收");
      expect(mockAuthAPI.requestPasswordReset).toHaveBeenCalledWith({
        body: {
          email: forgotPasswordDto.email,
        },
      });
    });

    it("即使邮箱不存在也应该返回成功（安全考虑）", async () => {
      mockAuthAPI.requestPasswordReset.mockRejectedValue(new Error("用户不存在"));

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("如果该邮箱已注册，您将收到密码重置邮件");
    });
  });

  describe("重置密码", () => {
    const resetPasswordDto = {
      token: "reset-token",
      newPassword: "newpassword123",
    };

    it("应该成功重置密码", async () => {
      mockAuthAPI.resetPassword.mockResolvedValue({});

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("密码重置成功，请使用新密码登录");
      expect(mockAuthAPI.resetPassword).toHaveBeenCalledWith({
        body: {
          token: resetPasswordDto.token,
          newPassword: resetPasswordDto.newPassword,
        },
      });
    });

    it("Token 无效时应该抛出 BadRequestException", async () => {
      mockAuthAPI.resetPassword.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("获取会话", () => {
    const token = "session-token";

    it("应该成功获取会话", async () => {
      const mockResult = {
        user: {
          id: "user-id",
          email: "test@example.com",
          emailVerified: true,
        },
        session: {
          id: "session-id",
          token: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      mockAuthAPI.getSession.mockResolvedValue(mockResult);

      const result = await service.getSession(token);

      expect(result.success).toBe(true);
      expect(result.message).toBe("获取会话成功");
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(mockAuthAPI.getSession).toHaveBeenCalledWith(token);
    });

    it("Token 无效时应该抛出 UnauthorizedException", async () => {
      mockAuthAPI.getSession.mockResolvedValue(null);

      await expect(service.getSession(token)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("登出", () => {
    const token = "session-token";

    it("应该成功登出", async () => {
      mockAuthAPI.signOut.mockResolvedValue({});

      const result = await service.signOut(token);

      expect(result.success).toBe(true);
      expect(result.message).toBe("登出成功");
      expect(mockAuthAPI.signOut).toHaveBeenCalledWith(token);
    });

    it("登出失败时应该抛出错误", async () => {
      mockAuthAPI.signOut.mockRejectedValue(new Error("登出失败"));

      await expect(service.signOut(token)).rejects.toThrow("登出失败");
    });
  });

  describe("Magic Link 登录", () => {
    const magicLinkDto = {
      email: "test@example.com",
    };

    it("应该成功发送 Magic Link", async () => {
      mockAuthAPI.sendMagicLink.mockResolvedValue({});

      const result = await service.sendMagicLink(magicLinkDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("如果该邮箱已注册，您将收到 Magic Link");
      expect(mockAuthAPI.sendMagicLink).toHaveBeenCalledWith({
        email: magicLinkDto.email,
      });
    });

    it("即使邮箱不存在也应该返回成功（安全考虑）", async () => {
      mockAuthAPI.sendMagicLink.mockRejectedValue(new Error("用户不存在"));

      const result = await service.sendMagicLink(magicLinkDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("如果该邮箱已注册，您将收到 Magic Link");
    });
  });

  describe("双因素认证 (2FA)", () => {
    const token = "valid-session-token";
    const enableDto = { password: "currentPassword123" };
    const verifyDto = { code: "123456", trustDevice: true };
    const disableDto = { password: "currentPassword123" };

    describe("启用 2FA", () => {
      it("应该成功启用 2FA 并返回 QR Code", async () => {
        const mockResult = {
          user: {
            id: "user-id",
            email: "test@example.com",
            twoFactorEnabled: true,
          },
          qrCode: "otpauth://totp/...",
          secret: "JBSWY3DPEHPK3PXP",
        };

        mockAuthAPI.enableTwoFactor.mockResolvedValue(mockResult);

        const result = await service.enableTwoFactor(token, enableDto);

        expect(result.success).toBe(true);
        expect(result.message).toBe("双因素认证已启用");
        expect(result.user).toBeDefined();
        expect(mockAuthAPI.enableTwoFactor).toHaveBeenCalledWith({ password: enableDto.password }, token);
      });

      it("启用失败时应该抛出 BadRequestException", async () => {
        mockAuthAPI.enableTwoFactor.mockResolvedValue(null);

        await expect(service.enableTwoFactor(token, enableDto)).rejects.toThrow(BadRequestException);
      });

      it("密码错误时应该抛出错误", async () => {
        mockAuthAPI.enableTwoFactor.mockRejectedValue(new Error("密码错误"));

        await expect(service.enableTwoFactor(token, enableDto)).rejects.toThrow("密码错误");
      });
    });

    describe("验证 2FA 代码", () => {
      it("应该成功验证 TOTP 代码", async () => {
        const mockResult = {
          user: {
            id: "user-id",
            email: "test@example.com",
            twoFactorEnabled: true,
          },
          backupCodes: ["code1", "code2", "code3"],
        };

        mockAuthAPI.verifyTwoFactor.mockResolvedValue(mockResult);

        const result = await service.verifyTwoFactor(token, verifyDto);

        expect(result.success).toBe(true);
        expect(result.message).toBe("双因素认证验证成功");
        expect(result.user).toBeDefined();
        expect(mockAuthAPI.verifyTwoFactor).toHaveBeenCalledWith(
          { code: verifyDto.code, trustDevice: verifyDto.trustDevice },
          token
        );
      });

      it("验证码错误时应该抛出 BadRequestException", async () => {
        mockAuthAPI.verifyTwoFactor.mockResolvedValue(null);

        await expect(service.verifyTwoFactor(token, verifyDto)).rejects.toThrow(BadRequestException);
      });

      it("验证码过期时应该抛出错误", async () => {
        mockAuthAPI.verifyTwoFactor.mockRejectedValue(new Error("验证码已过期"));

        await expect(service.verifyTwoFactor(token, verifyDto)).rejects.toThrow("验证码已过期");
      });
    });

    describe("禁用 2FA", () => {
      it("应该成功禁用 2FA", async () => {
        mockAuthAPI.disableTwoFactor.mockResolvedValue({});

        const result = await service.disableTwoFactor(token, disableDto);

        expect(result.success).toBe(true);
        expect(result.message).toBe("双因素认证已禁用");
        expect(mockAuthAPI.disableTwoFactor).toHaveBeenCalledWith({ password: disableDto.password }, token);
      });

      it("密码错误时应该抛出错误", async () => {
        mockAuthAPI.disableTwoFactor.mockRejectedValue(new Error("密码错误"));

        await expect(service.disableTwoFactor(token, disableDto)).rejects.toThrow("密码错误");
      });
    });
  });
});
