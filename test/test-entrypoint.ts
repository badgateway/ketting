/**
 * This file aids webpack into getting all tests to load via a single entrypoint.
 */
// @ts-ignore
let myRequire = require.context('./unit', true, /^(.*\.(ts$))[^.]*$/im);
myRequire.keys().forEach((key: string) => {
    myRequire(key);
});
// @ts-ignore
myRequire = require.context('./integration', true, /^(.*\.(ts$))[^.]*$/im);
myRequire.keys().forEach((key: string) => {
    myRequire(key);
});
