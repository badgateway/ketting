/**
 * This file aids webpack into getting all tests to load via a single entrypoint.
 */
var _req = require.context("./unit", true, /^(.*\.(js$))[^.]*$/im);
_req.keys().forEach(function(key){
    _req(key);
});
var _req = require.context("./integration", true, /^(.*\.(js$))[^.]*$/im);
_req.keys().forEach(function(key){
    _req(key);
});
