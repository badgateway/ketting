module.exports = [
  {
    target: 'browserslist',
    entry: './src/index',
    output: {
      path: __dirname + '/browser',
      filename: 'ketting.min.js',
      library: 'Ketting',
      libraryTarget: 'umd'
    },

    resolve: {
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json'],
      alias: {
        // We need an alternative 'querystring', because the default is not
        // 100% compatible
        querystring: 'querystring-browser'
      },
      fallback: { "buffer": false }
    },

    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }
      ]
    }
  },
];
