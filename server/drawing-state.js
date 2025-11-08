class DrawingState {
  constructor() {
    this.operations = [];
    this.operationCounter = 0;
  }

  addOperation(operation) {
    const op = {
      ...operation,
      id: this.operationCounter++,
      timestamp: Date.now()
    };
    this.operations.push(op);
    return op;
  }

  undoOperation(operationId) {
    const operation = this.operations.find(op => op.id === operationId);
    if (operation) {
      operation.undone = true;
      return operation;
    }
    return null;
  }

  redoOperation(operationId) {
    const operation = this.operations.find(op => op.id === operationId);
    if (operation) {
      operation.undone = false;
      return operation;
    }
    return null;
  }

  getActiveOperations() {
    return this.operations.filter(op => !op.undone);
  }

  getAllOperations() {
    return this.operations;
  }

  clear() {
    this.operations = [];
    this.operationCounter = 0;
  }
}

module.exports = DrawingState;
