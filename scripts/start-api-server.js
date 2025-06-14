/**
 * API Server Launcher
 * Starts the Express API server for local development
 */

import { createServer } from 'http';
import app from '../src/server.js';

const PORT = process.env.PORT || 3001;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Make sure to run "bun dev" for the React app separately');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing API server');
  server.close(() => {
    console.log('API server closed');
  });
});
