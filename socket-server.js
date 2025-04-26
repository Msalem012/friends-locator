const socketIO = require('socket.io');

// Active users with their locations
const activeUsers = new Map();

function setupSocketServer(server) {
    const io = socketIO(server, {
        pingTimeout: 60000, // Increase ping timeout to 60 seconds
        pingInterval: 25000 // Set ping interval to 25 seconds
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);
        let associatedUserId = null;

        // When a user connects and sends their initial data
        socket.on('user_connected', (userData) => {
            const { userId, username, location } = userData;

            if (!userId) {
                console.error('User connected without userId');
                return;
            }


            // Store associated userId for this socket
            associatedUserId = userId;

            activeUsers
            // Check if user already exists (might be a reconnect)
            const existingUser = activeUsers.get(userId);
            if (existingUser) {
                // Update socket ID for existing user
                existingUser.socketId = socket.id;
                existingUser.lastUpdated = Date.now();
                activeUsers.set(userId, existingUser);
                console.log(`User ${username || 'Anonymous'} (${userId}) reconnected`);
            } else {
                // Store new user data
                activeUsers.set(userId, {
                    socketId: socket.id,
                    username: username || 'Anonymous',
                    location: location || null,
                    lastUpdated: Date.now(),
                    connectionTime: Date.now()
                });
                console.log(`User ${username || 'Anonymous'} (${userId}) connected`);
            }
            socket.join(`user_${userId}`);
            // Broadcast updated active users list to all clients
            broadcastActiveUsers(io);
        });

        // Handle user ping to keep them active
        socket.on('user_ping', (data) => {
            const { userId } = data;

            if (!userId || !activeUsers.has(userId)) {
                return;
            }

            // Update last updated timestamp
            const userData = activeUsers.get(userId);
            userData.lastUpdated = Date.now();
            activeUsers.set(userId, userData);
        });

        // When a user updates their location
        socket.on('location_update', (data) => {
            const { userId, latitude, longitude, timestamp } = data;
            console.log('location update', userId, latitude, longitude)
            if (!userId || !activeUsers.has(userId)) {
                console.error('Location update for unknown user:', userId);
                return;
            }

            // Update user location
            const userData = activeUsers.get(userId);
            userData.location = { latitude, longitude };
            userData.lastUpdated = timestamp || Date.now();
            activeUsers.set(userId, userData);

            // Broadcast updated user location to all clients
            io.emit('user_location_updated', {
                targetId: userId,
                username: userData.username,
                location: userData.location
            });
        });

        //

        // Handle explicit user disconnection (browser closing/navigating away)
        socket.on('user_disconnecting', (data) => {
            const { userId, lastLatitude, lastLongitude } = data;

            if (userId && activeUsers.has(userId)) {
                // Update last known location before disconnect, if provided
                if (lastLatitude && lastLongitude) {
                    const userData = activeUsers.get(userId);
                    userData.location = { latitude: lastLatitude, longitude: lastLongitude };
                    userData.lastUpdated = Date.now();
                    userData.disconnecting = true; // Mark as explicitly disconnecting
                    activeUsers.set(userId, userData);

                    // Don't remove the user immediately, let the inactivity timer handle it
                    console.log(`User ${userData.username} (${userId}) sent disconnect signal, keeping location for a while`);
                }
            }
        });

        //handle query to track another user
        socket.on('send_user_track', (data) => {
            const { targetId, userId } = data;
            console.log(`Attempting to get from user: ${targetId}`);
            io.to(`user_${targetId}`).emit('send_track', userId);
        });

        socket.on('get_user_track', (data) => {
            const { targetId, markId, locationHistory } = data;
            console.log(`Attempting to send to user: ${targetId}`);
            io.to(`user_${targetId}`).emit('get_track', {markId, locationHistory});
        });

        // Add handler for requesting active users
        socket.on('request_active_users', () => {
            console.log(`User requested active users list`);
            // Send active users to the requesting client only
            socket.emit('active_users', getActiveUsersArray());
        });

        // When user disconnects
        socket.on('disconnect', () => {
            // If we stored the userId for this socket, use it
            if (associatedUserId && activeUsers.has(associatedUserId)) {
                const userData = activeUsers.get(associatedUserId);

                // Only delete if user has explicitly disconnected
                // Otherwise, keep them in the list for reconnection
                if (userData.disconnecting) {
                    activeUsers.delete(associatedUserId);
                    console.log(`User ${userData.username} (${associatedUserId}) disconnected and removed`);

                    // Inform all clients that a user has disconnected
                    io.emit('user_disconnected', { userId: associatedUserId });
                } else {
                    console.log(`User ${userData.username} (${associatedUserId}) socket disconnected, keeping user active for possible reconnect`);
                    // Mark socket as disconnected but keep the user data
                    userData.socketConnected = false;
                    userData.lastDisconnect = Date.now();
                    activeUsers.set(associatedUserId, userData);
                }
            } else {
                // If we don't have the userId, use the old method
                for (const [userId, userData] of activeUsers.entries()) {
                    if (userData.socketId === socket.id) {
                        // Instead of deleting right away, mark as disconnected
                        userData.socketConnected = false;
                        userData.lastDisconnect = Date.now();
                        activeUsers.set(userId, userData);
                        console.log(`User ${userData.username} (${userId}) socket disconnected, keeping user active for possible reconnect`);
                        break;
                    }
                }
            }
            // Broadcast updated active users list
            broadcastActiveUsers(io);
        });
    });

    // Set up periodic cleanup of inactive users (15 minutes timeout)
    setInterval(() => {
        const now = Date.now();
        const timeoutThreshold = 15 * 60 * 1000; // 15 minutes
        const shortTimeoutThreshold = 2 * 60 * 1000; // 2 minutes for explicitly disconnecting users

        for (const [userId, userData] of activeUsers.entries()) {
            // Use shorter timeout for users that explicitly disconnected
            const threshold = userData.disconnecting ? shortTimeoutThreshold : timeoutThreshold;

            if (now - userData.lastUpdated > threshold) {
                activeUsers.delete(userId);
                console.log(`User ${userData.username} (${userId}) removed due to inactivity after ${threshold / 60000} minutes`);

                // Inform all clients that a user has been removed
                io.emit('user_disconnected', { userId });
            }
        }

        // Broadcast updated active users list if any users were removed
        broadcastActiveUsers(io);
    }, 60000); // Check every minute

    return io;
}

// Helper function to broadcast the list of active users
function broadcastActiveUsers(io) {
    const usersArray = getActiveUsersArray();
    io.emit('active_users', usersArray);
}

// Helper function to get active users array
function getActiveUsersArray() {
    const usersArray = [];

    for (const [userId, userData] of activeUsers.entries()) {
        usersArray.push({
            userId,
            username: userData.username,
            location: userData.location,
            // Include additional status info that might be useful for clients
            active: (Date.now() - userData.lastUpdated) < 5 * 60 * 1000,
        });
    }

    return usersArray;
}

module.exports = setupSocketServer; 