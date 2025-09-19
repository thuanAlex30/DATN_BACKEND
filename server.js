require('dotenv').config(); // Load .env

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const routes = require('./routes');
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 10000,
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api/v1', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Safety Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      roles: '/api/v1/roles'
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

    const server = app.listen(PORT, () => {
      console.log(`
🚀 Safety Management System API is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/api/v1/health
📚 API Base URL: http://localhost:${PORT}/api/v1
⏰ Started at: ${new Date().toLocaleString()}
      `);
    });

    // Set server timeout to 5 minutes for file uploads
    server.timeout = 300000; // 5 minutes

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server shutdown complete.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
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
