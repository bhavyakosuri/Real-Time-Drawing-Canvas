# Real-Time Collaborative Drawing Canvas

A multi-user drawing application where multiple people can draw simultaneously on the same canvas with real-time synchronization.

## Features

- **Real-time Drawing Synchronization**: See other users' drawings as they draw, not after completion
- **Multiple Drawing Tools**: Brush and eraser with adjustable sizes and colors
- **User Presence**: See who's online with color-coded user indicators
- **Live Cursors**: Track where other users are currently drawing
- **Global Undo/Redo**: Undo and redo operations that work across all users
- **Conflict Resolution**: Handles overlapping drawings from multiple users seamlessly
- **Room System**: Multiple isolated canvas rooms for different groups
- **Responsive Design**: Works on desktop and mobile devices with touch support
- **Auto-reconnection**: Automatically reconnects if connection is lost

## Tech Stack

- **Frontend**: Vanilla JavaScript + HTML5 Canvas API
- **Backend**: Node.js + Express + WebSockets (ws library)
- **No frameworks**: Pure DOM manipulation and Canvas operations

## Setup Instructions

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-canvas
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Testing with Multiple Users

1. Open the application in multiple browser windows or tabs
2. Use different browsers or incognito/private windows to simulate different users
3. Enter different names when joining to distinguish between users
4. Start drawing and observe real-time synchronization

**Tip**: For best testing experience, use:
- Chrome + Firefox
- Regular window + Incognito window
- Different devices on the same network

## How to Use

### Drawing Tools

- **Brush (B)**: Standard drawing tool
- **Eraser (E)**: Erase parts of the drawing
- **Color Picker**: Choose your drawing color
- **Size Slider**: Adjust brush/eraser size (1-50px)

### Actions

- **Undo (Ctrl+Z)**: Undo the last operation (global for all users)
- **Redo (Ctrl+Y / Ctrl+Shift+Z)**: Redo the last undone operation
- **Clear**: Clear the entire canvas (affects all users)

### Keyboard Shortcuts

- `B` - Switch to brush tool
- `E` - Switch to eraser tool
- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo

## Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html          # Main HTML structure
│   ├── style.css           # Styling and responsive design
│   ├── canvas.js           # Canvas drawing logic
│   ├── websocket.js        # WebSocket client implementation
│   └── main.js            # Application initialization and coordination
├── server/
│   ├── server.js          # Express + WebSocket server
│   ├── rooms.js           # Room management system
│   └── drawing-state.js   # Canvas state and operation history
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## Known Limitations & Future Improvements

### Current Limitations

1. **Canvas Size**: Fixed canvas dimensions (optimized for common screen sizes)
2. **Drawing History**: Operations stored in memory only (no persistence)
3. **Scalability**: Tested with up to 10 concurrent users per room
4. **Network Latency**: Noticeable lag on high-latency connections (>200ms)

### Potential Improvements

1. **Persistence**: Save canvas state to database for session recovery
2. **Advanced Tools**: Add shapes (rectangle, circle, line), text, and fill tools
3. **Layers**: Support multiple drawing layers
4. **Export**: Export canvas as PNG/JPG
5. **Performance**: Implement operation batching for high-frequency updates
6. **Authentication**: User accounts and saved drawings
7. **Canvas History**: Scrubbing through drawing timeline

## Performance Notes

- Canvas operations are optimized using efficient path rendering
- Cursor updates are throttled to 20 updates/second to reduce bandwidth
- Drawing operations use incremental rendering (not full redraws)
- Undo/redo requires full canvas redraw for consistency

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Time Spent

Approximately 4-5 hours:
- Server architecture & WebSocket implementation: 1.5 hours
- Canvas drawing logic & optimization: 1.5 hours
- Real-time synchronization & undo/redo: 1 hour
- UI/UX design & responsive layout: 1 hour
- Testing & debugging: 30 minutes

## Deployment

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create collaborative-canvas-app

# Deploy
git push heroku main

# Open app
heroku open
```

### Vercel/Netlify

For static deployment, you'll need to configure the WebSocket server separately or use a serverless WebSocket solution.

## License

MIT

## Author

Built as a technical assignment demonstrating real-time collaborative features, WebSocket implementation, and Canvas API mastery.
