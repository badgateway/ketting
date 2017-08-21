module.exports = {
  "env": {
      "browser": true,
      "commonjs": true,
      "node": true,
      "es6": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "valid-jsdoc" : [
      "warn",
      {
        "requireReturn" : false,
        "requireParamDescription" : false,
        "requireReturnDescription" : false
      }
    ]
  }
};
