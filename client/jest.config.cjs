// jest.config.cjs
module.exports = {
  testEnvironment: "jest-environment-jsdom",

  // Runs BEFORE the test framework — safe for polyfills
  setupFiles: [
    "<rootDir>/src/setupPolyfills.cjs",
  ],

  moduleNameMapper: {
    // Mock Tailwind / CSS imports
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",

    // Mock static assets
    "\\.(jpg|jpeg|png|gif|svg|ttf|woff|woff2)$":
      "<rootDir>/src/__mocks__/fileMock.cjs",

    // Mock supabase client so Jest never hits import.meta.env
    "^.*/config/supabaseClient(\\.js)?$":
      "<rootDir>/src/__mocks__/supabaseClient.cjs",
  },

  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],

  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  collectCoverage: false,
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/setupTests.cjs",
    "!src/setupPolyfills.cjs",
    "!src/**/__mocks__/**",
  ],
  coverageReporters: ["lcov", "text", "text-summary"],
  coverageDirectory: "coverage",
};
