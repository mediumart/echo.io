class Adapter {
    constructor() {
        this.presences = new Map();
        this.connections = new Map();
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
        socket.join(channel, () => {
            let index = `${userId}-${channel}`;

            if (! this.presences.has(index)) {
                this.presences.set(
                    index, { userId, status, channel, connections: 0 } 
                );

                this.io.dispatchJoining(channel, socket, status);
            }

            // we need to keep track of the presence's 
            // multiple sockets connections.
            this.connections.set(socket.id, index);

            this.presences.get(index).connections += 1;

            this.io.dispatchSubscribed(
                channel, socket.id, this.channelStatuses(channel, userId)
            );
        });
    }

    /**
     * Handle presence unsubscribe.
     * 
     * @param  socket 
     * @param  channel
     */
    unsubscribePresence(socket, channel) {
        // get socket presence index 
        let index = this.connections.get(socket.id);

        // get all sockets related to the presence index.
        let socketsIds = this.getConnections(index);

        // all sockets leaves channel
        socketsIds.forEach(id => { 
            this.connections.delete(id);

            let socket = this.io.sockets.connected[id];

            if (socket) socket.leave(channel) ;
        });

        this.io.dispatchLeaving(
            channel, null, this.presences.get(index).status
        );

        this.presences.delete(index);
    }

    /**
     * Handle socket disconnect event.
     * 
     * @param  socket
     * @param  reason 
     */
    ondisconnecting(socket) {
        let index;

        if ((index = this.connections.get(socket.id))) {
            let presence = this.presences.get(index);

            presence.connections -= 1;

            if (presence.connections > 0) {
                this.connections.delete(socket.id);
            } else {
                this.unsubscribePresence(socket, presence.channel);
            }
        }
    }

    /**
     * Get channel presences statuses.
     * 
     * @param  userId     
     * @param  channel
     * 
     * @return {Array}       
     */
    channelStatuses(channel, userId) {
        let statuses = [];

        for (let key of this.presences.keys()) {
            if (key.includes(channel) && key.indexOf(userId) !== 0) {
                statuses.push(this.presences.get(key).status);
            }    
        }

        return statuses;
    }

    /**
     * Get all sockets connections for a given presence.
     * 
     * @param  pIndex
     * 
     * @return {Array}      
     */
    getConnections(pIndex) {
        return Array.from(this.connections.keys).filter(
            socketId => this.connections.get(socketId) === pIndex
        );
    }
}

module.exports = Adapter;