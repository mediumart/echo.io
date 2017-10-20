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
glob.sync('./src/middlewares/*.js').forEach(
    middleware => middlewares.push(
        require(path.resolve(middleware))
    )
);

module.exports = middlewares;