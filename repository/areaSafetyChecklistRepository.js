const AreaSafetyChecklist = require('../models/areaSafetyChecklist');
const SiteArea = require('../models/siteArea');

class AreaSafetyChecklistRepository {
  // ========== CHECKLIST CRUD ==========
  async getAllChecklists(filters = {}) {
    const query = {};
    
    if (filters.area_id) {
      query.area_id = filters.area_id;
    }
    
    if (filters.frequency) {
      query.frequency = filters.frequency;
    }
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }
    
    if (filters.checklist_name) {
      query.checklist_name = { $regex: filters.checklist_name, $options: 'i' };
    }

    return await AreaSafetyChecklist.find(query)
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  async getChecklistById(id) {
    return await AreaSafetyChecklist.findById(id)
      .populate('area_id', 'area_name area_code');
  }

  async createChecklist(checklistData) {
    const checklist = new AreaSafetyChecklist(checklistData);
    return await checklist.save();
  }

  async updateChecklist(id, updateData) {
    return await AreaSafetyChecklist.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteChecklist(id) {
    return await AreaSafetyChecklist.findByIdAndDelete(id);
  }

  // ========== AREA CHECKLIST MANAGEMENT ==========
  async getAreaChecklists(areaId) {
    return await AreaSafetyChecklist.find({ area_id: areaId })
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  async getActiveAreaChecklists(areaId) {
    return await AreaSafetyChecklist.find({ 
      area_id: areaId,
      is_active: true 
    })
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  // ========== CHECKLIST VALIDATION ==========
  async validateChecklist(checklistData) {
    // Check if area exists
    const area = await SiteArea.findById(checklistData.area_id);
    if (!area) {
      return { valid: false, message: 'Khu vực không tồn tại' };
    }

    // Validate frequency
    const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'AS_NEEDED'];
    if (!validFrequencies.includes(checklistData.frequency)) {
      return { valid: false, message: 'Tần suất kiểm tra không hợp lệ' };
    }

    // Validate safety_items structure
    if (!Array.isArray(checklistData.safety_items) || checklistData.safety_items.length === 0) {
      return { valid: false, message: 'Danh sách mục an toàn phải là mảng không rỗng' };
    }

    // Validate each safety item
    for (const item of checklistData.safety_items) {
      if (!item.item_name || !item.description) {
        return { valid: false, message: 'Mỗi mục an toàn phải có tên và mô tả' };
      }
    }

    return { valid: true };
  }

  // ========== CHECKLIST TEMPLATES ==========
  async getChecklistTemplates() {
    return {
      CONSTRUCTION: {
        checklist_name: 'Checklist An toàn Xây dựng',
        safety_items: [
          {
            item_name: 'Kiểm tra thiết bị bảo hộ cá nhân',
            description: 'Đảm bảo tất cả công nhân đeo đầy đủ PPE',
            is_critical: true
          },
          {
            item_name: 'Kiểm tra giàn giáo',
            description: 'Kiểm tra độ ổn định và an toàn của giàn giáo',
            is_critical: true
          },
          {
            item_name: 'Kiểm tra hệ thống điện',
            description: 'Kiểm tra dây điện và thiết bị điện an toàn',
            is_critical: true
          },
          {
            item_name: 'Kiểm tra khu vực làm việc',
            description: 'Đảm bảo khu vực sạch sẽ và không có vật cản',
            is_critical: false
          }
        ],
        frequency: 'DAILY'
      },
      STORAGE: {
        checklist_name: 'Checklist An toàn Kho bãi',
        safety_items: [
          {
            item_name: 'Kiểm tra hệ thống chống cháy',
            description: 'Kiểm tra bình chữa cháy và hệ thống báo cháy',
            is_critical: true
          },
          {
            item_name: 'Kiểm tra lối thoát hiểm',
            description: 'Đảm bảo lối thoát hiểm không bị chặn',
            is_critical: true
          },
          {
            item_name: 'Kiểm tra vật liệu lưu trữ',
            description: 'Kiểm tra vật liệu được sắp xếp an toàn',
            is_critical: false
          }
        ],
        frequency: 'WEEKLY'
      },
      OFFICE: {
        checklist_name: 'Checklist An toàn Văn phòng',
        safety_items: [
          {
            item_name: 'Kiểm tra hệ thống điện',
            description: 'Kiểm tra ổ cắm và dây điện',
            is_critical: false
          },
          {
            item_name: 'Kiểm tra lối thoát hiểm',
            description: 'Đảm bảo lối thoát hiểm rõ ràng',
            is_critical: true
          },
          {
            item_name: 'Kiểm tra thiết bị văn phòng',
            description: 'Kiểm tra máy tính và thiết bị văn phòng',
            is_critical: false
          }
        ],
        frequency: 'MONTHLY'
      }
    };
  }

  async createFromTemplate(areaId, templateType, customizations = {}) {
    const templates = await this.getChecklistTemplates();
    const template = templates[templateType];

    if (!template) {
      throw new Error('Mẫu checklist không tồn tại');
    }

    const checklistData = {
      area_id: areaId,
      checklist_name: customizations.checklist_name || template.checklist_name,
      safety_items: customizations.safety_items || template.safety_items,
      frequency: customizations.frequency || template.frequency,
      description: customizations.description || `Checklist được tạo từ mẫu ${templateType}`,
      is_active: true
    };

    return await this.createChecklist(checklistData);
  }

  // ========== CHECKLIST QUERIES ==========
  async getChecklistsByFrequency(frequency) {
    const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'AS_NEEDED'];
    if (!validFrequencies.includes(frequency)) {
      throw new Error('Tần suất kiểm tra không hợp lệ');
    }

    return await AreaSafetyChecklist.find({ 
      frequency: frequency,
      is_active: true 
    })
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  async getActiveChecklists(areaId = null) {
    const query = { is_active: true };
    
    if (areaId) {
      query.area_id = areaId;
    }

    return await AreaSafetyChecklist.find(query)
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  async searchChecklists(searchTerm, filters = {}) {
    const query = {
      $or: [
        { checklist_name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (filters.area_id) {
      query.area_id = filters.area_id;
    }
    
    if (filters.frequency) {
      query.frequency = filters.frequency;
    }
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    return await AreaSafetyChecklist.find(query)
      .populate('area_id', 'area_name area_code')
      .sort({ created_at: -1 });
  }

  // ========== CHECKLIST ANALYTICS ==========
  async getChecklistAnalytics(areaId) {
    const checklists = await AreaSafetyChecklist.find({ area_id: areaId });
    
    const totalChecklists = checklists.length;
    const activeChecklists = checklists.filter(c => c.is_active).length;
    
    const frequencyDistribution = checklists.reduce((acc, checklist) => {
      acc[checklist.frequency] = (acc[checklist.frequency] || 0) + 1;
      return acc;
    }, {});

    const totalSafetyItems = checklists.reduce((sum, checklist) => {
      return sum + (checklist.safety_items ? checklist.safety_items.length : 0);
    }, 0);

    const criticalItemsCount = checklists.reduce((sum, checklist) => {
      if (!checklist.safety_items) return sum;
      return sum + checklist.safety_items.filter(item => item.is_critical).length;
    }, 0);

    return {
      area_id: areaId,
      total_checklists: totalChecklists,
      active_checklists: activeChecklists,
      inactive_checklists: totalChecklists - activeChecklists,
      frequency_distribution: frequencyDistribution,
      total_safety_items: totalSafetyItems,
      critical_items_count: criticalItemsCount,
      average_items_per_checklist: totalChecklists > 0 ? totalSafetyItems / totalChecklists : 0
    };
  }

  async getChecklistStats(filters = {}) {
    const query = {};
    
    if (filters.area_id) {
      query.area_id = filters.area_id;
    }
    
    if (filters.frequency) {
      query.frequency = filters.frequency;
    }
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    const totalChecklists = await AreaSafetyChecklist.countDocuments(query);
    
    const checklistsByFrequency = await AreaSafetyChecklist.aggregate([
      { $match: query },
      { $group: { _id: '$frequency', count: { $sum: 1 } } }
    ]);

    const checklistsByArea = await AreaSafetyChecklist.aggregate([
      { $match: query },
      { $group: { _id: '$area_id', count: { $sum: 1 } } },
      { $lookup: { from: 'siteareas', localField: '_id', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $project: { area_id: '$_id', area_name: '$area.area_name', count: 1 } }
    ]);

    return {
      total_checklists: totalChecklists,
      checklists_by_frequency: checklistsByFrequency,
      checklists_by_area: checklistsByArea
    };
  }

  // ========== SAFETY ITEMS ANALYSIS ==========
  async getSafetyItemsAnalysis(areaId) {
    const checklists = await AreaSafetyChecklist.find({ area_id: areaId });
    
    const allSafetyItems = [];
    checklists.forEach(checklist => {
      if (checklist.safety_items) {
        checklist.safety_items.forEach(item => {
          allSafetyItems.push({
            item_name: item.item_name,
            description: item.description,
            is_critical: item.is_critical || false,
            checklist_name: checklist.checklist_name,
            frequency: checklist.frequency
          });
        });
      }
    });

    const criticalItems = allSafetyItems.filter(item => item.is_critical);
    const nonCriticalItems = allSafetyItems.filter(item => !item.is_critical);

    const frequencyDistribution = allSafetyItems.reduce((acc, item) => {
      acc[item.frequency] = (acc[item.frequency] || 0) + 1;
      return acc;
    }, {});

    const uniqueItems = allSafetyItems.reduce((acc, item) => {
      const key = item.item_name.toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          item_name: item.item_name,
          description: item.description,
          is_critical: item.is_critical,
          frequency: item.frequency,
          count: 1
        };
      } else {
        acc[key].count++;
      }
      return acc;
    }, {});

    return {
      area_id: areaId,
      total_safety_items: allSafetyItems.length,
      critical_items: criticalItems.length,
      non_critical_items: nonCriticalItems.length,
      unique_items: Object.keys(uniqueItems).length,
      frequency_distribution: frequencyDistribution,
      items_by_criticality: {
        critical: criticalItems.length,
        non_critical: nonCriticalItems.length
      },
      unique_items_list: Object.values(uniqueItems)
    };
  }

  // ========== CHECKLIST COMPARISON ==========
  async compareChecklists(checklistIds) {
    const checklists = await AreaSafetyChecklist.find({
      _id: { $in: checklistIds }
    })
      .populate('area_id', 'area_name area_code');

    if (checklists.length < 2) {
      throw new Error('Cần ít nhất 2 checklist để so sánh');
    }

    const comparison = {
      checklists: checklists.map(checklist => ({
        id: checklist._id,
        name: checklist.checklist_name,
        area_name: checklist.area_id.area_name,
        frequency: checklist.frequency,
        total_items: checklist.safety_items ? checklist.safety_items.length : 0,
        critical_items: checklist.safety_items ? 
          checklist.safety_items.filter(item => item.is_critical).length : 0
      })),
      common_items: [],
      unique_items: {},
      frequency_analysis: {},
      criticality_analysis: {}
    };

    // Find common items
    const allItems = checklists.map(c => c.safety_items || []);
    const firstChecklistItems = allItems[0];
    
    firstChecklistItems.forEach(item => {
      const isCommon = allItems.every(checklistItems => 
        checklistItems.some(ci => ci.item_name === item.item_name)
      );
      
      if (isCommon) {
        comparison.common_items.push({
          item_name: item.item_name,
          description: item.description,
          is_critical: item.is_critical
        });
      }
    });

    // Find unique items for each checklist
    checklists.forEach((checklist, index) => {
      const checklistItems = checklist.safety_items || [];
      const uniqueItems = checklistItems.filter(item => 
        !comparison.common_items.some(ci => ci.item_name === item.item_name)
      );
      
      comparison.unique_items[checklist.checklist_name] = uniqueItems;
    });

    // Frequency analysis
    const frequencies = checklists.map(c => c.frequency);
    comparison.frequency_analysis = frequencies.reduce((acc, freq) => {
      acc[freq] = (acc[freq] || 0) + 1;
      return acc;
    }, {});

    // Criticality analysis
    checklists.forEach(checklist => {
      const criticalItems = checklist.safety_items ? 
        checklist.safety_items.filter(item => item.is_critical).length : 0;
      const totalItems = checklist.safety_items ? checklist.safety_items.length : 0;
      
      comparison.criticality_analysis[checklist.checklist_name] = {
        critical_items: criticalItems,
        total_items: totalItems,
        criticality_ratio: totalItems > 0 ? criticalItems / totalItems : 0
      };
    });

    return comparison;
  }

  // ========== CHECKLIST EXPORT ==========
  async exportChecklists(areaId, format = 'json') {
    const checklists = await AreaSafetyChecklist.find({ area_id: areaId })
      .populate('area_id', 'area_name area_code');

    if (format === 'json') {
      return checklists;
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = [];
      checklists.forEach(checklist => {
        const baseRow = {
          checklist_name: checklist.checklist_name,
          area_name: checklist.area_id.area_name,
          frequency: checklist.frequency,
          description: checklist.description,
          is_active: checklist.is_active,
          created_at: checklist.created_at
        };

        if (checklist.safety_items && checklist.safety_items.length > 0) {
          checklist.safety_items.forEach((item, index) => {
            csvData.push({
              ...baseRow,
              item_index: index + 1,
              item_name: item.item_name,
              item_description: item.description,
              is_critical: item.is_critical
            });
          });
        } else {
          csvData.push(baseRow);
        }
      });

      return csvData;
    }

    throw new Error('Format không được hỗ trợ');
  }
}

module.exports = new AreaSafetyChecklistRepository();
