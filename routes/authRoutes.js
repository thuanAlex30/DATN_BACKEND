const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const authValidation = require('../validations/authvalidation');

const router = express.Router();

// Public routes
router.post('/register', 
  ValidationMiddleware.validateBody(authValidation.register),
  AuthController.register
);

router.post('/login', 
  ValidationMiddleware.validateBody(authValidation.login),
  AuthController.login
);

router.post('/refresh-token', 
  ValidationMiddleware.validateBody(authValidation.refreshToken),
  AuthController.refreshToken
);

// Forgot password routes (public)
router.post('/forgot-password', (req, res, next) => {
  console.log('🔐 [authRoutes] POST /forgot-password - Request received');
  console.log('🔐 [authRoutes] Headers:', {
    authorization: req.headers.authorization ? 'present' : 'missing',
    'content-type': req.headers['content-type']
  });
  console.log('🔐 [authRoutes] Body:', { email: req.body.email });
  next();
}, 
  ValidationMiddleware.validateBody(authValidation.forgotPassword),
  AuthController.forgotPassword
);

router.post('/verify-otp',
  ValidationMiddleware.validateBody(authValidation.verifyOTP),
  AuthController.verifyOTP
);

router.post('/reset-password',
  ValidationMiddleware.validateBody(authValidation.resetPasswordWithOTP),
  AuthController.resetPasswordWithOTP
);

// Protected routes (require authentication)
router.use(AuthMiddleware.authenticate);

router.post('/logout', AuthController.logout);

router.get('/me', AuthController.me);

router.get('/profile', AuthController.getProfile);

router.put('/profile', 
  ValidationMiddleware.validateBody(authValidation.register.fork(['password', 'confirmPassword', 'role_id'], (schema) => schema.optional())),
  AuthController.updateProfile
);

router.post('/change-password', 
  ValidationMiddleware.validateBody(authValidation.changePassword),
  AuthController.changePassword
);

module.exports = router;