/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock optional dependencies
    '^@nestjs/graphql$': '<rootDir>/test/mocks/graphql.mock.ts',
    '^@nestjs/websockets$': '<rootDir>/test/mocks/websockets.mock.ts',
    '^better-auth/node$': '<rootDir>/test/mocks/better-auth-node.mock.ts',
    '^better-auth/api$': '<rootDir>/test/mocks/better-auth-api.mock.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(@nestjs|better-auth)/)'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
