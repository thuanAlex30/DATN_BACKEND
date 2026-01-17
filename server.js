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
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const routes = require('./routes');
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');
const LoggingMiddleware = require('./middlewares/LoggingMiddleware');
const { preventDuplicateRequests } = require('./middlewares/DuplicateRequestMiddleware');
const websocketService = require('./services/websocketService');
const kafkaProducer = require('./services/kafkaProducer');
const kafkaConsumer = require('./services/kafkaConsumer');
const kafkaMonitor = require('./services/kafkaMonitor');
const expiryCheckJob = require('./jobs/expiryCheckJob');
const ppeOverdueJob = require('./jobs/ppeOverdueJob');
const weatherAlertJob = require('./jobs/weatherAlertJob');

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
    // Vercel frontend URLs
    'https://datnfrontend-c0qa73axv-lam-danh-mais-projects.vercel.app',
    'https://*.vercel.app' // Support all Vercel preview deployments
  ];

  if (process.env.FRONTEND_URL) base.push(process.env.FRONTEND_URL);

  if (process.env.ALLOWED_ORIGINS) {
    base.push(
      ...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    );
  }

  return Array.from(new Set(base));
};

const allowedOrigins = parseAllowedOrigins();

// =====================
// CORS (FIXED)
// =====================
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / server-side
    
    // Check exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Check Vercel pattern (*.vercel.app)
    if (origin.includes('.vercel.app') && allowedOrigins.includes('https://*.vercel.app')) {
      return callback(null, true);
    }
    
    return callback(null, false); // ❗ NEVER throw error
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
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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
// Static uploads (writable path with fallback)
// =====================
const resolveUploadsDir = () => {
  const preferred = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(process.cwd(), 'uploads');
  const fallback = path.resolve('/tmp/uploads');

  for (const dir of [preferred, fallback]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      if (dir !== preferred) {
        console.warn(`⚠️ uploads dir not writable (${preferred}), using fallback ${dir}`);
      }
      return dir;
    } catch (err) {
      console.warn(`⚠️ Cannot use uploads dir ${dir}: ${err.message}`);
    }
  }

  throw new Error('No writable uploads directory available');
};

const uploadsDir = resolveUploadsDir();
app.use('/uploads', express.static(uploadsDir));

// =====================
// Duplicate Request Prevention
// =====================
// Prevent duplicate requests within a short time window (helps with rate limiting)
app.use(preventDuplicateRequests);

// =====================
// Logging
// =====================
// Only use LoggingMiddleware.logAllRequests to avoid duplicate logging
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
// Errors
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

    server.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
    });

    websocketService.initialize(io);
    expiryCheckJob.start();
    ppeOverdueJob.start();
    weatherAlertJob.start();

    // Kafka (optional) - can be disabled with env KAFKA_ENABLED=false
    const isKafkaEnabled = !(process.env.KAFKA_ENABLED === 'false' || process.env.KAFKA_ENABLED === '0');
    if (isKafkaEnabled) {
      try {
        await kafkaProducer.initialize();
        await kafkaConsumer.initialize();
        await kafkaMonitor.startMonitoring();

        console.log('✅ Kafka initialized');
      } catch (e) {
        console.log('⚠️ Kafka disabled (init failed):', e.message);
      }
    } else {
      // Silent skip to reduce log noise in deployment environments
      if (process.env.NODE_ENV !== 'production') {
        console.log('ℹ️ Kafka initialization skipped (KAFKA_ENABLED is false)');
      }
    }

    const shutdown = () => {
      console.log('🛑 Shutting down...');

      expiryCheckJob.stop();
      ppeOverdueJob.stop();
      weatherAlertJob.stop();
      if (isKafkaEnabled && kafkaMonitor && typeof kafkaMonitor.stopMonitoring === 'function') {
        try { kafkaMonitor.stopMonitoring(); } catch (err) { console.warn('Error stopping kafkaMonitor:', err.message); }
      }
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('❌ Startup failed', err);
    process.exit(1);
  }
})();