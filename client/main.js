let canvasManager;
let wsClient;
let currentUsers = new Map();
let remoteCursors = new Map();

function initializeApp() {
  showJoinModal();
}

function showJoinModal() {
  const modal = document.getElementById('joinModal');
  const form = document.getElementById('joinForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('userName').value.trim();
    const roomId = document.getElementById('roomId').value.trim() || 'default';

    if (name) {
      modal.style.display = 'none';
      await startCollaborativeCanvas(name, roomId);
    }
  });
}

async function startCollaborativeCanvas(userName, roomId) {
  canvasManager = new CanvasManager('canvas');
  wsClient = new WebSocketClient();

  setupCanvasCallbacks();
  setupWebSocketHandlers();
  setupUIControls();
  setupKeyboardShortcuts();

  try {
    await wsClient.connect();
    wsClient.joinRoom(userName, roomId);

    document.getElementById('roomName').textContent = `Room: ${roomId}`;
  } catch (error) {
    console.error('Failed to connect:', error);
    alert('Failed to connect to server. Please refresh and try again.');
  }
}

function setupCanvasCallbacks() {
  canvasManager.onDrawStart = (point) => {
    wsClient.currentColor = canvasManager.currentColor;
    wsClient.currentWidth = canvasManager.brushSize;
    wsClient.currentTool = canvasManager.currentTool;
    wsClient.sendDrawStart(point);
  };

  canvasManager.onDrawMove = (point) => {
    wsClient.sendDrawMove(point);
  };

  canvasManager.onDrawEnd = () => {
    wsClient.sendDrawEnd();
  };

  canvasManager.onCursorMove = (pos) => {
    updateCursorPosition(pos);
    wsClient.sendCursorMove(pos.x, pos.y);
  };
}

function setupWebSocketHandlers() {
  wsClient.on('init', (message) => {
    wsClient.userId = message.userId;
    wsClient.userColor = message.color;

    currentUsers.clear();
    message.users.forEach(user => {
      currentUsers.set(user.id, user);
    });
    updateUsersList();

    if (message.operations && message.operations.length > 0) {
      canvasManager.loadOperations(message.operations);
    }
  });

  wsClient.on('user-joined', (message) => {
    currentUsers.set(message.user.id, message.user);
    updateUsersList();
  });

  wsClient.on('user-left', (message) => {
    currentUsers.delete(message.userId);
    updateUsersList();
    removeRemoteCursor(message.userId);
  });

  wsClient.on('draw-start', (message) => {
    if (message.userId !== wsClient.userId && message.operation) {
      canvasManager.addOperation(message.operation);
    }
  });

  wsClient.on('draw-move', (message) => {
    if (message.userId !== wsClient.userId && message.operation) {
      const points = message.operation.points;
      if (points.length >= 2) {
        const from = points[points.length - 2];
        const to = points[points.length - 1];
        canvasManager.drawLine(
          from,
          to,
          message.operation.color,
          message.operation.width,
          message.operation.tool
        );
      }
    }
  });

  wsClient.on('draw-end', (message) => {
    if (message.userId !== wsClient.userId && message.operation) {
      canvasManager.addOperation(message.operation);
    }
  });

  wsClient.on('cursor-move', (message) => {
    if (message.userId !== wsClient.userId) {
      updateRemoteCursor(message.userId, message.x, message.y);
    }
  });

  wsClient.on('undo', (message) => {
    canvasManager.undoOperation(message.operationId);
  });

  wsClient.on('redo', (message) => {
    canvasManager.redoOperation(message.operationId);
  });

  wsClient.on('clear', () => {
    canvasManager.clearCanvas();
  });

  wsClient.on('error', (message) => {
    console.error('Server error:', message.message);
  });
}

function setupUIControls() {
  const brushTool = document.getElementById('brushTool');
  const eraserTool = document.getElementById('eraserTool');
  const colorPicker = document.getElementById('colorPicker');
  const brushSize = document.getElementById('brushSize');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearBtn = document.getElementById('clearBtn');

  brushTool.addEventListener('click', () => {
    setActiveTool('brush');
    canvasManager.setTool('brush');
  });

  eraserTool.addEventListener('click', () => {
    setActiveTool('eraser');
    canvasManager.setTool('eraser');
  });

  colorPicker.addEventListener('input', (e) => {
    canvasManager.setColor(e.target.value);
  });

  brushSize.addEventListener('input', (e) => {
    const size = parseInt(e.target.value);
    brushSizeValue.textContent = size;
    canvasManager.setBrushSize(size);
  });

  undoBtn.addEventListener('click', () => {
    wsClient.sendUndo();
  });

  redoBtn.addEventListener('click', () => {
    wsClient.sendRedo();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear the entire canvas for all users?')) {
      wsClient.sendClear();
    }
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B') {
      setActiveTool('brush');
      canvasManager.setTool('brush');
    } else if (e.key === 'e' || e.key === 'E') {
      setActiveTool('eraser');
      canvasManager.setTool('eraser');
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          wsClient.sendRedo();
        } else {
          wsClient.sendUndo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        wsClient.sendRedo();
      }
    }
  });
}

function setActiveTool(tool) {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const toolBtn = document.querySelector(`[data-tool="${tool}"]`);
  if (toolBtn) {
    toolBtn.classList.add('active');
  }
}

function updateUsersList() {
  const usersList = document.getElementById('usersList');
  const userCount = document.getElementById('userCount');

  usersList.innerHTML = '';
  userCount.textContent = currentUsers.size;

  currentUsers.forEach(user => {
    const badge = document.createElement('div');
    badge.className = 'user-badge';
    badge.style.backgroundColor = user.color;
    badge.textContent = user.name.charAt(0).toUpperCase();
    badge.setAttribute('data-name', user.name);
    usersList.appendChild(badge);
  });
}

function updateRemoteCursor(userId, x, y) {
  const cursorsContainer = document.getElementById('cursors');
  const canvasRect = canvasManager.canvas.getBoundingClientRect();

  const screenX = (x / canvasManager.canvas.width) * canvasRect.width + canvasRect.left;
  const screenY = (y / canvasManager.canvas.height) * canvasRect.height + canvasRect.top;

  let cursor = remoteCursors.get(userId);

  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'remote-cursor';

    const pointer = document.createElement('div');
    pointer.className = 'cursor-pointer';
    cursor.appendChild(pointer);

    const label = document.createElement('div');
    label.className = 'cursor-label';
    cursor.appendChild(label);

    cursorsContainer.appendChild(cursor);
    remoteCursors.set(userId, cursor);
  }

  const user = currentUsers.get(userId);
  if (user) {
    cursor.style.color = user.color;
    const label = cursor.querySelector('.cursor-label');
    label.textContent = user.name;
  }

  cursor.style.left = `${screenX}px`;
  cursor.style.top = `${screenY}px`;

  if (cursor.hideTimeout) {
    clearTimeout(cursor.hideTimeout);
  }

  cursor.style.display = 'block';
  cursor.hideTimeout = setTimeout(() => {
    cursor.style.display = 'none';
  }, 3000);
}

function removeRemoteCursor(userId) {
  const cursor = remoteCursors.get(userId);
  if (cursor) {
    cursor.remove();
    remoteCursors.delete(userId);
  }
}

function updateCursorPosition(pos) {
  const cursorPosition = document.getElementById('cursorPosition');
  cursorPosition.textContent = `x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`;
}

window.addEventListener('beforeunload', () => {
  if (wsClient) {
    wsClient.close();
  }
});

document.addEventListener('DOMContentLoaded', initializeApp);
