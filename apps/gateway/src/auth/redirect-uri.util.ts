/**
 * Redirect URI 验证工具
 *
 * @description
 * 提供严格的 Redirect URI 验证功能，防止开放重定向攻击
 */

/**
 * 验证 Redirect URI
 *
 * @param requestedUri - 客户端请求的 redirect_uri
 * @param allowedUris - 客户端配置的允许 redirect_uris
 * @returns 是否验证通过
 */
export function validateRedirectUri(requestedUri: string, allowedUris: string[]): boolean {
  try {
    const requested = new URL(requestedUri);

    // 遍历所有允许的 URI 进行匹配
    for (const allowedUri of allowedUris) {
      if (matchRedirectUri(requested, allowedUri)) {
        return true;
      }
    }

    return false;
  } catch (_error) {
    // URL 解析失败，拒绝请求
    return false;
  }
}

/**
 * 匹配单个 Redirect URI
 *
 * @param requested - 请求的 URL 对象
 * @param allowedPattern - 允许的 URI 模式（支持通配符）
 * @returns 是否匹配
 */
function matchRedirectUri(requested: URL, allowedPattern: string): boolean {
  try {
    // 检查是否是通配符模式
    if (allowedPattern.includes("*")) {
      return matchWildcardPattern(requested.href, allowedPattern);
    }

    // 精确匹配
    const allowed = new URL(allowedPattern);

    // 协议必须匹配
    if (requested.protocol !== allowed.protocol) {
      return false;
    }

    // 主机必须匹配
    if (requested.host !== allowed.host) {
      return false;
    }

    // 端口必须匹配
    if (requested.port !== allowed.port) {
      return false;
    }

    // 路径必须匹配
    if (requested.pathname !== allowed.pathname) {
      return false;
    }

    // 查询参数必须匹配（如果 allowed 有查询参数）
    if (allowed.search && requested.search !== allowed.search) {
      return false;
    }

    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * 通配符模式匹配
 *
 * @param requestedUri - 请求的 URI
 * @param pattern - 通配符模式（例如：https://*.example.com/callback）
 * @returns 是否匹配
 */
function matchWildcardPattern(requestedUri: string, pattern: string): boolean {
  try {
    // 将通配符模式转换为正则表达式
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // 转义特殊字符
      .replace(/\*/g, ".*"); // * 转换为 .*

    const regex = new RegExp(`^${regexPattern}$`);

    return regex.test(requestedUri);
  } catch (_error) {
    return false;
  }
}

/**
 * 验证 Redirect URI 格式
 *
 * @param uri - 要验证的 URI
 * @returns 是否是有效的 URI
 */
export function isValidRedirectUriFormat(uri: string): boolean {
  try {
    const url = new URL(uri);

    // 必须是 http 或 https 协议（本地开发允许）
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      // 允许自定义协议（如 myapp://）
      if (!url.protocol.includes(":")) {
        return false;
      }
    }

    // 不允许片段标识符
    if (url.hash) {
      return false;
    }

    // 主机不能为空
    if (!url.host) {
      return false;
    }

    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * 规范化 Redirect URI
 *
 * @param uri - 原始 URI
 * @returns 规范化后的 URI
 */
export function normalizeRedirectUri(uri: string): string {
  try {
    const url = new URL(uri);

    // 移除片段标识符
    url.hash = "";

    // 移除尾随斜杠（可选）
    if (url.pathname.endsWith("/") && url.pathname !== "/") {
      url.pathname = url.pathname.slice(0, -1);
    }

    // 排序查询参数
    url.searchParams.sort();

    return url.href;
  } catch (_error) {
    return uri;
  }
}

/**
 * 检查是否是本地 Redirect URI
 *
 * @param uri - 要检查的 URI
 * @returns 是否是本地 URI
 */
export function isLocalRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);

    // localhost 或 127.0.0.1
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }

    // 本地文件协议
    if (url.protocol === "file:") {
      return true;
    }

    return false;
  } catch (_error) {
    return false;
  }
}

/**
 * 验证 Redirect URI 列表
 *
 * @param uris - URI 列表
 * @param allowLocalhost - 是否允许 localhost
 * @returns 验证结果和错误信息
 */
export function validateRedirectUriList(
  uris: string[],
  allowLocalhost: boolean = true
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const uri of uris) {
    // 检查格式
    if (!isValidRedirectUriFormat(uri)) {
      errors.push(`无效的 URI 格式: ${uri}`);
      continue;
    }

    // 检查 localhost
    if (!allowLocalhost && isLocalRedirectUri(uri)) {
      errors.push(`生产环境不允许 localhost: ${uri}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
