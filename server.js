// =====================
// Load environment
// =====================
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing. Please set it in .env');
  process.exit(1);
}

// Kafka warning suppression
process.env.KAFKAJS_NO_PARTITIONER_WARNING ||= '1';

// =====================
// Imports
// =====================
const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const routes = require('./routes');
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');
const LoggingMiddleware = require('./middlewares/LoggingMiddleware');
const initializeTrainingData = require('./database/initializeTrainingData');
const websocketService = require('./services/websocketService');
const kafkaMonitor = require('./services/kafkaMonitor');
const expiryCheckJob = require('./jobs/expiryCheckJob');
const ppeOverdueJob = require('./jobs/ppeOverdueJob');

// =====================
// App & Server
// =====================
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// =====================
// Allowed origins helper
// =====================
const parseAllowedOrigins = () => {
  const base = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'https://safe-n814.onrender.com',
  ];

  if (process.env.FRONTEND_URL) base.push(process.env.FRONTEND_URL);

  if (process.env.ALLOWED_ORIGINS) {
    base.push(
      ...process.env.ALLOWED_ORIGINS
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
    );
  }

  return Array.from(new Set(base));
};

const allowedOrigins = parseAllowedOrigins();

// =====================
// CORS
// =====================
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / server-side
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false); // never throw
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// =====================
// Security & parsers
// =====================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================
// Rate limit
// =====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// =====================
// Static uploads
// =====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================
// Logging
// =====================
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`
  );
  next();
});
app.use(LoggingMiddleware.logAllRequests);

// =====================
// Routes
// =====================
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Safety Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// =====================
// Error handling
// =====================
app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.handle);

// =====================
// Socket.IO
// =====================
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  },
});

// =====================
// Bootstrap
// =====================
(async () => {
  try {
    await connectDB();
    await initializeTrainingData();

    server.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
    });

    websocketService.initialize(io);

    expiryCheckJob.start();
    ppeOverdueJob.start();

    // =====================
    // Kafka (optional)
    // =====================
    try {
      const kafkaProducer = require('./services/kafkaProducer');
      const kafkaConsumer = require('./services/kafkaConsumer');

      await kafkaProducer.initialize();
      await kafkaConsumer.initialize();
      await kafkaMonitor.startMonitoring();

      console.log('✅ Kafka initialized');
    } catch (e) {
      console.log('⚠️ Kafka disabled:', e.message);
    }

    // =====================
    // Graceful shutdown
    // =====================
    const shutdown = () => {
      console.log('🛑 Shutting down...');
      expiryCheckJob.stop();
      kafkaMonitor.stopMonitoring();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('❌ Startup failed', err);
    process.exit(1);
  }
})();
