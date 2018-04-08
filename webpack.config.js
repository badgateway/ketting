module.exports = [
  {
    entry: './src/index',
    output: {
      path: __dirname + '/dist',
      filename: 'ketting.min.js',
      library: 'Ketting'
    },

    resolve: {
      extensions: ['.web.js', '.js', '.json']
    },

    devtool: 'source-map'
  },
  {
    entry: [
      './test/test-entrypoint',
    ],
    output: {
      path: __dirname + '/dist',
      filename: 'mocha-tests.js'
    },
    resolve: {
      extensions: ['.web.js', '.js', '.json'],
      alias: {
        // We need an alternative 'querystring', because the default is not
        // 100% compatible
        querystring: 'querystring-browser'
      }
    },
    mode: 'development'
  },
];
