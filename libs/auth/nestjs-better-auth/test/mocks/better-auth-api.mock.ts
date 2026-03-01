/**
 * better-auth/api mock for tests
 */

export const getSession = jest.fn();

export const createAuthMiddleware = jest.fn((handler: any) => handler);
