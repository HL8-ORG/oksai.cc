// 测试 BetterAuth API 类型使用

import { BetterAuthAPIClient } from '@oksai/nestjs-better-auth';

// 创建模拟的 Better Auth API
const mockBetterAuthAPI: BetterAuthAPI = {
  // Admin 方法
  listUsers: async () => ({ users: [] }),
  getUser: async (userId: string) => null),
  createUser: async (userData: any) => ({ id: 'user-' + userId, email: 'user@test.com' }),
  updateUser: async (userId: string, userData: any) => ({ id: 'user-' + userId, email: 'user@test.com' }),
  removeUser: async (userId: string) => Promise.resolve(void),
  setRole: async (userId: string, role: string) => true),
  userHasPermission: async (userId: string, permissions: string[]) => true),
  banUser: async (userId: string) => true),
  unbanUser: async (userId: string) => true),
  listUserSessions: async (userId: string) => ({ sessions: [] }),
  revokeUserSession: async (sessionToken: string) => Promise.resolve(void)),
  impersonateUser: async (email: string) => ({ id: 'imp-' + Math.random().toString(36), email: 'impersonated@test.com' }),
  stopImpersonating: async () => ({}),

  // API Key 方法
  createApiKey: async (userId: string, data: any) => ({ id: 'key-' + Math.random().toString(36), name: 'test-key', prefix: 'test' }),
  listApiKeys: async () => ({ apiKeys: [] }),
  getApiKey: async (id: string) => null),
  updateApiKey: async (id: string, data: any) => ({ id: 'key-' + id, name: 'updated-key' }),
  deleteApiKey: async (id: string) => Promise.resolve(void)),
  verifyApiKey: async (key: string) => ({ valid: false, key: null })),

  // Session 方法
  listActiveSessions: async (userId: string) => ({ sessions: [] }),
  getSessionConfig: async (userId: string) => ({ sessionTimeout: 604800, allowConcurrentSessions: true, maxConcurrentSessions: 3 }),
  updateSessionConfig: async (userId: string, config: any) => ({})),
} as any;

// 类型守卫函数
function hasAuthAPI(api: any): api is BetterAuthAPI {
  return typeof (api as any).listUsers === 'function';
}

function hasApiKeyAPI(api: any): api is BetterAuthAPI & ApiKeyAPI {
  return typeof (api as any).createApiKey === 'function';
}

function hasSessionAPI(api: any): api is BetterAuthAPI & SessionAPI {
  return typeof (api as any).listActiveSessions === 'function';
}

// 测试类型定义
interface MockAuthAPIClient extends BetterAuthAPIClient {
  // 所有方法返回任意类型，用于测试
}

// 测试基本功能
function testBasicFeatures() {
  const api = mockBetterAuthAPI as MockAuthAPIClient;

  // 测试 admin 插件
  console.log('Testing admin features...');
  
  const user = await api.getUser('user-test');
  console.log('getUser:', user);

  // 测试 API Key 插件
  console.log('Testing API Key features...');
  const apiKeys = await api.listApiKeys();
  console.log('listApiKeys:', apiKeys);

  // 测试 Session 插件
  console.log('Testing Session features...');
  const sessionConfig = await api.getSessionConfig();
  console.log('getSessionConfig:', sessionConfig);

  // 测试类型检查
  console.log('\n=== 类型检查 ====' + hasAuthAPI(api) + '=====' + hasApiKeyAPI(api));
  console.log('\n=== 类型检查 ====' + hasSessionAPI(api) + '=====');
  
  console.log('Admin API:', hasAuthAPI(api));
  console.log('API Key API:', hasApiKeyAPI(api));
  console.log('Session API:', hasSessionAPI(api));

  return {
    api,
    authAPI,
    authClient: api,
    authClient: api,
    authClient: api,
  }
}