const socketIO = require('socket.io');

// Active users with their locations
const activeUsers = new Map();

function setupSocketServer(server) {
  const io = socketIO(server);
  
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // When a user connects and sends their initial data
    socket.on('user_connected', (userData) => {
      const { userId, username, location } = userData;
      
      if (!userId) {
        console.error('User connected without userId');
        return;
      }
      
      // Store user data
      activeUsers.set(userId, {
        socketId: socket.id,
        username: username || 'Anonymous',
        location: location || null,
        lastUpdated: Date.now()
      });
      
      // Broadcast updated active users list to all clients
      broadcastActiveUsers(io);
      
      console.log(`User ${username || 'Anonymous'} (${userId}) connected`);
    });
    
    // When a user updates their location
    socket.on('location_update', (data) => {
      const { userId, latitude, longitude } = data;
      
      if (!userId || !activeUsers.has(userId)) {
        console.error('Location update for unknown user:', userId);
        return;
      }
      
      // Update user location
      const userData = activeUsers.get(userId);
      userData.location = { latitude, longitude };
      userData.lastUpdated = Date.now();
      activeUsers.set(userId, userData);
      
      // Broadcast updated user location to all clients
      io.emit('user_location_updated', {
        userId,
        username: userData.username,
        location: userData.location
      });
    });
    
    // When user disconnects
    socket.on('disconnect', () => {
      // Find and remove the disconnected user
      for (const [userId, userData] of activeUsers.entries()) {
        if (userData.socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User ${userData.username} (${userId}) disconnected`);
          
          // Inform all clients that a user has disconnected
          io.emit('user_disconnected', { userId });
          break;
        }
      }
      
      // Broadcast updated active users list
      broadcastActiveUsers(io);
    });
  });
  
  // Set up periodic cleanup of inactive users (5 minutes timeout)
  setInterval(() => {
    const now = Date.now();
    const timeoutThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [userId, userData] of activeUsers.entries()) {
      if (now - userData.lastUpdated > timeoutThreshold) {
        activeUsers.delete(userId);
        console.log(`User ${userData.username} (${userId}) removed due to inactivity`);
        
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
  const usersArray = [];
  
  for (const [userId, userData] of activeUsers.entries()) {
    usersArray.push({
      userId,
      username: userData.username,
      location: userData.location
    });
  }
  
  io.emit('active_users', usersArray);
}

module.exports = setupSocketServer; 