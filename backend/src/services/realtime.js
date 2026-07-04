function setupRealtimeHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Join personal room for direct notifications (robot income, etc.)
    socket.on('player:auth', ({ playerId }) => {
      socket.join(`player:${playerId}`);
    });

    socket.on('player:join-zone', ({ zone, playerId }) => {
      socket.join(`zone:${zone}`);
      socket.to(`zone:${zone}`).emit('player:entered', { playerId });
    });

    socket.on('player:move', ({ zone, playerId, position }) => {
      socket.to(`zone:${zone}`).emit('player:moved', { playerId, position });
    });

    socket.on('player:collect', ({ zone, resourceId, quantity }) => {
      socket.to(`zone:${zone}`).emit('resource:collected', { resourceId, quantity });
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupRealtimeHandlers };
