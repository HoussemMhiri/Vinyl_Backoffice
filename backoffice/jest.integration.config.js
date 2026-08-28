/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 120000,
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true, strict: false } }],
  },
};
