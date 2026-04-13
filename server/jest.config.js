// server/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  rootDir: './',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/middleware/**/*.js',
    'src/routes/**/*.js',
  ],
  coverageReporters: ['text', 'lcov'],
};