module.exports = {

  entry: "./lib/index",
  output: {
    path: __dirname + "/dist",
    filename: "ketting.js",
    library: "ketting"
  },

  resolve: {
    extensions: [".web.js", ".js", ".json"]
  }
}
