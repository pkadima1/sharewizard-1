/**
 * Express server to handle API routes
 * This can be run in development or as a serverless function
 */

import express from 'express';
import cors from 'cors';
import adminRoutes from './api/adminRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: true,  // Allow all origins or specify your domain
  credentials: true,  // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start the server if we're not importing it elsewhere
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

export default app;
