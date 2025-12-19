const QualityCheckpoint = require('../models/qualityCheckpoint');

class QualityCheckpointService {
  async getTaskCheckpoints(taskId) {
    try {
      const checkpoints = await QualityCheckpoint.find({ task_id: taskId })
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .sort({ scheduled_date: 1 });

      return {
        success: true,
        data: checkpoints,
        message: 'Lấy danh sách điểm kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error getting task checkpoints:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách điểm kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async getCheckpointById(id) {
    try {
      const checkpoint = await QualityCheckpoint.findById(id)
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email');

      if (!checkpoint) {
        return {
          success: false,
          message: 'Không tìm thấy điểm kiểm tra chất lượng'
        };
      }

      return {
        success: true,
        data: checkpoint,
        message: 'Lấy thông tin điểm kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error getting checkpoint:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin điểm kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async createCheckpoint(checkpointData, userId) {
    try {
      const requiredFields = ['task_id', 'checkpoint_name', 'quality_criteria', 'inspection_method', 'inspector_id', 'scheduled_date'];
      for (const field of requiredFields) {
        if (!checkpointData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const checkpoint = new QualityCheckpoint({
        ...checkpointData,
        inspector_id: userId
      });

      await checkpoint.save();

      return {
        success: true,
        data: checkpoint,
        message: 'Tạo điểm kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error creating checkpoint:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo điểm kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async updateCheckpoint(id, updateData, userId) {
    try {
      const checkpoint = await QualityCheckpoint.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!checkpoint) {
        return {
          success: false,
          message: 'Không tìm thấy điểm kiểm tra chất lượng'
        };
      }

      return {
        success: true,
        data: checkpoint,
        message: 'Cập nhật điểm kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật điểm kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async deleteCheckpoint(id, userId) {
    try {
      const checkpoint = await QualityCheckpoint.findByIdAndDelete(id);

      if (!checkpoint) {
        return {
          success: false,
          message: 'Không tìm thấy điểm kiểm tra chất lượng'
        };
      }

      return {
        success: true,
        message: 'Xóa điểm kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa điểm kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async scheduleCheckpoint(id, scheduledDate, userId) {
    try {
      const checkpoint = await QualityCheckpoint.findByIdAndUpdate(
        id,
        { 
          scheduled_date: scheduledDate,
          status: 'SCHEDULED',
          updated_at: new Date()
        },
        { new: true }
      );

      if (!checkpoint) {
        return {
          success: false,
          message: 'Không tìm thấy điểm kiểm tra chất lượng'
        };
      }

      return {
        success: true,
        data: checkpoint,
        message: 'Lên lịch kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error scheduling checkpoint:', error);
      return {
        success: false,
        message: 'Lỗi khi lên lịch kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async completeCheckpoint(id, inspectionData, userId) {
    try {
      const checkpoint = await QualityCheckpoint.findByIdAndUpdate(
        id,
        { 
          ...inspectionData,
          actual_date: new Date(),
          status: 'COMPLETED',
          updated_at: new Date()
        },
        { new: true }
      );

      if (!checkpoint) {
        return {
          success: false,
          message: 'Không tìm thấy điểm kiểm tra chất lượng'
        };
      }

      return {
        success: true,
        data: checkpoint,
        message: 'Hoàn thành kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error completing checkpoint:', error);
      return {
        success: false,
        message: 'Lỗi khi hoàn thành kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async getCheckpointStats() {
    try {
      const totalCheckpoints = await QualityCheckpoint.countDocuments();
      const checkpointsByStatus = await QualityCheckpoint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const checkpointsByResult = await QualityCheckpoint.aggregate([
        { $group: { _id: '$result', count: { $sum: 1 } } }
      ]);

      const stats = {
        total_checkpoints: totalCheckpoints,
        checkpoints_by_status: checkpointsByStatus,
        checkpoints_by_result: checkpointsByResult
      };

      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê điểm kiểm tra chất lượng thành công'
      };
    } catch (error) {
      console.error('Error getting checkpoint stats:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thống kê điểm kiểm tra chất lượng',
        error: error.message
      };
    }
  }

  async getOverdueCheckpoints() {
    try {
      const overdueCheckpoints = await QualityCheckpoint.find({
        scheduled_date: { $lt: new Date() },
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
      })
        .populate('task_id', 'task_name task_code')
        .populate('inspector_id', 'full_name email')
        .sort({ scheduled_date: 1 });

      return {
        success: true,
        data: overdueCheckpoints,
        message: 'Lấy điểm kiểm tra quá hạn thành công'
      };
    } catch (error) {
      console.error('Error getting overdue checkpoints:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy điểm kiểm tra quá hạn',
        error: error.message
      };
    }
  }

  async getCheckpointsByInspector(inspectorId) {
    try {
      const checkpoints = await QualityCheckpoint.find({ inspector_id: inspectorId })
        .populate('task_id', 'task_name task_code')
        .sort({ scheduled_date: -1 });

      return {
        success: true,
        data: checkpoints,
        message: 'Lấy điểm kiểm tra theo thanh tra viên thành công'
      };
    } catch (error) {
      console.error('Error getting checkpoints by inspector:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy điểm kiểm tra theo thanh tra viên',
        error: error.message
      };
    }
  }
}

module.exports = new QualityCheckpointService();
