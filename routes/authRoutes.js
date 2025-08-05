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