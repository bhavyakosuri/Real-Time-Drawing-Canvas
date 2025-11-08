# Deployment Guide

## Quick Start (Local)

```bash
npm install
npm start
```

Open `http://localhost:3000` in multiple browser windows to test.

## Heroku Deployment

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create a new Heroku app:
```bash
heroku create your-app-name
```

3. Add a Procfile:
```bash
echo "web: node server/server.js" > Procfile
```

4. Set the PORT environment variable (Heroku does this automatically)

5. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

6. Open your app:
```bash
heroku open
```

## Render Deployment

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server/server.js`
5. Deploy

## Vercel/Netlify Deployment

These platforms are designed for static sites. For WebSocket support, you'll need to:

1. Deploy the frontend to Vercel/Netlify
2. Deploy the backend separately to Heroku/Render
3. Update WebSocket URL in `client/websocket.js`:

```javascript
const wsUrl = `wss://your-backend-url.herokuapp.com`;
```

## Railway Deployment

1. Install Railway CLI:
```bash
npm i -g @railway/cli
railway login
```

2. Initialize project:
```bash
railway init
```

3. Deploy:
```bash
railway up
```

## Environment Variables

No environment variables required for basic setup. The server automatically detects PORT from hosting provider.

## Testing the Deployment

1. Open the deployed URL in multiple browsers/windows
2. Enter different names for each user
3. Start drawing and verify:
   - Real-time synchronization works
   - Undo/redo affects all users
   - User list updates correctly
   - Cursor tracking is visible

## Troubleshooting

### WebSocket connection fails

Check that your hosting provider supports WebSocket connections. Most modern platforms do, but some require configuration.

### Cannot connect to server

Verify the WebSocket URL matches your deployment URL. Check browser console for errors.

### Heroku H15 Error (Idle Connection)

Heroku may timeout WebSocket connections after 55 seconds of inactivity. Implement a ping/pong heartbeat if needed.

## Production Recommendations

1. Add CORS configuration for security
2. Implement rate limiting
3. Add user authentication
4. Enable HTTPS (most platforms do this automatically)
5. Monitor WebSocket connection limits
6. Consider Redis for multi-instance deployments

## Performance Tips

- Host close to your users for low latency
- Use CDN for static assets if separated from backend
- Monitor memory usage with long-running sessions
- Implement operation pruning for very long sessions
