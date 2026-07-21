module.exports = {
  testDir: './e2e-tests',
  testMatch: '**/*.spec.js',
  webServer: {
    command: 'npm run start',
    port: 8080,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:8080',
  },
};