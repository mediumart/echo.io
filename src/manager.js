const Io = require('./io');
const Redis = require('./redis');
const middlewares = require('./middlewares');

class Manager {
    /**
     * Constructor.
     *
     * @param  options
     */
    constructor(options) {
        this.middlewares = new Map();

        this.options = {
            io: undefined,
            redis: 'redis://127.0.0.1:6379'
        };

        this.setOptions(options || {});
    }

    /**
     * Configure instance options.
     * 
     * @param options
     */
    setOptions(options) {
        this.options = Object.assign({}, this.options, options);
    }

    /**
     * Get options.
     * 
     * @return {Object}
     */
    getOptions() {
        let options = arguments[0];

        if ('object' === typeof options) {
            this.setOptions(options);
        } 

        return this.options;
    }

    /**
     * Start all connections.
     * 
     * @param  srv  
     * @param  options
     * 
     * @return {void}       
     */
    listen(srv, options) {
        this.attach(srv, options);
    }

    /**
     * Start all connections.
     * 
     * @param  srv  
     * @param  options
     * 
     * @return {void}       
     */
    attach(srv, options) {
        if (typeof srv =='object') {
            options = srv;  srv = undefined;
        }

        options = this.getOptions(options);

        if (! this.redis) {
            this.startRedisConnection(options.redis);
        }
        
        if (! this.io) {
            this.startIoConnection(srv, options.io);
            
            this.connectMiddlewares();
        }

        // to be replaced by an event emitter/listener
        this.redis.dispatch = (channel, message) => {
            this.io.dispatch(channel, JSON.parse(message));
        };
    }

    /**
     * Start a socket.io server connection.
     * 
     * @param  srv    
     * @param  options
     * 
     * @return {void}       
     */
    startIoConnection(srv, options) {
        options = options || {};
        
        options.presenceAdapter = options.presenceAdapter || this.presenceAdapter;
        
        this.io = this.createIoServer(srv, options);

        this.io.connect();
    }

    /**
     * Start a new redis connection.
     * 
     * @param  options
     * 
     * @return {void}    
     */
    startRedisConnection(options) {
        if (Array.isArray(options)) {
            this.redis = this.createRedisClient(...options);
        } else if (arguments.length > 1) {
            this.redis = this.createRedisClient(...arguments)
        } else {
            this.redis = this.createRedisClient(options);
        }

        this.redis.connect();
    }

    /**
     * Provide the auth secret key.
     * 
     * @return {String}
     */
    authKey() {
        if (arguments.length) {
            this.authkey = arguments[0];
        } else {
            return process.env.AUTH_KEY || this.authkey;
        }
    }

    /**
     * Add a new connection middleware.
     * 
     * @param  {Function} middleware
     * 
     * @return {void}           
     */
    use(middleware) {
        this.middlewares.set(middleware.name, middleware);
    }

    /**
     * Middlewares server connection.
     * 
     * @return {void}
     */
    connectMiddlewares() {
        this.registerDefaultsMiddlewares();

        this.middlewares.forEach(
            middleware => this.io.use(middleware.getInstance(this))
        );
    }

    /**
     * Register defaults middlewares.
     * 
     * @return {void}
     */
    registerDefaultsMiddlewares () {
        for (let middleware of middlewares) {
            if (this.middlewares.has(middleware.name)) {
                continue;
            }

            this.use(middleware);
        }
    }

    /**
     * Set the presence persistance adapter.
     * 
     * @param adapter
     */
    setPresenceAdapter(adapter) {
        this.presenceAdapter = adapter;
    }

    /**
     * Handle new presence subscription.
     * 
     * @param  id     
     * @param  channel
     * @param  socket 
     * @param  status 
     * 
     * @return {void}       
     */
    subscribePresence(id, channel, socket, status) {
        return this.io.subscribePresence(id, channel, socket, status);
    }

    /**
     * Handle presence unsubscribe.
     * 
     * @param  socket 
     * @param  channel
     */
    unsubscribePresence(socket, channel) {
        return this.io.unsubscribePresence(socket, channel);
    }

    /**
     * When client event is emmitted.
     *     
     * @param  socket 
     * @param  message
     * 
     * @return {void}       
     */
    onclientmessage(channel, message) {
        this.io.dispatch(channel, message);
    }

    /**
     * Create a new socket.io server.
     * 
     * @param  srv 
     * @param  options
     * 
     * @return {Io}   
     */
    createIoServer(srv, options) {
        return new Io(srv, options);
    }

    /**
     * Create a new ioredis client.
     * 
     * @param  port
     * @param  host 
     * @param  options
     * 
     * @return {Redis}      
     */
    createRedisClient(...args) {
        return new Redis(...args);
    }
}

module.exports = Manager;
