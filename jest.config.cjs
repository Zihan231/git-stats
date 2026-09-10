module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/types/**'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
