import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';

import logger from './utils/logger.js';
import apiRouter from './routes/index.js';
import { initializeSupabase } from './config/supabase.js';
import { initializeSocketHandlers } from './socket/socketHandlers.js';

const app = express();
const server = createServer(app);

// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://city-mall-assignment-git-main-sangal4s-projects.vercel.app",
      "https://city-mall-assignment.vercel.app"
    ];

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Configure Socket.IO with more detailed options
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 5000,
  allowEIO3: true
});

// Initialize Supabase
initializeSupabase();

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Configure Helmet with WebSocket-friendly settings
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware with WebSocket logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Disaster Response Platform API',
    websocket: io.engine.clientsCount > 0 ? 'Connected' : 'Ready'
  });
});

// API Routes
app.use('/api', apiRouter);

// Make io accessible in routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 Disaster Response Platform server running on port ${PORT}`);
  logger.info(`📡 WebSocket server initialized and ready for connections`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});

// Handle WebSocket server errors
io.on('connect_error', (err) => {
  logger.error(`Socket.IO connection error: ${err.message}`);
});

io.engine.on('connection_error', (err) => {
  logger.error(`Socket.IO engine error: ${err.message}`);
});

export { app, server, io }; 