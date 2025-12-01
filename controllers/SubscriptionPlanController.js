const SubscriptionPlan = require('../models/subscriptionPlan');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class SubscriptionPlanController {
  // Get all subscription plans
  static getAllPlans = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const plans = await SubscriptionPlan.find({}).sort({ created_at: -1 });
      return ApiResponse.success(res, plans, 'Subscription plans retrieved successfully');
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return ApiResponse.error(res, 'Failed to retrieve subscription plans', 500);
    }
  });

  // Get subscription plan by ID
  static getPlanById = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await SubscriptionPlan.findById(id);

      if (!plan) {
        return ApiResponse.notFound(res, 'Subscription plan not found');
      }

      return ApiResponse.success(res, plan, 'Subscription plan retrieved successfully');
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      return ApiResponse.error(res, 'Failed to retrieve subscription plan', 500);
    }
  });

  // Create new subscription plan
  static createPlan = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const planData = req.body;
      const plan = new SubscriptionPlan(planData);
      await plan.save();

      return ApiResponse.success(res, plan, 'Subscription plan created successfully', 201);
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      if (error.name === 'ValidationError') {
        return ApiResponse.error(res, error.message, 400);
      }
      return ApiResponse.error(res, 'Failed to create subscription plan', 500);
    }
  });

  // Update subscription plan
  static updatePlan = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const plan = await SubscriptionPlan.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      );

      if (!plan) {
        return ApiResponse.notFound(res, 'Subscription plan not found');
      }

      return ApiResponse.success(res, plan, 'Subscription plan updated successfully');
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      if (error.name === 'ValidationError') {
        return ApiResponse.error(res, error.message, 400);
      }
      return ApiResponse.error(res, 'Failed to update subscription plan', 500);
    }
  });

  // Delete subscription plan
  static deletePlan = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await SubscriptionPlan.findByIdAndDelete(id);

      if (!plan) {
        return ApiResponse.notFound(res, 'Subscription plan not found');
      }

      return ApiResponse.success(res, null, 'Subscription plan deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      return ApiResponse.error(res, 'Failed to delete subscription plan', 500);
    }
  });
}

module.exports = SubscriptionPlanController;

