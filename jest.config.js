const nextJest = require('next/jest');

// Provide the path to your Next.js app to load next.config.js and .env files
const createJestConfig = nextJest({
  dir: './',
});

// Custom Jest configuration
const customJestConfig = {
  // Setup file to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Use jsdom environment to simulate browser
  testEnvironment: 'jest-environment-jsdom',

  // Module path aliases (mirrors tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Where to find test files
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // Coverage collection settings
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/**', // Exclude Next.js app directory for now
  ],

  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // Ignore these directories
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/', // Playwright E2E tests
  ],

  // Don't transform node_modules
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // Max workers for parallel test execution
  maxWorkers: '50%',
};

// Export async config (Next.js requirement)
module.exports = createJestConfig(customJestConfig);
