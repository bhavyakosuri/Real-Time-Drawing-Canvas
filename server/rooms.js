const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        drawingState: new DrawingState(),
        createdAt: Date.now()
      });
    }
    return this.rooms.get(roomId);
  }

  addUserToRoom(roomId, userId, userData) {
    const room = this.getOrCreateRoom(roomId);
    room.users.set(userId, {
      id: userId,
      ...userData,
      joinedAt: Date.now()
    });
    return room;
  }

  removeUserFromRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(userId);
      if (room.users.size === 0) {
        setTimeout(() => {
          if (room.users.size === 0) {
            this.rooms.delete(roomId);
          }
        }, 60000);
      }
    }
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  broadcastToRoom(roomId, message, excludeUserId = null) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.forEach((user) => {
        if (user.id !== excludeUserId && user.ws && user.ws.readyState === 1) {
          user.ws.send(JSON.stringify(message));
        }
      });
    }
  }
}

module.exports = RoomManager;
