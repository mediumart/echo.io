const io = require('socket.io');
const Adapter = require('./adapter');

class Io {
    /**
     * Constructor.
     * 
     * @param  srv    
     * @param  options
     * @return {void}   
     */
    constructor(srv, options) {
        this.srv = srv;
        this.options = options || {};
    }

    /**
     * Start listening for client connections.
     * 
     * @return {void}
     */
    connect() {
        this.srv = this.srv || this.options.port || 6001;

        this.io = io(this.srv, this.options);

        this.io.use(
            (socket, next) => this.onconnect(socket, next)
        );

        this.adapter = this.options.presenceAdapter || new Adapter();

        this.adapter.io = this;
    }

    /**
     * Handle incoming socket connection.
     * 
     * @param  socket
     * @param  next
     * 
     * @return {Function}     
     */
    onconnect(socket, next) {
        socket.on('disconnecting', 
            reason => this.ondisconnecting(socket, reason)
        );

        socket.on('disconnect', 
            reason => this.ondisconnect(socket, reason)
        );

        socket.on('error', 
            error => this.onerror(socket, error)
        );
        
        return next();
    }

    /**
     * Handle socket disconnecting event.
     * 
     * @param  socket
     * @param  reason  
     */
    ondisconnecting(socket, reason) {
        this.adapter.ondisconnecting(socket);
    }

    /**
     * Handle socket disconnect event.
     * 
     * @param  socket
     * @param  reason 
     */
    ondisconnect(socket, reason) {
        //
    }

    /**
     * Handle socket error event.
     * 
     * @param  socket
     * @param  error      
     */
    onerror(socket, error) {
        //
    }

    /**
     * Register a middleware for every incoming socket.
     * 
     * @param  {Function} middleware 
     */
    use(middleware) {
        this.io.use(
            (socket, next) => middleware.handle(socket, next)
        );
    }

    /**
     * Dispatch the message.
     * 
     * @param  channel
     * @param  message
     * 
     * @return {Object|undefined}   
     */
    dispatch(channel, { event, socket, data, room }) {
        let dispatcher = this.dispatcher(socket, room || channel);

        if (null !== dispatcher) {
            return dispatcher.emit(event, channel, data);
        }
    }

    /**
     * Notify others peers of the new presence.
     * 
     * @param  channel
     * @param  socket 
     * @param  data 
     * 
     * @return {mixed}       
     */
    dispatchJoining(channel, socket, data) {
        return this.dispatch(channel, { event: 'presence:joining', socket, data });
    }

    /**
     * Notify client of others peers presence.
     * 
     * @param  channel
     * @param  room 
     * @param  data 
     * 
     * @return {mixed}      
     */
    dispatchSubscribed(channel, room, data) {
        return this.dispatch(channel, { event: 'presence:subscribed', room, data });
    }

    /**
     * Notify others peers of the presence leaving.
     * 
     * @param  channel
     * @param  socket 
     * @param  data 
     * 
     * @return {mixed}       
     */
    dispatchLeaving(channel, socket, data) {
        return this.dispatch(channel, { event: 'presence:leaving', socket, data });
    }

    /**
     * Get the proper dispatcher for the message.
     * 
     * @param  socket 
     * @param  channel
     * 
     * @return {Object|null}       
     */
    dispatcher(socket, channel) {
        if (null == socket) {
            return this.io.to(channel);
        } else if ('object' === typeof socket || (socket = this.io.sockets.connected[socket])) {
            return socket.to(channel);
        } else {
            return null // the message will just be lost.
        }
    }

    /**
     * Handle new presence subscription.
     * 
     * @param  userId     
     * @param  channel
     * @param  socket 
     * @param  status 
     * 
     * @return {void}       
     */
    subscribePresence(userId, channel, socket, status) {
        if (socket.rooms.indexOf(channel) === -1) {
            this.adapter.subscribePresence(userId, channel, socket, status);
        }
    }

    /**
     * Handle presence unsubscribe.
     * 
     * @param  socket 
     * @param  channel
     */
    unsubscribePresence(socket, channel) {
        if (socket.rooms.indexOf(channel) > -1) {
            this.adapter.unsubscribePresence(socket, channel);
        }
    }
}

module.exports = Io;
