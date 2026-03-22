export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/backend/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globalSetup: "./backend/__tests__/globalSetup.js",
  maxWorkers: 1, // Run serially to avoid DB contention
};
