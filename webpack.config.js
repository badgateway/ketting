module.exports = [
  {
    entry: './src/index',
    output: {
      path: __dirname + '/browser',
      filename: 'ketting.min.js',
      library: 'Ketting'
    },

    resolve: {
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json']
    },

    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader'
        }
      ]
    },

  },
  {
    entry: [
      './test/test-entrypoint',
    ],
    output: {
      path: __dirname + '/browser',
      filename: 'mocha-tests.js'
    },
    resolve: {
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json'],
      alias: {
        // We need an alternative 'querystring', because the default is not
        // 100% compatible
        querystring: 'querystring-browser'
      }
    },
    mode: 'production',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader'
        }
      ]
    },

  },
];
