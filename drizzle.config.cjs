const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './drizzle/schema.js',
  out: './drizzle',
});

