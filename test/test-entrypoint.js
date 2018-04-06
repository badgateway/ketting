/**
 * This file aids webpack into getting all tests to load via a single entrypoint.
 */
var req = require.context("./unit", true, /^(.*\.(js$))[^.]*$/im);
req.keys().forEach(function(key){
    req(key);
});
var req = require.context("./integration", true, /^(.*\.(js$))[^.]*$/im);
req.keys().forEach(function(key){
    req(key);
});
