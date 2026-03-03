/**
 * Token 加密工具
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import process from "node:process";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 获取加密密钥
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.OAUTH_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("OAUTH_ENCRYPTION_KEY or BETTER_AUTH_SECRET must be set");
  }

  // 使用 SHA-256 派生 32 字节密钥
  return createHash("sha256").update(secret).digest();
}

/**
 * 加密 Token
 *
 * @param token - 原始 token
 * @returns 加密后的 token（格式：iv:authTag:encrypted）
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // 返回格式：iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * 解密 Token
 *
 * @param encryptedToken - 加密的 token
 * @returns 原始 token
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hash Token（用于快速查找）
 *
 * @param token - 原始 token
 * @returns SHA-256 hash
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * 验证 PKCE Code Verifier
 *
 * @param codeVerifier - 客户端提供的 code verifier
 * @param codeChallenge - 存储的 code challenge
 * @param method - challenge 方法（plain 或 S256）
 */
export function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
  method: "plain" | "S256" = "S256"
): boolean {
  if (method === "plain") {
    return codeVerifier === codeChallenge;
  }

  // S256 method
  const computedChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  return computedChallenge === codeChallenge;
}

/**
 * 生成 Code Challenge
 *
 * @param codeVerifier - code verifier
 * @param method - challenge 方法
 */
export function generateCodeChallenge(codeVerifier: string, method: "plain" | "S256" = "S256"): string {
  if (method === "plain") {
    return codeVerifier;
  }

  return createHash("sha256").update(codeVerifier).digest("base64url");
}
