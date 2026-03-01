/**
 * better-auth/node mock for tests
 */

export const fromNodeHeaders = jest.fn((headers: any) => {
  // 将 Node.js headers 转换为标准 Headers 对象
  const standardHeaders = new Headers();

  if (headers && typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        standardHeaders.set(key, value.toString());
      }
    }
  }

  return standardHeaders;
});

export const toNodeHandler = jest.fn((auth: any) => {
  return jest.fn((req: any, res: any) => {
    // Mock handler
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
  });
});
