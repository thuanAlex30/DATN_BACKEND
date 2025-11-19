const TaskProgressLog = require('../models/taskProgressLog');
const ProjectTask = require('../models/projectTask');

class TaskProgressLogRepository {
  // ========== PROGRESS LOG CRUD ==========
  async getTaskProgressLogs(taskId) {
    return await TaskProgressLog.find({ task_id: taskId })
      .populate('task_id', 'task_name task_code')
      .populate('user_id', 'full_name email')
      .sort({ report_date: -1 });
  }

  async getProgressLogById(id) {
    return await TaskProgressLog.findById(id)
      .populate('task_id', 'task_name task_code')
      .populate('user_id', 'full_name email');
  }

  async createProgressLog(logData) {
    const log = new TaskProgressLog(logData);
    return await log.save();
  }

  async updateProgressLog(id, updateData) {
    return await TaskProgressLog.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteProgressLog(id) {
    return await TaskProgressLog.findByIdAndDelete(id);
  }

  // ========== PROGRESS TRACKING ==========
  async getLatestProgressLog(taskId) {
    return await TaskProgressLog.findOne({ task_id: taskId })
      .populate('task_id', 'task_name task_code')
      .populate('user_id', 'full_name email')
      .sort({ report_date: -1 });
  }

  async getProgressLogsByUser(userId, filters = {}) {
    const query = { user_id: userId };
    
    if (filters.start_date && filters.end_date) {
      query.report_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    return await TaskProgressLog.find(query)
      .populate('task_id', 'task_name task_code')
      .populate('user_id', 'full_name email')
      .sort({ report_date: -1 });
  }

  async getProgressLogsByProject(projectId, filters = {}) {
    const tasks = await ProjectTask.find({ project_id: projectId }).select('_id');
    const taskIds = tasks.map(task => task._id);

    const query = { task_id: { $in: taskIds } };
    
    if (filters.start_date && filters.end_date) {
      query.report_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    return await TaskProgressLog.find(query)
      .populate('task_id', 'task_name task_code')
      .populate('user_id', 'full_name email')
      .sort({ report_date: -1 });
  }

  // ========== PROGRESS ANALYTICS ==========
  async getProgressAnalytics(taskId) {
    const logs = await TaskProgressLog.find({ task_id: taskId })
      .sort({ report_date: 1 });

    if (logs.length === 0) {
      return {
        task_id: taskId,
        total_logs: 0,
        current_progress: 0,
        progress_trend: 'stable',
        average_daily_progress: 0,
        completion_forecast: null
      };
    }

    const totalLogs = logs.length;
    const currentProgress = logs[logs.length - 1].progress_percentage;
    
    // Calculate progress trend
    let progressTrend = 'stable';
    if (logs.length >= 2) {
      const recentProgress = logs[logs.length - 1].progress_percentage;
      const previousProgress = logs[logs.length - 2].progress_percentage;
      const progressDiff = recentProgress - previousProgress;
      
      if (progressDiff > 5) progressTrend = 'increasing';
      else if (progressDiff < -5) progressTrend = 'decreasing';
    }

    // Calculate average daily progress
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const daysDiff = Math.ceil((lastLog.report_date - firstLog.report_date) / (1000 * 60 * 60 * 24));
    const averageDailyProgress = daysDiff > 0 ? (currentProgress - firstLog.progress_percentage) / daysDiff : 0;

    // Calculate completion forecast
    let completionForecast = null;
    if (averageDailyProgress > 0 && currentProgress < 100) {
      const remainingProgress = 100 - currentProgress;
      const daysToComplete = Math.ceil(remainingProgress / averageDailyProgress);
      completionForecast = new Date(Date.now() + (daysToComplete * 24 * 60 * 60 * 1000));
    }

    return {
      task_id: taskId,
      total_logs: totalLogs,
      current_progress: currentProgress,
      progress_trend: progressTrend,
      average_daily_progress: averageDailyProgress,
      completion_forecast: completionForecast
    };
  }

  async getProjectProgressAnalytics(projectId) {
    const tasks = await ProjectTask.find({ project_id: projectId }).select('_id');
    const taskIds = tasks.map(task => task._id);

    const logs = await TaskProgressLog.find({ task_id: { $in: taskIds } })
      .sort({ report_date: 1 });

    const taskProgressMap = {};
    logs.forEach(log => {
      const taskId = log.task_id.toString();
      if (!taskProgressMap[taskId]) {
        taskProgressMap[taskId] = [];
      }
      taskProgressMap[taskId].push(log);
    });

    const analytics = {
      project_id: projectId,
      total_tasks: tasks.length,
      tasks_with_progress: Object.keys(taskProgressMap).length,
      overall_progress: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      not_started_tasks: 0
    };

    let totalProgress = 0;
    Object.values(taskProgressMap).forEach(taskLogs => {
      const latestLog = taskLogs[taskLogs.length - 1];
      totalProgress += latestLog.progress_percentage;
      
      if (latestLog.progress_percentage === 100) {
        analytics.completed_tasks++;
      } else if (latestLog.progress_percentage > 0) {
        analytics.in_progress_tasks++;
      } else {
        analytics.not_started_tasks++;
      }
    });

    analytics.overall_progress = analytics.tasks_with_progress > 0 
      ? totalProgress / analytics.tasks_with_progress 
      : 0;

    return analytics;
  }

  // ========== PROGRESS STATISTICS ==========
  async getProgressStats(filters = {}) {
    const query = {};
    
    if (filters.user_id) {
      query.user_id = filters.user_id;
    }
    
    if (filters.start_date && filters.end_date) {
      query.report_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    const totalLogs = await TaskProgressLog.countDocuments(query);
    
    const logsByUser = await TaskProgressLog.aggregate([
      { $match: query },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { user_id: '$_id', user_name: '$user.full_name', count: 1 } }
    ]);

    const logsByTask = await TaskProgressLog.aggregate([
      { $match: query },
      { $group: { _id: '$task_id', count: { $sum: 1 } } },
      { $lookup: { from: 'projecttasks', localField: '_id', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $project: { task_id: '$_id', task_name: '$task.task_name', count: 1 } }
    ]);

    return {
      total_logs: totalLogs,
      logs_by_user: logsByUser,
      logs_by_task: logsByTask
    };
  }

  // ========== PROGRESS FORECASTING ==========
  async getProgressForecast(taskId, days = 30) {
    const logs = await TaskProgressLog.find({ task_id: taskId })
      .sort({ report_date: 1 });

    if (logs.length < 2) {
      return {
        task_id: taskId,
        forecast_days: days,
        forecast_data: [],
        confidence: 'low',
        message: 'Không đủ dữ liệu để dự báo'
      };
    }

    // Simple linear regression for progress forecasting
    const n = logs.length;
    const x = logs.map((_, index) => index);
    const y = logs.map(log => log.progress_percentage);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecastData = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(currentDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const predictedProgress = Math.min(100, Math.max(0, intercept + slope * (n + i - 1)));
      
      forecastData.push({
        date: futureDate,
        predicted_progress: Math.round(predictedProgress * 100) / 100
      });
    }

    // Calculate confidence based on R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = intercept + slope * x[i];
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    let confidence = 'low';
    if (rSquared > 0.8) confidence = 'high';
    else if (rSquared > 0.5) confidence = 'medium';

    return {
      task_id: taskId,
      forecast_days: days,
      forecast_data: forecastData,
      confidence: confidence,
      r_squared: Math.round(rSquared * 100) / 100
    };
  }
}

module.exports = new TaskProgressLogRepository();
