const verify = require('../auth/jwt-verify.js');

class Subscribe {
    /**
     * Constructor.
     *     
     * @param  server
     */
    constructor(server) {
        this.server = server;
    }

    /**
     * Get an instance of the class.
     *
     * @param  server
     * 
     * @return {OnSubscribe} 
     */
    static getInstance(server) {
        return new Subscribe(server);
    }

    /**
     * Middleware handler.
     * 
     * @param  socket
     * @param  next
     */
    handle(socket, next) {
        this.addListeners(socket);

        return next();
    }

    /**
     * Add a new socket event listener.
     * 
     * @param socket
     */
    addListeners(socket) {
        socket.on('unsubscribe', 
            ({ channel }) => this.unsubscribe(socket, channel)
        );

        socket.on('subscribe', 
            ({ channel, key, status }) => this.subscribe(socket, channel, key, status)
        );
    }

    /**
     * On unsubscribe callback handler.
     * 
     * @param  socket 
     * @param  channel
     *  
     * @return {void}       
     */
    unsubscribe(socket, channel) {
        if ('presence' === this.scope(channel)) {
            this.server.unsubscribePresence(socket, channel);
        } else {
            socket.leave(channel);
        }
    }

    /**
     * On subscribe callback handler.
     * 
     * @param  socket 
     * @param  channel
     * @param  key    
     * @param  status
     *  
     * @return {void}       
     */
    subscribe(socket, channel, key, status) {
        let scope = this.scope(channel);

        if (scope && (key || status)) {
            this.handleScopedSubscription(scope, socket, channel, key, status);
        } else if (null == scope) {
            this.handleSubscription(socket, channel);
        }      
    }

    /**
     * Handle subcription for a private or presence channel.
     * 
     * @param  scope 
     * @param  socket 
     * @param  channel
     * @param  key    
     * @param  status
     *  
     * @return {void}     
     */
    handleScopedSubscription(scope, socket, channel, key, status) {
        status  = this.verify(key || status, channel);

        if (status) {
            return this[`on${scope}subscription`](
                socket, channel, status.channel_data
            );
        } 

        // handle failed verify
    }

    /**
     * Add a socket to a channel room.
     * 
     * @param  socket 
     * @param  channel
     *   
     * @return {void}       
     */
    handleSubscription(socket, channel) {
        socket.join(channel);
    }

    /**
     * handle presence subscription.
     * 
     * @param  socket 
     * @param  channel
     * @param  status
     *  
     * @return {void}        
     */
    onpresencesubscription(socket, channel, status) {
        if (status && 'object' === typeof status) {
            this.server.subscribePresence(
                status.user_id, channel, socket, { user_info: status.user_info }
            );
        }
    }   

    /**
     * handle private subscription.
     * 
     * @param  socket 
     * @param  channel
     * @param  status
     *  
     * @return {void}        
     */
    onprivatesubscription(socket, channel) {
        this.handleSubscription(socket, channel);
    }
                
    /**
     * Json web token based authentication.
     * 
     * @param  token  
     * @param  channel
     * 
     * @return {Boolean|Object}       
     */
    verify(token, channel) {
        if (! (token = this.token(token))) {
            return false;
        }

        // JWT authentication.
        let status = verify(token, this.server.authKey());

        // The channel should also match.
        if (status && (status.channel_name === channel)) {
            return status;
        }

        return false;
    }

    /**
     * Extract token string from data.
     * 
     * @param  data
     * 
     * @return {String|undefined}     
     */
    token(data) {
        if (typeof data === 'object') {
            data =  data.key || data.token;
        } 

        if (typeof data === 'string' && data.length) {
            return data;
        }
    }

    /**
     * If the channel name starts with 'private-' or 'presence-'.
     * 
     * @param  channel
     * 
     * @return {string|null}        
     */
    scope(channel) {
        return (/^(private|presence)-.+/.exec(channel) || { 1:null })[1];
    }
}

module.exports = Subscribe;
