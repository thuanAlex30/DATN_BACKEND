const projectTaskService = require('../services/projectTaskService');
const websocketService = require('../services/websocketService');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class ProjectTaskController {
  // ========== PROJECT TASK MANAGEMENT ==========
  static getPhaseTasks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { phaseId } = req.params;
    const result = await projectTaskService.getPhaseTasks(phaseId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getTaskById = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectTaskService.getTaskById(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 404, result.data);
    }
  });

  static createTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const taskData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.createTask(taskData, userId);
    
    // Emit WebSocket event for task created
    if (result.success && result.data) {
      websocketService.emitToAll('task_created', {
        task: result.data,
        creator: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.updateTask(id, updateData, userId);
    
    // Emit WebSocket event for task updated
    if (result.success && result.data) {
      websocketService.emitToAll('task_updated', {
        task: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static deleteTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.deleteTask(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateTaskStatus = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.updateTaskStatus(id, status, userId);
    
    // Emit WebSocket event for task status updated
    if (result.success && result.data) {
      websocketService.emitToAll('task_status_updated', {
        task: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateTaskProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (progress < 0 || progress > 100) {
      return ApiResponse.error(res, 'Tiến độ phải từ 0 đến 100', 400);
    }
    
    const result = await projectTaskService.updateTaskProgress(id, progress, userId);
    
    // Emit WebSocket event for task progress updated
    if (result.success && result.data) {
      websocketService.emitToAll('task_progress_updated', {
        task: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static assignTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignee_id } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.assignTask(id, assignee_id, userId);
    
    // Emit WebSocket event for task assigned
    if (result.success && result.data) {
      websocketService.emitToAll('task_assigned', {
        task: result.data,
        assigner: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static unassignTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.unassignTask(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getTaskStats = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { phaseId } = req.params;
    const result = await projectTaskService.getTaskStats(phaseId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getUserTasks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user._id || req.user.id;
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      search: req.query.search
    };
    
    const result = await projectTaskService.getUserTasks(userId, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static reorderTasks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { phaseId } = req.params;
    const { taskIds } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.reorderTasks(phaseId, taskIds, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static duplicateTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newTaskName } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.duplicateTask(id, newTaskName, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getTaskDependencies = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectTaskService.getTaskDependencies(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateTaskDependencies = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dependencies } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.updateTaskDependencies(id, dependencies, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addTaskComment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.addTaskComment(id, comment, userId);
    
    // Emit WebSocket event for task comment added
    if (result.success && result.data) {
      websocketService.emitToAll('task_comment_added', {
        task: result.data,
        commenter: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getTaskComments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectTaskService.getTaskComments(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static getTaskTimeline = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectTaskService.getTaskTimeline(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static searchTasks = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { q } = req.query;
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assignee_id: req.query.assignee_id
    };
    
    const result = await projectTaskService.searchTasks(q, filters);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== TASK ASSIGNMENT METHODS ==========
  static getTaskAssignments = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectTaskService.getTaskAssignments(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addTaskAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignee_id, role } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.addTaskAssignment(id, assignee_id, role, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateTaskAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.updateTaskAssignment(id, updateData, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static removeTaskAssignment = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.removeTaskAssignment(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== TASK DEPENDENCY METHODS ==========
  static addTaskDependency = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { task_id, depends_on_task_id, dependency_type } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.addTaskDependency(task_id, depends_on_task_id, dependency_type, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static removeTaskDependency = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.removeTaskDependency(id, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ========== TASK PROGRESS LOG METHODS ==========
  static getTaskProgressLogs = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await projectTaskService.getTaskProgressLogs(id);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static addProgressLog = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress, note } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.addProgressLog(id, progress, note, userId);
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });
}

module.exports = ProjectTaskController;