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
            // presence index
            let index = `${userId}-${channel}`;

            if (! this.presences.has(index)) {
                this.presences.set(
                    index, { userId, status, channel, connections: 0 } 
                );

                this.io.dispatchJoining(channel, socket, status);
            }

            // we need to keep track of the presence's 
            // multiple sockets connections.
            if (! this.connections.has(socket.id)) {
                this.connections.set(socket.id, [index]);
            } else {
                this.connections.get(socket.id).push(index);
            }

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
        // get presence index 
        let index = this.connections.get(socket.id).find(
            i => i.includes(channel)
        );

        // get all sockets related to the presence index.
        let socketsIds = this.getPresenceSocketsIds(index);

        // all related sockets should be processed first
        socketsIds.forEach(id => { 
            // remove any socket/presence relation reference.
            let position = this.connections.get(id).indexOf(index);

            if (position > -1) {
                this.connections.get(id).splice(position, 1);
            }

            // purge connections map
            if (! this.connections.get(id).length) {
                this.connections.delete(id);
            }

            // destroy socket/channel binding
            let socket = this.io.sockets.connected[id];

            if (socket) socket.leave(channel);
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
        let indexes;

        if ((indexes = this.connections.get(socket.id))) {
            // all related presences should be processed first
            indexes.forEach(index => {
                let presence = this.presences.get(index);

                presence.connections -= 1;

                if (presence.connections <= 0) {
                    this.unsubscribePresence(socket, presence.channel);
                } 
            });
            
            this.connections.delete(socket.id);
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
    getPresenceSocketsIds(pIndex) {
        return Array.from(this.connections.keys).filter(
            socketId => this.connections.get(socketId).includes(pIndex)
        );
    }
}

module.exports = Adapter;