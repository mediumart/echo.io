/**
 * Module dependencies.
 */
const glob = require('glob');
const path = require('path');

/**
 * Middlewares;
 * 
 * @type {Array}
 */
const middlewares = [];

/**
 * Require middleware files.
 */
glob.sync(__dirname + '/middlewares/*.js').forEach(
    middleware => middlewares.push(
        require(path.resolve(middleware))
    )
);

module.exports = middlewares;