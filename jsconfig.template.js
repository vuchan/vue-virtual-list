// This is a template for a jsconfig.json file which will be
// generated when starting the dev server or a build.

module.exports = {
  baseUrl: '.',
  include: ['src/**/*', 'tests/**/*'],
  compilerOptions: {
    baseUrl: '.',
    target: 'esnext',
    module: 'es2015',
    include: [
      'src/**/*',
      'tests/**/*',
      'node_modules/ibuild-portal-lte/src/**/*'
    ]
    // ...
    // `paths` will be automatically generated using aliases.config.js
    // ...
  }
}
