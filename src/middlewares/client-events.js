class ClientEvents {
    constructor(server) {
        this.server = server;
    }

    /**
     * Get an instance of the class.
     * 
     * @return {ClientEvents} 
     */
    static getInstance(server) {
        return new ClientEvents(server);
    }

    /**
     * Middleware handler.
     * 
     * @param  socket
     * @param  next
     */
    handle(socket, next) {
        this.addListener(socket);

        return next();
    }

    /**
     * Add a new socket event listener.
     * 
     * @param socket
     */
    addListener(socket) {
        socket.on('client event', 
            (message) => this.onclientmessage(socket, message)
        );
    }

    /**
     * When client event is emmitted.
     *     
     * @param  socket 
     * @param  message
     * 
     * @return {void}       
     */
    onclientmessage(socket, { channel, event, data }) {
        if (socket.rooms && socket.rooms[channel]) {
            this.server.onclientmessage(channel, { socket, event, data: { channel, data } });
        }
    }
}

module.exports = ClientEvents;