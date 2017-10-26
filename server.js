const Echo = require('./src/manager');
const echo = new Echo({
    redis: 'redis://192.168.99.100:6379'
});

echo.authkey('secret');

echo.listen();
