module.exports = {

  entry: "./lib/index",
  output: {
    path: __dirname + "/dist",
    filename: "restl.js",
    library: "restl"
  },

  resolve: {
    extensions: [".web.js", ".js", ".json"]
  }
}
