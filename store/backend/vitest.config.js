const { defineConfig } = require('vitest/config');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      clean: false,
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/config/**'],
    },
  },
});