const ProjectChangeRequest = require('../models/projectChangeRequest');

class ProjectChangeRequestService {
  async getProjectChangeRequests(projectId) {
    try {
      const changeRequests = await ProjectChangeRequest.find({ project_id: projectId })
        .populate('project_id', 'project_name')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email')
        .sort({ requested_at: -1 });

      return {
        success: true,
        data: changeRequests,
        message: 'Lấy danh sách yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error getting project change requests:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async getChangeRequestById(id) {
    try {
      const changeRequest = await ProjectChangeRequest.findById(id)
        .populate('project_id', 'project_name')
        .populate('requested_by', 'full_name email')
        .populate('approved_by', 'full_name email');

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        data: changeRequest,
        message: 'Lấy thông tin yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error getting change request:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async createChangeRequest(changeData, userId) {
    try {
      const requiredFields = ['project_id', 'change_title', 'description', 'change_type', 'justification'];
      for (const field of requiredFields) {
        if (!changeData[field]) {
          return {
            success: false,
            message: `Trường ${field} là bắt buộc`
          };
        }
      }

      const changeRequest = new ProjectChangeRequest({
        ...changeData,
        requested_by: userId
      });

      await changeRequest.save();

      return {
        success: true,
        data: changeRequest,
        message: 'Tạo yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error creating change request:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async updateChangeRequest(id, updateData, userId) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true }
      );

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        data: changeRequest,
        message: 'Cập nhật yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error updating change request:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async deleteChangeRequest(id, userId) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndDelete(id);

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        message: 'Xóa yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error deleting change request:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async submitChangeRequest(id, userId) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndUpdate(
        id,
        { 
          status: 'UNDER_REVIEW',
          updated_at: new Date()
        },
        { new: true }
      );

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        data: changeRequest,
        message: 'Nộp yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error submitting change request:', error);
      return {
        success: false,
        message: 'Lỗi khi nộp yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async approveChangeRequest(id, notes, userId) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndUpdate(
        id,
        { 
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date(),
          approval_notes: notes,
          updated_at: new Date()
        },
        { new: true }
      );

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        data: changeRequest,
        message: 'Phê duyệt yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error approving change request:', error);
      return {
        success: false,
        message: 'Lỗi khi phê duyệt yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async rejectChangeRequest(id, notes, userId) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndUpdate(
        id,
        { 
          status: 'REJECTED',
          approved_by: userId,
          approved_at: new Date(),
          approval_notes: notes,
          updated_at: new Date()
        },
        { new: true }
      );

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        data: changeRequest,
        message: 'Từ chối yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error rejecting change request:', error);
      return {
        success: false,
        message: 'Lỗi khi từ chối yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async implementChangeRequest(id, userId) {
    try {
      const changeRequest = await ProjectChangeRequest.findByIdAndUpdate(
        id,
        { 
          status: 'IMPLEMENTED',
          implementation_date: new Date(),
          updated_at: new Date()
        },
        { new: true }
      );

      if (!changeRequest) {
        return {
          success: false,
          message: 'Không tìm thấy yêu cầu thay đổi'
        };
      }

      return {
        success: true,
        data: changeRequest,
        message: 'Thực hiện yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error implementing change request:', error);
      return {
        success: false,
        message: 'Lỗi khi thực hiện yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async getChangeRequestStats() {
    try {
      const totalRequests = await ProjectChangeRequest.countDocuments();
      const requestsByStatus = await ProjectChangeRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const requestsByType = await ProjectChangeRequest.aggregate([
        { $group: { _id: '$change_type', count: { $sum: 1 } } }
      ]);

      const stats = {
        total_requests: totalRequests,
        requests_by_status: requestsByStatus,
        requests_by_type: requestsByType
      };

      return {
        success: true,
        data: stats,
        message: 'Lấy thống kê yêu cầu thay đổi thành công'
      };
    } catch (error) {
      console.error('Error getting change request stats:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thống kê yêu cầu thay đổi',
        error: error.message
      };
    }
  }

  async getPendingChangeRequests() {
    try {
      const changeRequests = await ProjectChangeRequest.find({ status: 'PENDING' })
        .populate('project_id', 'project_name')
        .populate('requested_by', 'full_name email')
        .sort({ requested_at: -1 });

      return {
        success: true,
        data: changeRequests,
        message: 'Lấy yêu cầu thay đổi đang chờ thành công'
      };
    } catch (error) {
      console.error('Error getting pending change requests:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy yêu cầu thay đổi đang chờ',
        error: error.message
      };
    }
  }
}

module.exports = new ProjectChangeRequestService();
