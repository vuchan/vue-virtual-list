module.exports = {
  publicPath:
    process.env.NODE_ENV === 'production' ? '/vue-virtual-list/' : '/',
  configureWebpack: {
    entry: './example/main.js',
    resolve: {
      // Set up all the aliases we use in our app.
      // https://medium.com/@justintulk/solve-module-import-aliasing-for-webpack-jest-and-vscode-74007ce4adc9
      alias: require('./aliases.config').webpack
    },
    devServer: {
      open: true, // process.platform === 'darwin',
      port: 1888
    }
  }
}
