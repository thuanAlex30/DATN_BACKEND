const express = require('express');
const router = express.Router();
const workLocationController = require('../controllers/workLocationController');
const authMiddleware = require('../middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// ========== WORK LOCATION ROUTES ==========

// Get all locations for an area
router.get('/area/:areaId/locations', workLocationController.getAreaLocations);

// Get location by ID
router.get('/locations/:id', workLocationController.getLocationById);

// Create new location
router.post('/locations', workLocationController.createLocation);

// Update location
router.put('/locations/:id', workLocationController.updateLocation);

// Delete location
router.delete('/locations/:id', workLocationController.deleteLocation);

// Get location assignments
router.get('/locations/:id/assignments', workLocationController.getLocationAssignments);

// Add location assignment
router.post('/locations/:id/assignments', workLocationController.addLocationAssignment);

// Update location assignment
router.put('/location-assignments/:id', workLocationController.updateLocationAssignment);

// Remove location assignment
router.delete('/location-assignments/:id', workLocationController.removeLocationAssignment);

// Get location availability
router.get('/locations/:id/availability', workLocationController.getLocationAvailability);

// Get location statistics
router.get('/locations/:id/stats', workLocationController.getLocationStats);

module.exports = router;
