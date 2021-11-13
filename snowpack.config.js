// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  root: "./www/static",
  workspaceRoot: "./",
  plugins: [
    '@snowpack/plugin-typescript'
  ],
  exclude: [
    '**/*.py',
    '**/*.sql',
    '**/*.html',
    '**/*.bak',
    '**/*.pyc',
    '**/*.zip',
    '**/.mypy_cache',
    '**/.mypy_cache/**',
    '**/__pycache__',
    '**/*.svg'
  ],
  packageOptions: {
    source: "local",
    knownEntrypoints: ['chart.js', 'chart.js/helpers', 'chart.js/auto']
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    out: "www/static/build",
    clean: false
  }
};
