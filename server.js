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

const app = express();
const PORT = process.env.PORT || 3000;

// Debugging startup environment
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 MONGODB_URI:', process.env.MONGODB_URI ? '[loaded]' : '[missing]');

// Security
app.use(helmet());

// CORS - 更宽松的配置用于开发环境
const corsOptions = {
  origin: function (origin, callback) {
    // 允许所有本地开发端口
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173'
    ];
    
    // 在生产环境中添加生产域名
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push('https://yourdomain.com');
    }
    
    // 允许没有 origin 的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
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

    const server = app.listen(PORT, () => {
      console.log(`
🚀 Safety Management System API is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/api/health
📚 API Base URL: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
⏰ Started at: ${new Date().toLocaleString()}
      `);
    });

    // Initialize WebSocket server
    websocketService.initialize(server);
    
    // Initialize Kafka services
    const kafkaInitialized = await websocketService.initializeKafkaServices();
    
    // Start Kafka monitoring only if Kafka services are initialized
    if (kafkaInitialized) {
      await kafkaMonitor.startMonitoring();
      console.log('✅ Kafka monitoring started');
    } else {
      console.log('⚠️ Kafka monitoring not started due to initialization failure');
    }
    
    // Setup test handlers for development
    websocketService.setupTestHandlers();

    // Set server timeout to 2 minutes for better performance
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      kafkaMonitor.stopMonitoring();
      server.close(() => {
        console.log('✅ Server shutdown complete.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
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
