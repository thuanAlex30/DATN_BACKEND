const ProjectRisk = require('../models/projectRisk');

class ProjectRiskRepository {
  // ========== BASIC CRUD ==========
  async getAllRisks(filters = {}) {
    try {
      const query = {};
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.phase_id) {
        query.phase_id = filters.phase_id;
      }
      if (filters.risk_name) {
        query.risk_name = { $regex: filters.risk_name, $options: 'i' };
      }
      if (filters.risk_category) {
        query.risk_category = filters.risk_category;
      }
      if (filters.risk_level) {
        query.risk_level = filters.risk_level;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.owner_id) {
        query.owner_id = filters.owner_id;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting risks:', error);
      throw error;
    }
  }

  async getRiskById(id) {
    try {
      const risk = await ProjectRisk.findById(id)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return risk;
    } catch (error) {
      console.error('Error getting risk by id:', error);
      throw error;
    }
  }

  async createRisk(riskData) {
    try {
      const risk = new ProjectRisk(riskData);
      await risk.save();
      
      return await this.getRiskById(risk._id);
    } catch (error) {
      console.error('Error creating risk:', error);
      throw error;
    }
  }

  async updateRisk(id, updateData) {
    try {
      const risk = await ProjectRisk.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      )
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email');

      return risk;
    } catch (error) {
      console.error('Error updating risk:', error);
      throw error;
    }
  }

  async deleteRisk(id) {
    try {
      const risk = await ProjectRisk.findByIdAndDelete(id);
      return risk;
    } catch (error) {
      console.error('Error deleting risk:', error);
      throw error;
    }
  }

  // ========== PROJECT RISK QUERIES ==========
  async getProjectRisks(projectId) {
    try {
      const risks = await ProjectRisk.find({ project_id: projectId })
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting project risks:', error);
      throw error;
    }
  }

  async getPhaseRisks(phaseId) {
    try {
      const risks = await ProjectRisk.find({ phase_id: phaseId })
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting phase risks:', error);
      throw error;
    }
  }

  async getRisksByLevel(riskLevel, projectId = null) {
    try {
      const query = { risk_level: riskLevel };
      if (projectId) {
        query.project_id = projectId;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting risks by level:', error);
      throw error;
    }
  }

  async getRisksByCategory(category, projectId = null) {
    try {
      const query = { risk_category: category };
      if (projectId) {
        query.project_id = projectId;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting risks by category:', error);
      throw error;
    }
  }

  async getRisksByStatus(status, projectId = null) {
    try {
      const query = { status };
      if (projectId) {
        query.project_id = projectId;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting risks by status:', error);
      throw error;
    }
  }

  async getUserRisks(userId, filters = {}) {
    try {
      const query = { owner_id: userId };
      
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.risk_level) {
        query.risk_level = filters.risk_level;
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting user risks:', error);
      throw error;
    }
  }

  async getHighRiskRisks(projectId = null) {
    try {
      const query = { risk_level: 'HIGH' };
      if (projectId) {
        query.project_id = projectId;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error getting high risk risks:', error);
      throw error;
    }
  }

  // ========== RISK VALIDATION ==========
  async validateRisk(riskData) {
    try {
      const errors = [];

      // Check required fields
      if (!riskData.project_id) {
        errors.push('Project ID is required');
      }
      if (!riskData.risk_name) {
        errors.push('Risk name is required');
      }
      if (!riskData.risk_category) {
        errors.push('Risk category is required');
      }
      if (!riskData.risk_level) {
        errors.push('Risk level is required');
      }
      if (!riskData.owner_id) {
        errors.push('Owner ID is required');
      }

      // Check if risk level is valid
      const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (riskData.risk_level && !validRiskLevels.includes(riskData.risk_level)) {
        errors.push('Invalid risk level');
      }

      // Check if risk category is valid
      const validRiskCategories = ['TECHNICAL', 'SCHEDULE', 'RESOURCE', 'QUALITY', 'EXTERNAL', 'OTHER'];
      if (riskData.risk_category && !validRiskCategories.includes(riskData.risk_category)) {
        errors.push('Invalid risk category');
      }

      // Check if status is valid
      const validStatuses = ['IDENTIFIED', 'ANALYZED', 'MITIGATED', 'ACCEPTED', 'CLOSED'];
      if (riskData.status && !validStatuses.includes(riskData.status)) {
        errors.push('Invalid status');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating risk:', error);
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // ========== RISK ANALYTICS ==========
  async getRiskAnalytics(projectId) {
    try {
      const risks = await ProjectRisk.find({ project_id: projectId });
      
      const analytics = {
        total_risks: risks.length,
        high_risks: risks.filter(r => r.risk_level === 'HIGH').length,
        medium_risks: risks.filter(r => r.risk_level === 'MEDIUM').length,
        low_risks: risks.filter(r => r.risk_level === 'LOW').length,
        critical_risks: risks.filter(r => r.risk_level === 'CRITICAL').length,
        identified_risks: risks.filter(r => r.status === 'IDENTIFIED').length,
        analyzed_risks: risks.filter(r => r.status === 'ANALYZED').length,
        mitigated_risks: risks.filter(r => r.status === 'MITIGATED').length,
        accepted_risks: risks.filter(r => r.status === 'ACCEPTED').length,
        closed_risks: risks.filter(r => r.status === 'CLOSED').length,
        risks_by_level: risks.reduce((acc, risk) => {
          acc[risk.risk_level] = (acc[risk.risk_level] || 0) + 1;
          return acc;
        }, {}),
        risks_by_category: risks.reduce((acc, risk) => {
          acc[risk.risk_category] = (acc[risk.risk_category] || 0) + 1;
          return acc;
        }, {}),
        risks_by_status: risks.reduce((acc, risk) => {
          acc[risk.status] = (acc[risk.status] || 0) + 1;
          return acc;
        }, {}),
        average_risk_score: risks.length > 0 ? 
          (risks.reduce((sum, risk) => sum + risk.risk_score, 0) / risks.length).toFixed(2) : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting risk analytics:', error);
      throw error;
    }
  }

  async getRiskStats(filters = {}) {
    try {
      const query = {};
      if (filters.project_id) {
        query.project_id = filters.project_id;
      }

      const risks = await ProjectRisk.find(query);
      
      const stats = {
        total_risks: risks.length,
        risks_by_level: risks.reduce((acc, risk) => {
          acc[risk.risk_level] = (acc[risk.risk_level] || 0) + 1;
          return acc;
        }, {}),
        risks_by_category: risks.reduce((acc, risk) => {
          acc[risk.risk_category] = (acc[risk.risk_category] || 0) + 1;
          return acc;
        }, {}),
        risks_by_status: risks.reduce((acc, risk) => {
          acc[risk.status] = (acc[risk.status] || 0) + 1;
          return acc;
        }, {}),
        risks_by_project: risks.reduce((acc, risk) => {
          const projectId = risk.project_id.toString();
          acc[projectId] = (acc[projectId] || 0) + 1;
          return acc;
        }, {}),
        high_risks: risks.filter(r => r.risk_level === 'HIGH').length,
        critical_risks: risks.filter(r => r.risk_level === 'CRITICAL').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting risk stats:', error);
      throw error;
    }
  }

  // ========== RISK MANAGEMENT ==========
  async updateRiskScore(id, probability, impact) {
    try {
      const riskScore = probability * impact;
      const riskLevel = this.calculateRiskLevel(riskScore);

      const updateData = {
        probability,
        impact,
        risk_score: riskScore,
        risk_level: riskLevel
      };

      return await this.updateRisk(id, updateData);
    } catch (error) {
      console.error('Error updating risk score:', error);
      throw error;
    }
  }

  calculateRiskLevel(riskScore) {
    if (riskScore >= 16) return 'CRITICAL';
    if (riskScore >= 12) return 'HIGH';
    if (riskScore >= 8) return 'MEDIUM';
    return 'LOW';
  }

  async mitigateRisk(id, mitigationPlan, mitigatedBy) {
    try {
      const updateData = {
        status: 'MITIGATED',
        mitigation_plan: mitigationPlan,
        mitigated_at: new Date(),
        mitigated_by: mitigatedBy
      };

      return await this.updateRisk(id, updateData);
    } catch (error) {
      console.error('Error mitigating risk:', error);
      throw error;
    }
  }

  async acceptRisk(id, acceptanceReason, acceptedBy) {
    try {
      const updateData = {
        status: 'ACCEPTED',
        acceptance_reason: acceptanceReason,
        accepted_at: new Date(),
        accepted_by: acceptedBy
      };

      return await this.updateRisk(id, updateData);
    } catch (error) {
      console.error('Error accepting risk:', error);
      throw error;
    }
  }

  async closeRisk(id, closureReason, closedBy) {
    try {
      const updateData = {
        status: 'CLOSED',
        closure_reason: closureReason,
        closed_at: new Date(),
        closed_by: closedBy
      };

      return await this.updateRisk(id, updateData);
    } catch (error) {
      console.error('Error closing risk:', error);
      throw error;
    }
  }

  // ========== RISK SEARCH ==========
  async searchRisks(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { risk_name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { impact_description: { $regex: searchTerm, $options: 'i' } },
          { mitigation_plan: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (filters.project_id) {
        query.project_id = filters.project_id;
      }
      if (filters.risk_level) {
        query.risk_level = filters.risk_level;
      }
      if (filters.risk_category) {
        query.risk_category = filters.risk_category;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.owner_id) {
        query.owner_id = filters.owner_id;
      }

      const risks = await ProjectRisk.find(query)
        .populate('project_id', 'project_name project_code')
        .populate('phase_id', 'phase_name')
        .populate('owner_id', 'full_name email')
        .populate('created_by', 'full_name email')
        .populate('updated_by', 'full_name email')
        .sort({ risk_score: -1, identified_date: -1 });

      return risks;
    } catch (error) {
      console.error('Error searching risks:', error);
      throw error;
    }
  }

  // ========== RISK REPORTS ==========
  async generateRiskReport(projectId) {
    try {
      const risks = await this.getProjectRisks(projectId);
      const analytics = await this.getRiskAnalytics(projectId);
      
      const report = {
        project_id: projectId,
        generated_at: new Date(),
        risks: risks,
        analytics: analytics,
        summary: {
          total_risks: analytics.total_risks,
          high_risks: analytics.high_risks,
          critical_risks: analytics.critical_risks,
          average_risk_score: analytics.average_risk_score
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating risk report:', error);
      throw error;
    }
  }
}

module.exports = new ProjectRiskRepository();
