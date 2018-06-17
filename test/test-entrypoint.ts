/**
 * This file aids webpack into getting all tests to load via a single entrypoint.
 */
// @ts-ignore
var _req = require.context("./unit", true, /^(.*\.(js$))[^.]*$/im);
_req.keys().forEach(function(key: string){
    _req(key);
});
// @ts-ignore
var _req = require.context("./integration", true, /^(.*\.(js$))[^.]*$/im);
_req.keys().forEach(function(key: string){
    _req(key);
});
