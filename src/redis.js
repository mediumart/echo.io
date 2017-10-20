const redis = require('ioredis');

class Redis {
    /**
     * Constructor.
     * 
     * @param  port   
     * @param  host   
     * @param  options
     * 
     * @return {void}     
     */
    constructor(...args) {
        this.args = args;
        this.cpattern = '*';
        this.dispatch = (channel, message) => {};
    }

    /**
     * Create a new client connection.
     * 
     * @return {void}
     */
    connect() {
       this.createClient(...this.args).then(() => {
           this.psubscribe();

           this.onpmessage(
                (...args) => this.dispatch(...args.slice(1))
            );
       })
       .catch(() => {});
    }

    /**
     * Subscribe to channel pattern.
     * 
     * @return {void}
     */
    psubscribe() {
        this.client.psubscribe(
            this.cPattern, error => {}
        );
    }

    /**
     * When a message is received from the redis server.
     * 
     * @param  {Function} callback 
     * 
     * @return {void}      
     */
    onpmessage(callback) {
        this.client.on('pmessage', callback);
    }


   /**
    * Create a new sub client connection.
    * 
    * @param  port   
    * @param  host   
    * @param  options
    * 
    * @return {Promise}      
    */
    createClient(port, host, options) {
        options = options || {};

        this.client = new redis(
            port, host, Object.assign(options, {lazyConnect: true})
        );

        return this.client.connect();
    }

    /**
     * Set the channels pattern string.
     * 
     * @param {String} pattern
     */
    set cPattern(pattern) {
        this.cpattern = pattern;
    }

    /**
     * Get the channels pattern string.
     * 
     * @return {String} 
     */
    get cPattern() {
        return this.cpattern;
    }
}

module.exports = Redis;
