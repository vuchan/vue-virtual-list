module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
  ? '/vue-virtual-list/'
  : '/',
  pages: {
    index: {
      entry: "./example/main.js",
      template: './public/index.html',
      title: 'virtual list demo',
    }
  }
}