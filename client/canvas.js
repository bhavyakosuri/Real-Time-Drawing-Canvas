class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });

    this.isDrawing = false;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.brushSize = 3;

    this.currentStroke = null;
    this.operations = new Map();
    this.undoneOperations = new Set();

    this.lastPoint = null;

    this.setupCanvas();
    this.setupEventListeners();
  }

  setupCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.min(rect.width - 40, 1600);
    this.canvas.height = Math.min(rect.height - 40, 900);

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.handleResize());

    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(this.touchToMouseEvent(touch));
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(this.touchToMouseEvent(touch));
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopDrawing();
    });
  }

  handleResize() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;

    this.setupCanvas();

    if (oldWidth > 0 && oldHeight > 0) {
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  touchToMouseEvent(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {}
    };
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.lastPoint = pos;

    if (this.onDrawStart) {
      this.onDrawStart(pos);
    }
  }

  draw(e) {
    const pos = this.getMousePos(e);

    if (this.onCursorMove) {
      this.onCursorMove(pos);
    }

    if (!this.isDrawing) return;

    if (this.lastPoint) {
      this.drawLine(this.lastPoint, pos, this.currentColor, this.brushSize, this.currentTool);
    }

    this.lastPoint = pos;

    if (this.onDrawMove) {
      this.onDrawMove(pos);
    }
  }

  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.lastPoint = null;

    if (this.onDrawEnd) {
      this.onDrawEnd();
    }
  }

  drawLine(from, to, color, width, tool = 'brush') {
    this.ctx.save();

    if (tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();

    this.ctx.restore();
  }

  addOperation(operation) {
    this.operations.set(operation.id, operation);
    this.undoneOperations.delete(operation.id);
  }

  drawOperation(operation) {
    if (!operation.points || operation.points.length < 2) return;

    for (let i = 1; i < operation.points.length; i++) {
      this.drawLine(
        operation.points[i - 1],
        operation.points[i],
        operation.color,
        operation.width,
        operation.tool
      );
    }
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sortedOps = Array.from(this.operations.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const op of sortedOps) {
      if (!this.undoneOperations.has(op.id) && op.points && op.points.length > 0) {
        this.drawOperation(op);
      }
    }
  }

  undoOperation(operationId) {
    this.undoneOperations.add(operationId);
    this.redrawCanvas();
  }

  redoOperation(operationId) {
    this.undoneOperations.delete(operationId);
    this.redrawCanvas();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.operations.clear();
    this.undoneOperations.clear();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setBrushSize(size) {
    this.brushSize = size;
  }

  loadOperations(operations) {
    this.operations.clear();
    this.undoneOperations.clear();

    for (const op of operations) {
      this.operations.set(op.id, op);
      if (op.undone) {
        this.undoneOperations.add(op.id);
      }
    }

    this.redrawCanvas();
  }
}
