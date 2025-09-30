const AreaInspection = require('../models/areaInspection');
const SiteArea = require('../models/siteArea');
const AreaSafetyChecklist = require('../models/areaSafetyChecklist');
const User = require('../models/user');

class AreaInspectionRepository {
  // ========== INSPECTION CRUD ==========
  async getAllInspections(filters = {}) {
    const query = {};
    
    if (filters.area_id) {
      query.area_id = filters.area_id;
    }
    
    if (filters.inspector_id) {
      query.inspector_id = filters.inspector_id;
    }
    
    if (filters.checklist_id) {
      query.checklist_id = filters.checklist_id;
    }
    
    if (filters.inspection_type) {
      query.inspection_type = filters.inspection_type;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.start_date && filters.end_date) {
      query.inspection_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    return await AreaInspection.find(query)
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name')
      .populate('inspector_id', 'full_name email')
      .sort({ inspection_date: -1 });
  }

  async getInspectionById(id) {
    return await AreaInspection.findById(id)
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name safety_items')
      .populate('inspector_id', 'full_name email');
  }

  async createInspection(inspectionData) {
    const inspection = new AreaInspection(inspectionData);
    return await inspection.save();
  }

  async updateInspection(id, updateData) {
    return await AreaInspection.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteInspection(id) {
    return await AreaInspection.findByIdAndDelete(id);
  }

  // ========== INSPECTION SCHEDULING ==========
  async getScheduledInspections(areaId, startDate, endDate) {
    return await AreaInspection.find({
      area_id: areaId,
      inspection_date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
    })
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name')
      .populate('inspector_id', 'full_name email')
      .sort({ inspection_date: 1 });
  }

  async getInspectionsByInspector(inspectorId, filters = {}) {
    const query = { inspector_id: inspectorId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.start_date && filters.end_date) {
      query.inspection_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    return await AreaInspection.find(query)
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name')
      .sort({ inspection_date: -1 });
  }

  async getInspectionsByArea(areaId, filters = {}) {
    const query = { area_id: areaId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.start_date && filters.end_date) {
      query.inspection_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    return await AreaInspection.find(query)
      .populate('checklist_id', 'checklist_name')
      .populate('inspector_id', 'full_name email')
      .sort({ inspection_date: -1 });
  }

  // ========== INSPECTION VALIDATION ==========
  async validateInspection(inspectionData) {
    // Check if area exists
    const area = await SiteArea.findById(inspectionData.area_id);
    if (!area) {
      return { valid: false, message: 'Khu vực không tồn tại' };
    }

    // Check if checklist exists
    const checklist = await AreaSafetyChecklist.findById(inspectionData.checklist_id);
    if (!checklist) {
      return { valid: false, message: 'Checklist không tồn tại' };
    }

    // Check if inspector exists
    const inspector = await User.findById(inspectionData.inspector_id);
    if (!inspector) {
      return { valid: false, message: 'Thanh tra viên không tồn tại' };
    }

    // Validate inspection type
    const validTypes = ['ROUTINE', 'SPECIAL', 'EMERGENCY', 'COMPLIANCE'];
    if (!validTypes.includes(inspectionData.inspection_type)) {
      return { valid: false, message: 'Loại kiểm tra không hợp lệ' };
    }

    // Check for overlapping inspections
    const overlappingInspection = await AreaInspection.findOne({
      area_id: inspectionData.area_id,
      inspector_id: inspectionData.inspector_id,
      inspection_date: inspectionData.inspection_date,
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
    });

    if (overlappingInspection) {
      return { valid: false, message: 'Thanh tra viên đã có lịch kiểm tra tại khu vực này trong ngày này' };
    }

    return { valid: true };
  }

  // ========== INSPECTION ANALYTICS ==========
  async getInspectionAnalytics(areaId) {
    const inspections = await AreaInspection.find({ area_id: areaId });
    
    const totalInspections = inspections.length;
    const completedInspections = inspections.filter(i => i.status === 'COMPLETED').length;
    const scheduledInspections = inspections.filter(i => i.status === 'SCHEDULED').length;
    const inProgressInspections = inspections.filter(i => i.status === 'IN_PROGRESS').length;
    
    const typeDistribution = inspections.reduce((acc, inspection) => {
      acc[inspection.inspection_type] = (acc[inspection.inspection_type] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = inspections.reduce((acc, inspection) => {
      acc[inspection.status] = (acc[inspection.status] || 0) + 1;
      return acc;
    }, {});

    const safetyScoreDistribution = inspections
      .filter(i => i.safety_score !== null && i.safety_score !== undefined)
      .reduce((acc, inspection) => {
        const score = inspection.safety_score;
        const range = score >= 90 ? 'EXCELLENT' : score >= 80 ? 'GOOD' : score >= 70 ? 'FAIR' : 'POOR';
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {});

    const averageSafetyScore = inspections
      .filter(i => i.safety_score !== null && i.safety_score !== undefined)
      .reduce((sum, i) => sum + i.safety_score, 0) / 
      inspections.filter(i => i.safety_score !== null && i.safety_score !== undefined).length || 0;

    return {
      area_id: areaId,
      total_inspections: totalInspections,
      completed_inspections: completedInspections,
      scheduled_inspections: scheduledInspections,
      in_progress_inspections: inProgressInspections,
      type_distribution: typeDistribution,
      status_distribution: statusDistribution,
      safety_score_distribution: safetyScoreDistribution,
      average_safety_score: Math.round(averageSafetyScore * 100) / 100
    };
  }

  async getInspectorAnalytics(inspectorId) {
    const inspections = await AreaInspection.find({ inspector_id: inspectorId });
    
    const totalInspections = inspections.length;
    const completedInspections = inspections.filter(i => i.status === 'COMPLETED').length;
    
    const averageSafetyScore = inspections
      .filter(i => i.safety_score !== null && i.safety_score !== undefined)
      .reduce((sum, i) => sum + i.safety_score, 0) / 
      inspections.filter(i => i.safety_score !== null && i.safety_score !== undefined).length || 0;

    const inspectionsByArea = await AreaInspection.aggregate([
      { $match: { inspector_id: inspectorId } },
      { $group: { _id: '$area_id', count: { $sum: 1 } } },
      { $lookup: { from: 'siteareas', localField: '_id', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $project: { area_id: '$_id', area_name: '$area.area_name', count: 1 } }
    ]);

    const inspectionsByType = await AreaInspection.aggregate([
      { $match: { inspector_id: inspectorId } },
      { $group: { _id: '$inspection_type', count: { $sum: 1 } } }
    ]);

    return {
      inspector_id: inspectorId,
      total_inspections: totalInspections,
      completed_inspections: completedInspections,
      completion_rate: totalInspections > 0 ? (completedInspections / totalInspections) * 100 : 0,
      average_safety_score: Math.round(averageSafetyScore * 100) / 100,
      inspections_by_area: inspectionsByArea,
      inspections_by_type: inspectionsByType
    };
  }

  // ========== INSPECTION STATISTICS ==========
  async getInspectionStats(filters = {}) {
    const query = {};
    
    if (filters.area_id) {
      query.area_id = filters.area_id;
    }
    
    if (filters.inspector_id) {
      query.inspector_id = filters.inspector_id;
    }
    
    if (filters.inspection_type) {
      query.inspection_type = filters.inspection_type;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.start_date && filters.end_date) {
      query.inspection_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    const totalInspections = await AreaInspection.countDocuments(query);
    
    const inspectionsByType = await AreaInspection.aggregate([
      { $match: query },
      { $group: { _id: '$inspection_type', count: { $sum: 1 } } }
    ]);

    const inspectionsByStatus = await AreaInspection.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const inspectionsByArea = await AreaInspection.aggregate([
      { $match: query },
      { $group: { _id: '$area_id', count: { $sum: 1 } } },
      { $lookup: { from: 'siteareas', localField: '_id', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $project: { area_id: '$_id', area_name: '$area.area_name', count: 1 } }
    ]);

    const inspectionsByInspector = await AreaInspection.aggregate([
      { $match: query },
      { $group: { _id: '$inspector_id', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'inspector' } },
      { $unwind: '$inspector' },
      { $project: { inspector_id: '$_id', inspector_name: '$inspector.full_name', count: 1 } }
    ]);

    return {
      total_inspections: totalInspections,
      inspections_by_type: inspectionsByType,
      inspections_by_status: inspectionsByStatus,
      inspections_by_area: inspectionsByArea,
      inspections_by_inspector: inspectionsByInspector
    };
  }

  // ========== SAFETY SCORE ANALYSIS ==========
  async getSafetyScoreTrend(areaId, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const inspections = await AreaInspection.find({
      area_id: areaId,
      inspection_date: { $gte: startDate, $lte: endDate },
      safety_score: { $exists: true, $ne: null }
    })
      .sort({ inspection_date: 1 });

    const trendData = inspections.map(inspection => ({
      date: inspection.inspection_date,
      safety_score: inspection.safety_score,
      inspection_type: inspection.inspection_type
    }));

    // Calculate trend
    let trend = 'stable';
    if (trendData.length >= 2) {
      const firstScore = trendData[0].safety_score;
      const lastScore = trendData[trendData.length - 1].safety_score;
      const scoreDiff = lastScore - firstScore;
      
      if (scoreDiff > 5) trend = 'improving';
      else if (scoreDiff < -5) trend = 'declining';
    }

    return {
      area_id: areaId,
      period_days: days,
      trend: trend,
      data: trendData,
      average_score: trendData.length > 0 
        ? Math.round(trendData.reduce((sum, d) => sum + d.safety_score, 0) / trendData.length * 100) / 100
        : 0
    };
  }

  async getSafetyScoreDistribution(filters = {}) {
    const query = { safety_score: { $exists: true, $ne: null } };
    
    if (filters.area_id) {
      query.area_id = filters.area_id;
    }
    
    if (filters.start_date && filters.end_date) {
      query.inspection_date = {
        $gte: new Date(filters.start_date),
        $lte: new Date(filters.end_date)
      };
    }

    const inspections = await AreaInspection.find(query).select('safety_score');

    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 80-89
      fair: 0,      // 70-79
      poor: 0       // 0-69
    };

    inspections.forEach(inspection => {
      const score = inspection.safety_score;
      if (score >= 90) distribution.excellent++;
      else if (score >= 80) distribution.good++;
      else if (score >= 70) distribution.fair++;
      else distribution.poor++;
    });

    return {
      total_inspections: inspections.length,
      distribution: distribution,
      percentages: {
        excellent: inspections.length > 0 ? Math.round((distribution.excellent / inspections.length) * 100) : 0,
        good: inspections.length > 0 ? Math.round((distribution.good / inspections.length) * 100) : 0,
        fair: inspections.length > 0 ? Math.round((distribution.fair / inspections.length) * 100) : 0,
        poor: inspections.length > 0 ? Math.round((distribution.poor / inspections.length) * 100) : 0
      }
    };
  }

  // ========== INSPECTION QUERIES ==========
  async getUpcomingInspections(days = 7) {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));

    return await AreaInspection.find({
      inspection_date: { $gte: startDate, $lte: endDate },
      status: 'SCHEDULED'
    })
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name')
      .populate('inspector_id', 'full_name email')
      .sort({ inspection_date: 1 });
  }

  async getOverdueInspections() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await AreaInspection.find({
      inspection_date: { $lt: today },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
    })
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name')
      .populate('inspector_id', 'full_name email')
      .sort({ inspection_date: 1 });
  }

  async getInspectionsByScoreRange(minScore, maxScore) {
    return await AreaInspection.find({
      safety_score: { $gte: minScore, $lte: maxScore }
    })
      .populate('area_id', 'area_name area_code')
      .populate('checklist_id', 'checklist_name')
      .populate('inspector_id', 'full_name email')
      .sort({ safety_score: -1 });
  }
}

module.exports = new AreaInspectionRepository();
