module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // `helpers/` holds shared utilities, not suites — don't treat them as tests.
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/helpers/"],
  setupFiles: ["<rootDir>/__tests__/helpers/setupEnv.js"],
  clearMocks: true,
};
