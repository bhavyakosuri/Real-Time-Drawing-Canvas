class WebSocketClient {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.userColor = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;

    this.messageHandlers = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.updateConnectionStatus(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.updateConnectionStatus(false);
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.updateConnectionStatus(false);
          this.attemptReconnect();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatusText('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    this.updateStatusText(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        console.log('Reconnect failed');
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  joinRoom(name, roomId) {
    this.send({
      type: 'join',
      name: name,
      roomId: roomId || 'default'
    });
  }

  sendDrawStart(point) {
    this.send({
      type: 'draw-start',
      point: point,
      color: this.currentColor,
      width: this.currentWidth,
      tool: this.currentTool
    });
  }

  sendDrawMove(point) {
    this.send({
      type: 'draw-move',
      point: point
    });
  }

  sendDrawEnd() {
    this.send({
      type: 'draw-end'
    });
  }

  sendCursorMove(x, y) {
    if (!this.lastCursorSend || Date.now() - this.lastCursorSend > 50) {
      this.send({
        type: 'cursor-move',
        x: x,
        y: y
      });
      this.lastCursorSend = Date.now();
    }
  }

  sendUndo() {
    this.send({
      type: 'undo'
    });
  }

  sendRedo() {
    this.send({
      type: 'redo'
    });
  }

  sendClear() {
    this.send({
      type: 'clear'
    });
  }

  updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');

    if (connected) {
      indicator.classList.add('connected');
      statusText.textContent = 'Connected';
    } else {
      indicator.classList.remove('connected');
      statusText.textContent = 'Disconnected';
    }
  }

  updateStatusText(text) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = text;
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
