module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../src/core'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    '../src/core/**/*.ts',
    '!../src/core/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
