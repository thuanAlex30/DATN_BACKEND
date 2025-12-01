// Load .env with fallback values
require('dotenv').config();

// Set environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your_super_secret_jwt_key_here_2024_safety_management_system';
  console.log('⚠️  JWT_SECRET not found in .env, using default value');
}

// Set Kafka environment variables
if (!process.env.KAFKAJS_NO_PARTITIONER_WARNING) {
  process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';
}

const express = require('express');
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

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
const parseAllowedOrigins = () => {
  const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ];

  if (process.env.FRONTEND_URL) {
    baseOrigins.push(process.env.FRONTEND_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    baseOrigins.push(
      ...process.env.ALLOWED_ORIGINS
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
    );
  }

  return Array.from(new Set(baseOrigins));
};

const allowedOrigins = parseAllowedOrigins();

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Socket.IO CORS blocked origin:', origin);
        callback(new Error('Not allowed by Socket.IO CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true // Allow Engine.IO v3 clients
});

// Debugging startup environment
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 MONGODB_URI:', process.env.MONGODB_URI ? '[loaded]' : '[missing]');

// Security
app.use(helmet());

// CORS - 更宽松的配置用于开发环境
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// 明确处理预检请求
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiting - More flexible configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 5000, // Increased limits
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Skip failed requests
  skipFailedRequests: false,
  // Custom key generator to group by user
  keyGenerator: (req) => {
    // Use user ID if available, otherwise use IP
    return req.user?.id || req.ip;
  },
  // Skip rate limiting for pricing routes and chatbot session (they have their own limiters)
  skip: (req) => {
    // Exclude pricing routes from global rate limiter
    if (req.path.startsWith('/api/pricing')) {
      return true;
    }
    // Exclude chatbot session endpoint from global rate limiter (it has its own limiter)
    if (req.path === '/api/chatbot/session' && req.method === 'POST') {
      return true;
    }
    return false;
  }
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Express-validator middleware
const { validationResult } = require('express-validator');
app.use((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path || error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// System logging middleware - ghi log tất cả các hoạt động
app.use(LoggingMiddleware.logAllRequests);

// Routes
app.use('/api', routes);

// Health check routes
const healthRoutes = require('./routes/healthRoutes');
app.use('/api/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Safety Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles'
    }
  });
});

// Error handling
app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.handle);

// Start server only after DB connects
(async () => {
  try {
    await connectDB();
    
    // Initialize training data
    await initializeTrainingData();

    server.listen(PORT, () => {
      console.log(`
🚀 Safety Management System API is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/api/health
📚 API Base URL: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
⏰ Started at: ${new Date().toLocaleString()}
      `);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`
❌ Lỗi: Port ${PORT} đã được sử dụng bởi process khác!

💡 Giải pháp:
   1. Tìm và dừng process đang sử dụng port ${PORT}:
      Windows: netstat -ano | findstr :${PORT}
      Sau đó: taskkill /PID <PID> /F
   
   2. Hoặc thay đổi port trong file .env:
      PORT=3001

   3. Hoặc đợi vài giây để port được giải phóng tự động.
        `);
        process.exit(1);
      } else {
        console.error('❌ Lỗi khi khởi động server:', err);
        process.exit(1);
      }
    });

    // Initialize WebSocket server
    websocketService.initialize(io);
    
    // Start PPE expiry check job
    expiryCheckJob.start();
    console.log('✅ PPE expiry check job started');
    
    // Initialize Kafka services
    try {
      const kafkaProducer = require('./services/kafkaProducer');
      const kafkaConsumer = require('./services/kafkaConsumer');
      const eventAggregator = require('./services/eventAggregator');
      const analyticsService = require('./services/analyticsService');
      const auditService = require('./services/auditService');
      
      // Initialize Kafka services
      await kafkaProducer.initialize();
      await kafkaConsumer.initialize();
      await eventAggregator.initialize();
      await analyticsService.initialize();
      await auditService.initialize();
      
      // Start Kafka monitoring
      await kafkaMonitor.startMonitoring();
      console.log('✅ Kafka services initialized and monitoring started');
    } catch (error) {
      console.log('⚠️ Kafka services initialization failed:', error.message);
      console.log('⚠️ Kafka monitoring not started due to initialization failure');
    }

    // Set server timeout to 2 minutes for better performance
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      expiryCheckJob.stop();
      kafkaMonitor.stopMonitoring();
      server.close(() => {
        console.log('✅ Server shutdown complete.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      expiryCheckJob.stop();
      kafkaMonitor.stopMonitoring();
      server.close(() => {
        console.log('✅ Server shutdown complete.');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (err, promise) => {
      console.error('🚨 Unhandled Rejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error('🚨 Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
