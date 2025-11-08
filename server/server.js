const express = require('express');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const RoomManager = require('./rooms');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

let colorIndex = 0;

wss.on('connection', (ws) => {
  const userId = uuidv4();
  const userColor = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;

  let currentRoom = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'join':
          currentRoom = message.roomId || 'default';
          const room = roomManager.addUserToRoom(currentRoom, userId, {
            name: message.name || `User ${userId.slice(0, 4)}`,
            color: userColor,
            ws: ws
          });

          ws.send(JSON.stringify({
            type: 'init',
            userId: userId,
            color: userColor,
            users: roomManager.getRoomUsers(currentRoom),
            operations: room.drawingState.getAllOperations()
          }));

          roomManager.broadcastToRoom(currentRoom, {
            type: 'user-joined',
            user: {
              id: userId,
              name: message.name || `User ${userId.slice(0, 4)}`,
              color: userColor
            }
          }, userId);
          break;

        case 'draw-start':
        case 'draw-move':
        case 'draw-end':
          if (currentRoom) {
            const room = roomManager.getRoom(currentRoom);
            let operation = null;

            if (message.type === 'draw-start') {
              operation = room.drawingState.addOperation({
                type: 'stroke',
                userId: userId,
                color: message.color,
                width: message.width,
                tool: message.tool,
                points: [message.point]
              });
            } else if (message.type === 'draw-move') {
              const ops = room.drawingState.getAllOperations();
              operation = ops.find(op =>
                op.userId === userId &&
                !op.completed &&
                !op.undone
              );
              if (operation) {
                operation.points.push(message.point);
              }
            } else if (message.type === 'draw-end') {
              const ops = room.drawingState.getAllOperations();
              operation = ops.find(op =>
                op.userId === userId &&
                !op.completed &&
                !op.undone
              );
              if (operation) {
                operation.completed = true;
              }
            }

            roomManager.broadcastToRoom(currentRoom, {
              type: message.type,
              operation: operation,
              userId: userId,
              point: message.point
            }, userId);
          }
          break;

        case 'cursor-move':
          if (currentRoom) {
            roomManager.broadcastToRoom(currentRoom, {
              type: 'cursor-move',
              userId: userId,
              x: message.x,
              y: message.y
            }, userId);
          }
          break;

        case 'undo':
          if (currentRoom) {
            const room = roomManager.getRoom(currentRoom);
            const operations = room.drawingState.getActiveOperations();

            if (operations.length > 0) {
              const lastOp = operations[operations.length - 1];
              room.drawingState.undoOperation(lastOp.id);

              roomManager.broadcastToRoom(currentRoom, {
                type: 'undo',
                operationId: lastOp.id
              });

              ws.send(JSON.stringify({
                type: 'undo',
                operationId: lastOp.id
              }));
            }
          }
          break;

        case 'redo':
          if (currentRoom) {
            const room = roomManager.getRoom(currentRoom);
            const allOps = room.drawingState.getAllOperations();
            const undoneOps = allOps.filter(op => op.undone);

            if (undoneOps.length > 0) {
              const lastUndone = undoneOps[undoneOps.length - 1];
              room.drawingState.redoOperation(lastUndone.id);

              roomManager.broadcastToRoom(currentRoom, {
                type: 'redo',
                operationId: lastUndone.id
              });

              ws.send(JSON.stringify({
                type: 'redo',
                operationId: lastUndone.id
              }));
            }
          }
          break;

        case 'clear':
          if (currentRoom) {
            const room = roomManager.getRoom(currentRoom);
            room.drawingState.clear();

            roomManager.broadcastToRoom(currentRoom, {
              type: 'clear'
            });

            ws.send(JSON.stringify({
              type: 'clear'
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      roomManager.removeUserFromRoom(currentRoom, userId);
      roomManager.broadcastToRoom(currentRoom, {
        type: 'user-left',
        userId: userId
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
