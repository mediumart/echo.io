# Echo.io (WIP)

## Description
> The package is still a in development! please use with caution.

This is a socket.io server implementation for laravel-echo. It consist of 3 components:
- A node.js server (which is this repository)
- A [javascript client](https://github.com/mediumart/echo.io-client) for the browser (which you should use in place of the **socket.io-client** script)
- A [php library](https://github.com/mediumart/echo.io-php) that handle integration with the laravel framework.

## Installation
```
$ npm install echo.io
```
You will also need to install the others components mentionned above.

Add a secret key, that will be use for authentication, either by defining an environment variable named `AUTH_KEY`(that will be fetched using `process.env.AUTH_KEY`) or just by using the instance function `echo.authKey('<your_secret_key_here>')` before calling `echo.listen()`.

this can be any random string for now, but the exact same secret key should be configured for the [php library](https://github.com/mediumart/echo.io-php), on the laravel framework side.

## Usage
```js
const Echo = require('echo.io');
const echo = new Echo({
    // <[socket.io options](https://github.com/socketio/socket.io/blob/master/docs/API.md#new-serverhttpserver-options)> 
    io: {},
    
    // <[ioredis options](https://github.com/luin/ioredis/blob/master/API.md#new_Redis)>
    // can be an object, an array of arguments or a string
    // example: 'redis://127.0.0.1:6379' or [6380, '192.168.100.1', { password: 'password' }] or { path: '/tmp/echo.sock' }
    redis: {}, 
});

// default port to 6001
echo.listen('<optionnal_port_or_server>', '<optionnal_options_same_as_above>');
```
