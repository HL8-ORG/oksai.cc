/**
 * Redirect URI 验证工具测试
 */

import { describe, expect, it } from "vitest";
import {
  isLocalRedirectUri,
  isValidRedirectUriFormat,
  normalizeRedirectUri,
  validateRedirectUri,
  validateRedirectUriList,
} from "./redirect-uri.util";

describe("Redirect URI 验证", () => {
  describe("validateRedirectUri", () => {
    it("应该通过精确匹配", () => {
      const requestedUri = "https://example.com/callback";
      const allowedUris = ["https://example.com/callback"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(true);
    });

    it("应该拒绝不匹配的 URI", () => {
      const requestedUri = "https://example.com/callback";
      const allowedUris = ["https://example.com/other"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(false);
    });

    it("应该拒绝不同协议", () => {
      const requestedUri = "http://example.com/callback";
      const allowedUris = ["https://example.com/callback"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(false);
    });

    it("应该拒绝不同端口", () => {
      const requestedUri = "https://example.com:8080/callback";
      const allowedUris = ["https://example.com/callback"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(false);
    });

    it("应该支持通配符匹配", () => {
      const requestedUri = "https://app.example.com/callback";
      const allowedUris = ["https://*.example.com/callback"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(true);
    });

    it("应该支持多个通配符", () => {
      const requestedUri = "https://app.sub.example.com/callback";
      const allowedUris = ["https://*.example.com/callback"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(true);
    });

    it("应该拒绝无效的 URI", () => {
      const requestedUri = "not-a-valid-uri";
      const allowedUris = ["https://example.com/callback"];

      expect(validateRedirectUri(requestedUri, allowedUris)).toBe(false);
    });
  });

  describe("isValidRedirectUriFormat", () => {
    it("应该接受有效的 HTTPS URI", () => {
      expect(isValidRedirectUriFormat("https://example.com/callback")).toBe(true);
    });

    it("应该接受有效的 HTTP URI", () => {
      expect(isValidRedirectUriFormat("http://localhost:3000/callback")).toBe(true);
    });

    it("应该接受自定义协议", () => {
      expect(isValidRedirectUriFormat("myapp://callback")).toBe(true);
    });

    it("应该拒绝包含片段的 URI", () => {
      expect(isValidRedirectUriFormat("https://example.com/callback#fragment")).toBe(false);
    });

    it("应该拒绝无效的 URI", () => {
      expect(isValidRedirectUriFormat("not-a-uri")).toBe(false);
    });
  });

  describe("isLocalRedirectUri", () => {
    it("应该识别 localhost", () => {
      expect(isLocalRedirectUri("http://localhost:3000/callback")).toBe(true);
    });

    it("应该识别 127.0.0.1", () => {
      expect(isLocalRedirectUri("http://127.0.0.1:3000/callback")).toBe(true);
    });

    it("应该拒绝非本地 URI", () => {
      expect(isLocalRedirectUri("https://example.com/callback")).toBe(false);
    });
  });

  describe("normalizeRedirectUri", () => {
    it("应该移除片段", () => {
      const uri = "https://example.com/callback#fragment";
      expect(normalizeRedirectUri(uri)).toBe("https://example.com/callback");
    });

    it("应该移除尾随斜杠", () => {
      const uri = "https://example.com/callback/";
      expect(normalizeRedirectUri(uri)).toBe("https://example.com/callback");
    });

    it("应该排序查询参数", () => {
      const uri = "https://example.com/callback?b=2&a=1";
      expect(normalizeRedirectUri(uri)).toBe("https://example.com/callback?a=1&b=2");
    });
  });

  describe("validateRedirectUriList", () => {
    it("应该接受有效的 URI 列表", () => {
      const uris = ["https://example.com/callback", "https://example.com/other"];
      const result = validateRedirectUriList(uris, true);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("应该拒绝无效的 URI", () => {
      const uris = ["not-a-uri", "https://example.com/callback"];
      const result = validateRedirectUriList(uris, true);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("应该拒绝 localhost（当禁用时）", () => {
      const uris = ["http://localhost:3000/callback"];
      const result = validateRedirectUriList(uris, false);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("应该允许 localhost（当启用时）", () => {
      const uris = ["http://localhost:3000/callback"];
      const result = validateRedirectUriList(uris, true);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
