const ProjectTask = require('../models/projectTask');
const TaskAssignment = require('../models/taskAssignment');
const TaskDependency = require('../models/taskDependency');
const TaskProgressLog = require('../models/taskProgressLog');

class ProjectTaskRepository {
  // ========== BASIC CRUD ==========
  async getAllTasks(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.task_name) {
        query.task_name = { $regex: filters.task_name, $options: 'i' };
      }
      if (filters.task_code) {
        query.task_code = { $regex: filters.task_code, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.responsible_user_id) {
        query.responsible_user_id = filters.responsible_user_id;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  async getTaskById(id) {
    try {
      const task = await ProjectTask.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email');

      return task;
    } catch (error) {
      console.error('Error getting task by id:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      const task = new ProjectTask(taskData);
      await task.save();
      
      return await this.getTaskById(task._id);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id, updateData) {
    try {
      const task = await ProjectTask.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email');

      return task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      const task = await ProjectTask.findByIdAndDelete(id);
      return task;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // ========== PROJECT TASK QUERIES ==========
  async getProjectTasks(projectId) {
    try {
      const tasks = await ProjectTask.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  }

  // Get tasks assigned to a specific user
  async getTasksByUser(userId) {
    try {
      const tasks = await ProjectTask.find({ responsible_user_id: userId })
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email username')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting tasks by user:', error);
      throw error;
    }
  }


  async getTasksByStatus(status, projectId = null) {
    try {
      const query = { status };
      if (projectId) {
        query.project_id = projectId;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      throw error;
    }
  }

  async getTasksByPriority(priority, projectId = null) {
    try {
      const query = { priority };
      if (projectId) {
        query.project_id = projectId;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting tasks by priority:', error);
      throw error;
    }
  }

  async getUserTasks(userId, filters = {}) {
    try {
      const query = { responsible_user_id: userId };
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  async getOverdueTasks(projectId = null) {
    try {
      const query = {
        planned_end_date: { $lt: new Date() },
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      };
      if (projectId) {
        query.project_id = projectId;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_end_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      throw error;
    }
  }

  async getUpcomingTasks(days = 7, projectId = null) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const query = {
        planned_start_date: { $lte: futureDate, $gte: new Date() },
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      };
      if (projectId) {
        query.project_id = projectId;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error getting upcoming tasks:', error);
      throw error;
    }
  }

  // ========== TASK VALIDATION ==========
  // Generate unique task code for a project
  async generateUniqueTaskCode(projectId) {
    try {
      // Find the highest task code number in the project
      const lastTask = await ProjectTask.findOne({ project_id: projectId })
        .sort({ task_code: -1 })
        .select('task_code');

      let nextNumber = 1;
      if (lastTask && lastTask.task_code) {
        // Extract number from task_code (e.g., TASK-001 -> 1)
        const match = lastTask.task_code.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Generate task code with leading zeros
      const taskCode = `TASK-${nextNumber.toString().padStart(3, '0')}`;
      
      // Double-check uniqueness
      const existingTask = await ProjectTask.findOne({
        project_id: projectId,
        task_code: taskCode
      });

      if (existingTask) {
        // If somehow still exists, try next number
        return `TASK-${(nextNumber + 1).toString().padStart(3, '0')}`;
      }

      return taskCode;
    } catch (error) {
      console.error('Error generating unique task code:', error);
      // Fallback to timestamp-based code
      return `TASK-${Date.now().toString().slice(-6)}`;
    }
  }

  async validateTask(taskData) {
    try {
      const errors = [];

      // Check required fields
      if (!taskData.project_id) {
        errors.push('Project ID is required');
      }
      if (!taskData.task_name) {
        errors.push('Task name is required');
      }
      
      // Generate task_code if not provided
      if (!taskData.task_code) {
        taskData.task_code = await this.generateUniqueTaskCode(taskData.project_id);
      }
      if (!taskData.planned_start_date) {
        errors.push('Planned start date is required');
      }
      if (!taskData.planned_end_date) {
        errors.push('Planned end date is required');
      }

      // Check if priority is valid
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (taskData.priority && !validPriorities.includes(taskData.priority)) {
        errors.push('Invalid priority level');
      }

      // Check if status is valid
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
      if (taskData.status && !validStatuses.includes(taskData.status)) {
        errors.push('Invalid status');
      }

      // Check if planned end date is after start date
      if (taskData.planned_start_date && taskData.planned_end_date) {
        if (new Date(taskData.planned_end_date) <= new Date(taskData.planned_start_date)) {
          errors.push('Planned end date must be after start date');
        }
      }

      // Check for duplicate task code in same project (only if provided)
      if (taskData.project_id && taskData.task_code) {
        const existingTask = await ProjectTask.findOne({
          project_id: taskData.project_id,
          task_code: taskData.task_code,
          _id: { $ne: taskData._id }
        });
        if (existingTask) {
          errors.push('Task code already exists in this project');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating task:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== TASK ANALYTICS ==========
  async getTaskAnalytics(projectId) {
    try {
      const tasks = await ProjectTask.find({ project_id: projectId });
      
      const analytics = {
        total_tasks: tasks.length,
        pending_tasks: tasks.filter(t => t.status === 'PENDING').length,
        in_progress_tasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed_tasks: tasks.filter(t => t.status === 'COMPLETED').length,
        cancelled_tasks: tasks.filter(t => t.status === 'CANCELLED').length,
        on_hold_tasks: tasks.filter(t => t.status === 'ON_HOLD').length,
        high_priority_tasks: tasks.filter(t => t.priority === 'HIGH').length,
        critical_tasks: tasks.filter(t => t.priority === 'CRITICAL').length,
        overdue_tasks: tasks.filter(t => {
          if (t.planned_end_date && t.status !== 'COMPLETED') {
            return new Date(t.planned_end_date) < new Date();
          }
          return false;
        }).length,
        tasks_by_status: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {}),
        tasks_by_priority: tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {}),
        completion_rate: tasks.length > 0 ? 
          (tasks.filter(t => t.status === 'COMPLETED').length / tasks.length * 100).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting task analytics:', error);
      throw error;
    }
  }

  async getTaskStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const tasks = await ProjectTask.find(query);
      
      const stats = {
        total_tasks: tasks.length,
        tasks_by_status: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {}),
        tasks_by_priority: tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {}),
        tasks_by_project: tasks.reduce((acc, task) => {
          const projectId = task.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {}),
        completed_tasks: tasks.filter(t => t.status === 'COMPLETED').length,
        overdue_tasks: tasks.filter(t => {
          if (t.planned_end_date && t.status !== 'COMPLETED') {
            return new Date(t.planned_end_date) < new Date();
          }
          return false;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      throw error;
    }
  }

  // ========== TASK ASSIGNMENTS ==========
  async getTaskAssignments(taskId) {
    try {
      const assignments = await TaskAssignment.find({ task_id: taskId })
        .populate('task_id', 'task_name task_code')
        .populate('user_id', 'full_name email')
        .populate('assigned_by', 'full_name email')
        .sort({ assigned_at: -1 });

      return assignments;
    } catch (error) {
      console.error('Error getting task assignments:', error);
      throw error;
    }
  }

  async assignUserToTask(taskId, userId, assignedBy, role = 'ASSIGNEE') {
    try {
      const assignment = new TaskAssignment({
        task_id: taskId,
        user_id: userId,
        role: role,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        status: 'ACTIVE'
      });

      await assignment.save();

      // Update task responsible_user_id field
      await this.updateTask(taskId, { responsible_user_id: userId });

      return assignment;
    } catch (error) {
      console.error('Error assigning user to task:', error);
      throw error;
    }
  }

  async unassignUserFromTask(assignmentId, unassignedBy) {
    try {
      const assignment = await TaskAssignment.findByIdAndUpdate(
        assignmentId,
        {
          status: 'INACTIVE',
          unassigned_at: new Date(),
          unassigned_by: unassignedBy
        },
        { new: true }
      );

      return assignment;
    } catch (error) {
      console.error('Error unassigning user from task:', error);
      throw error;
    }
  }

  // ========== TASK DEPENDENCIES ==========
  async getTaskDependencies(taskId) {
    try {
      const dependencies = await TaskDependency.find({
        $or: [
          { predecessor_task_id: taskId },
          { successor_task_id: taskId }
        ]
      })
        .populate('predecessor_task_id', 'task_name task_code')
        .populate('successor_task_id', 'task_name task_code')
        .populate('created_by', 'full_name email')
        .sort({ created_at: -1 });

      return dependencies;
    } catch (error) {
      console.error('Error getting task dependencies:', error);
      throw error;
    }
  }

  async createTaskDependency(predecessorTaskId, successorTaskId, dependencyType, createdBy) {
    try {
      const dependency = new TaskDependency({
        predecessor_task_id: predecessorTaskId,
        successor_task_id: successorTaskId,
        dependency_type: dependencyType,
        created_by: createdBy,
        status: 'ACTIVE'
      });

      await dependency.save();
      return dependency;
    } catch (error) {
      console.error('Error creating task dependency:', error);
      throw error;
    }
  }

  // ========== TASK PROGRESS ==========
  async getTaskProgressLogs(taskId) {
    try {
      const progressLogs = await TaskProgressLog.find({ task_id: taskId })
        .populate('task_id', 'task_name task_code')
        .populate('user_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .sort({ log_date: -1 });

      return progressLogs;
    } catch (error) {
      console.error('Error getting task progress logs:', error);
      throw error;
    }
  }

  async createProgressLog(taskId, progressData, userId) {
    try {
      const progressLog = new TaskProgressLog({
        task_id: taskId,
        ...progressData,
        user_id: userId,
        log_date: new Date()
      });

      await progressLog.save();

      // Update task progress
      if (progressData.progress_percentage !== undefined) {
        await this.updateTask(taskId, { 
          progress_percentage: progressData.progress_percentage 
        });
      }

      return progressLog;
    } catch (error) {
      console.error('Error creating progress log:', error);
      throw error;
    }
  }

  // ========== TASK MANAGEMENT ==========
  async startTask(id, startedBy) {
    try {
      const updateData = {
        status: 'IN_PROGRESS',
        actual_start_date: new Date(),
        started_by: startedBy
      };

      return await this.updateTask(id, updateData);
    } catch (error) {
      console.error('Error starting task:', error);
      throw error;
    }
  }

  async completeTask(id, completedBy, actualEndDate = null) {
    try {
      const updateData = {
        status: 'COMPLETED',
        actual_end_date: actualEndDate || new Date(),
        completed_by: completedBy,
        progress_percentage: 100
      };

      return await this.updateTask(id, updateData);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  async cancelTask(id, cancelledBy, reason) {
    try {
      const updateData = {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: cancelledBy,
        cancellation_reason: reason
      };

      return await this.updateTask(id, updateData);
    } catch (error) {
      console.error('Error cancelling task:', error);
      throw error;
    }
  }

  async holdTask(id, heldBy, reason) {
    try {
      const updateData = {
        status: 'ON_HOLD',
        held_at: new Date(),
        held_by: heldBy,
        hold_reason: reason
      };

      return await this.updateTask(id, updateData);
    } catch (error) {
      console.error('Error holding task:', error);
      throw error;
    }
  }

  // ========== TASK SEARCH ==========
  async searchTasks(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { task_name: { $regex: searchTerm, $options: 'i' } },
          { task_code: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.responsible_user_id) {
        query.responsible_user_id = filters.responsible_user_id;
      }

      const tasks = await ProjectTask.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('area_id', 'area_name area_code')
        .populate('location_id', 'location_name location_code')
        .populate('parent_task_id', 'task_name')
        .populate('responsible_user_id', 'full_name email')
        .sort({ planned_start_date: 1 });

      return tasks;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw error;
    }
  }

  // ========== TASK REPORTS ==========
  async generateTaskReport(projectId) {
    try {
      const tasks = await this.getProjectTasks(projectId);
      const analytics = await this.getTaskAnalytics(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        tasks: tasks,
        analytics: analytics,
        summary: {
          total_tasks: analytics.total_tasks,
          completed_tasks: analytics.completed_tasks,
          completion_rate: analytics.completion_rate,
          overdue_tasks: analytics.overdue_tasks
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating task report:', error);
      throw error;
    }
  }

  // ========== ADDITIONAL TASK ASSIGNMENT METHODS ==========
  async updateTaskAssignment(assignmentId, updateData, updatedBy) {
    try {
      const assignment = await TaskAssignment.findByIdAndUpdate(
        assignmentId,
        {
          ...updateData,
          updated_by: updatedBy,
          updated_at: new Date()
        },
        { new: true }
      ).populate('task_id', 'task_name task_code')
       .populate('user_id', 'full_name email')
       .populate('assigned_by', 'full_name email')
       .populate('updated_by', 'full_name email');

      if (!assignment) {
        throw new Error('Task assignment not found');
      }

      return assignment;
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  }

  // ========== ADDITIONAL TASK DEPENDENCY METHODS ==========
  async removeTaskDependency(dependencyId, removedBy) {
    try {
      const dependency = await TaskDependency.findByIdAndUpdate(
        dependencyId,
        {
          status: 'INACTIVE',
          removed_by: removedBy,
          removed_at: new Date()
        },
        { new: true }
      ).populate('predecessor_task_id', 'task_name task_code')
       .populate('successor_task_id', 'task_name task_code')
       .populate('created_by', 'full_name email')
       .populate('removed_by', 'full_name email');

      if (!dependency) {
        throw new Error('Task dependency not found');
      }

      return dependency;
    } catch (error) {
      console.error('Error removing task dependency:', error);
      throw error;
    }
  }
}

module.exports = new ProjectTaskRepository();
