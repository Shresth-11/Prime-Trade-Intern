import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Serve frontend static files
const publicPath = path.join(process.cwd(), 'src', 'public');
app.use(express.static(publicPath));

// API routes version 1
app.use('/api/v1', apiRouter);

// Fallback for API routes (404)
app.use('/api/v1/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Serve SPA fallback for frontend paths (enables client-side routing if required)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

export default app;
