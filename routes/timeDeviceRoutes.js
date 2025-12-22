const express = require('express');
const router = express.Router();
const TimeDeviceController = require('../controllers/timeDeviceController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const TimeWebhookController = require('../controllers/timeWebhookController');

// Create or upsert a time device
router.post('/',
  AuthMiddleware.authenticate,
  TimeDeviceController.createDevice
);

// List devices for tenant
router.get('/',
  AuthMiddleware.authenticate,
  TimeDeviceController.listDevices
);

// Update device by deviceId
router.put('/:deviceId',
  AuthMiddleware.authenticate,
  TimeDeviceController.updateDevice
);

// Webhook endpoint for devices (no auth - devices will sign payload)
router.post('/webhook', TimeWebhookController.webhookHandler);

module.exports = router;


