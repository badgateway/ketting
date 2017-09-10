module.exports = {

  entry: './lib/index',
  output: {
    path: __dirname + '/dist',
    filename: 'ketting.min.js',
    library: 'Ketting'
  },

  resolve: {
    extensions: ['.web.js', '.js', '.json']
  },

  devtool: 'source-map'
}
