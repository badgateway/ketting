/**
 * This file aids webpack into getting all tests to load via a single entrypoint.
 */
// @ts-expect-error trust me on this
let myRequire = require.context('./unit', true, /^(.*\.(ts$))[^.]*$/im);
myRequire.keys().forEach((key: string) => {
  myRequire(key);
});
// @ts-expect-error trust me on this
myRequire = require.context('./integration', true, /^(.*\.(ts$))[^.]*$/im);
myRequire.keys().forEach((key: string) => {
  myRequire(key);
});
