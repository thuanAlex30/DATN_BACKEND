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

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
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
