/**
 * OAuth 加密工具函数
 */

import { createHash, randomBytes } from "node:crypto";

/**
 * 生成 PKCE code_verifier
 *
 * @description
 * 生成一个随机的、加密安全的 code_verifier
 * 长度在 43-128 个字符之间，使用 [A-Z][a-z][0-9]-._~ 字符集
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * 生成 PKCE code_challenge
 *
 * @param codeVerifier - code_verifier
 * @param method - challenge 方法（plain 或 S256）
 */
export function generateCodeChallenge(codeVerifier: string, method: "plain" | "S256" = "S256"): string {
  if (method === "plain") {
    return codeVerifier;
  }

  // S256 方法：SHA256(code_verifier) 的 base64url 编码
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

/**
 * 验证 PKCE code_verifier
 *
 * @param codeVerifier - 客户端提供的 code_verifier
 * @param codeChallenge - 服务器存储的 code_challenge
 * @param method - challenge 方法（plain 或 S256）
 */
export function verifyCodeVerifier(
  codeVerifier: string,
  codeChallenge: string,
  method: "plain" | "S256" = "S256"
): boolean {
  try {
    const expectedChallenge = generateCodeChallenge(codeVerifier, method);
    return expectedChallenge === codeChallenge;
  } catch (_error) {
    return false;
  }
}
