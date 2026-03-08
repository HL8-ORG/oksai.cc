/**
 * 加密工具类
 *
 * @description
 * 使用 AES-256-GCM 算法进行加密和解密
 * 适用于 Token、Client Secret 等敏感数据的加密存储
 */

import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import process from "node:process";
import type { ConfigService } from "@oksai/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * 加密服务
 */
export class EncryptionUtil {
  private readonly encryptionKey: Buffer;

  constructor(encryptionKey: string) {
    // 确保密钥是 32 字节（256 位）
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error("加密密钥必须至少 32 个字符");
    }

    this.encryptionKey = Buffer.from(encryptionKey.slice(0, 32), "utf-8");
  }

  /**
   * 加密数据
   *
   * @param plaintext - 明文数据
   * @returns 加密后的数据（格式：salt:iv:authTag:ciphertext）
   */
  encrypt(plaintext: string): string {
    // 生成随机 salt
    const salt = randomBytes(SALT_LENGTH);

    // 生成随机 IV
    const iv = randomBytes(IV_LENGTH);

    // 创建加密器
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);

    // 加密
    let ciphertext = cipher.update(plaintext, "utf-8", "hex");
    ciphertext += cipher.final("hex");

    // 获取认证标签
    const authTag = cipher.getAuthTag();

    // 组合：salt:iv:authTag:ciphertext
    return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext}`;
  }

  /**
   * 解密数据
   *
   * @param encryptedData - 加密的数据（格式：salt:iv:authTag:ciphertext）
   * @returns 解密后的明文
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(":");

    if (parts.length !== 4) {
      throw new Error("无效的加密数据格式");
    }

    const [_saltHex, ivHex, authTagHex, ciphertext] = parts;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    // 创建解密器
    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    // 解密
    let plaintext = decipher.update(ciphertext, "hex", "utf-8");
    plaintext += decipher.final("utf-8");

    return plaintext;
  }

  /**
   * 哈希数据（单向加密）
   *
   * @param data - 需要哈希的数据
   * @returns 哈希值
   */
  hash(data: string): string {
    const salt = randomBytes(16);
    const hash = pbkdf2Sync(data, salt, 100000, 64, "sha512");
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
  }

  /**
   * 验证哈希
   *
   * @param data - 原始数据
   * @param hashedData - 哈希值
   * @returns 是否匹配
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [saltHex, hashHex] = hashedData.split(":");
    const salt = Buffer.from(saltHex, "hex");
    const hash = pbkdf2Sync(data, salt, 100000, 64, "sha512");
    return hash.toString("hex") === hashHex;
  }
}

/**
 * 从环境变量创建加密实例
 */
export function createEncryptionUtil(configService?: ConfigService): EncryptionUtil {
  const encryptionKey = configService
    ? configService.get<string>("OAUTH_ENCRYPTION_KEY")
    : process.env.OAUTH_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error("缺少 OAUTH_ENCRYPTION_KEY 环境变量");
  }

  return new EncryptionUtil(encryptionKey);
}
