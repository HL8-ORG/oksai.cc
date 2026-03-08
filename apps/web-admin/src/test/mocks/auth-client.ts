import type { Mock } from "vitest";
import { vi } from "vitest";

/**
 * Better Auth Client Mock
 */
export const mockAuthClient = {
  signIn: {
    email: vi.fn() as Mock,
    social: vi.fn() as Mock,
  },
  signUp: {
    email: vi.fn() as Mock,
  },
  signOut: vi.fn() as Mock,
  getSession: vi.fn() as Mock,
  useSession: vi.fn(() => ({
    data: { session: null, user: null },
    isPending: false,
    error: null,
  })) as Mock,
  twoFactor: {
    enable: vi.fn() as Mock,
    verifyTotp: vi.fn() as Mock,
    verifyBackupCode: vi.fn() as Mock,
  },
};

/**
 * 重置所有 Mock
 */
export function resetAuthMocks() {
  mockAuthClient.signIn.email.mockReset();
  mockAuthClient.signIn.social.mockReset();
  mockAuthClient.signUp.email.mockReset();
  mockAuthClient.signOut.mockReset();
  mockAuthClient.getSession.mockReset();
  mockAuthClient.useSession.mockReset();
  mockAuthClient.twoFactor.enable.mockReset();
  mockAuthClient.twoFactor.verifyTotp.mockReset();
  mockAuthClient.twoFactor.verifyBackupCode.mockReset();
}

/**
 * 模拟成功登录
 */
export function mockSuccessfulSignIn(user = { id: "1", email: "test@example.com", name: "Test User" }) {
  mockAuthClient.signIn.email.mockResolvedValueOnce({
    data: { user, session: { token: "test-token" } },
    error: null,
  });
  return user;
}

/**
 * 模拟登录失败
 */
export function mockFailedSignIn(errorMessage = "Invalid credentials") {
  mockAuthClient.signIn.email.mockResolvedValueOnce({
    data: null,
    error: { message: errorMessage },
  });
}

/**
 * 模拟成功注册
 */
export function mockSuccessfulSignUp(user = { id: "1", email: "new@example.com", name: "New User" }) {
  mockAuthClient.signUp.email.mockResolvedValueOnce({
    data: { user },
    error: null,
  });
  return user;
}

/**
 * 模拟注册失败
 */
export function mockFailedSignUp(errorMessage = "Email already exists") {
  mockAuthClient.signUp.email.mockResolvedValueOnce({
    data: null,
    error: { message: errorMessage },
  });
}

/**
 * 模拟成功登出
 */
export function mockSuccessfulSignOut() {
  mockAuthClient.signOut.mockResolvedValueOnce({ data: null, error: null });
}

/**
 * 模拟获取会话
 */
export function mockGetSession(session = { user: { id: "1", email: "test@example.com" } }) {
  mockAuthClient.getSession.mockResolvedValueOnce({
    data: { session },
    error: null,
  });
  return session;
}

/**
 * 模拟启用 2FA
 */
export function mockEnable2FA() {
  mockAuthClient.twoFactor.enable.mockResolvedValueOnce({
    data: {
      totpURI: "otpauth://totp/Test:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test",
      backupCodes: ["code1", "code2", "code3", "code4", "code5"],
    },
    error: null,
  });
}

/**
 * 模拟验证 TOTP
 */
export function mockVerifyTotp() {
  mockAuthClient.twoFactor.verifyTotp.mockResolvedValueOnce({
    data: { verified: true },
    error: null,
  });
}
