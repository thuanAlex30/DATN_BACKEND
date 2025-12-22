const UserCertificate = require('../models/userCertificate');
const { transformDocumentId, transformDocumentsId } = require('../utils/transformId');

class UserCertificateRepository {
  // Create new user certificate assignment
  async create(userCertificateData) {
    try {
      const userCertificate = new UserCertificate(userCertificateData);
      await userCertificate.save();
      return await this.getById(userCertificate._id);
    } catch (error) {
      console.error('Error creating user certificate:', error);
      throw error;
    }
  }

  // Find user certificate by ID
  async getById(id) {
    try {
      const userCertificate = await UserCertificate.findById(id)
        .populate({
          path: 'certificate_id',
          select: 'certificateName certificateCode category description',
          strictPopulate: false // Allow null certificate_id
        })
        .populate({
          path: 'user_id',
          select: 'full_name email role_id department_id',
          populate: [
            {
              path: 'role_id',
              select: 'role_name role_code role_level'
            },
            {
              path: 'department_id',
              select: 'department_name'
            }
          ]
        })
        .populate('assignedBy', 'full_name email')
        .populate('verifiedBy', 'full_name email')
        .lean();
      // Transform with populated fields to preserve populated objects
      const populatedFields = ['user_id', 'certificate_id', 'assignedBy', 'verifiedBy'];
      return userCertificate ? transformDocumentId(userCertificate, populatedFields) : null;
    } catch (error) {
      console.error('Error finding user certificate by ID:', error);
      throw error;
    }
  }

  // Update user certificate by ID
  async updateById(id, updateData) {
    try {
      const userCertificate = await UserCertificate.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate({
          path: 'certificate_id',
          select: 'certificateName certificateCode category description',
          strictPopulate: false // Allow null certificate_id
        })
        .populate({
          path: 'user_id',
          select: 'full_name email role_id department_id',
          populate: [
            {
              path: 'role_id',
              select: 'role_name role_code role_level'
            },
            {
              path: 'department_id',
              select: 'department_name'
            }
          ]
        })
        .populate('assignedBy', 'full_name email')
        .populate('verifiedBy', 'full_name email')
        .lean();
      // Transform with populated fields to preserve populated objects
      const populatedFields = ['user_id', 'certificate_id', 'assignedBy', 'verifiedBy'];
      return userCertificate ? transformDocumentId(userCertificate, populatedFields) : null;
    } catch (error) {
      console.error('Error updating user certificate:', error);
      throw error;
    }
  }

  // Delete user certificate by ID
  async deleteById(id) {
    try {
      const result = await UserCertificate.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting user certificate:', error);
      throw error;
    }
  }

  // Find user certificates with pagination and filters
  async getAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 }
      } = options;

      const skip = (page - 1) * limit;

      const query = UserCertificate.find(filters)
        .populate({
          path: 'certificate_id',
          select: 'certificateName certificateCode category description',
          strictPopulate: false // Allow null certificate_id
        })
        .populate({
          path: 'user_id',
          select: 'full_name email department_id role_id',
          populate: [
            {
              path: 'role_id',
              select: 'role_name role_code role_level'
            },
            {
              path: 'department_id',
              select: 'department_name'
            }
          ]
        })
        .populate('assignedBy', 'full_name email')
        .populate('verifiedBy', 'full_name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const [userCertificates, total] = await Promise.all([
        query.exec(),
        UserCertificate.countDocuments(filters)
      ]);
      
      // Convert to plain objects manually to preserve populated fields
      const plainUserCertificates = userCertificates.map(doc => {
        const plain = doc.toObject ? doc.toObject() : doc;
        return plain;
      });

      // Log raw data before transform for debugging
      if (plainUserCertificates.length > 0) {
        console.log('📋 Raw userCertificate before transform:', JSON.stringify(plainUserCertificates[0], null, 2));
        console.log('📋 user_id type:', typeof plainUserCertificates[0].user_id);
        console.log('📋 user_id value:', plainUserCertificates[0].user_id);
        console.log('📋 user_id isObject:', typeof plainUserCertificates[0].user_id === 'object');
        console.log('📋 certificate_id type:', typeof plainUserCertificates[0].certificate_id);
        console.log('📋 certificate_id value:', plainUserCertificates[0].certificate_id);
        console.log('📋 certificate_id isObject:', typeof plainUserCertificates[0].certificate_id === 'object');
      }

      // Transform with populated fields to preserve populated objects
      const populatedFields = ['user_id', 'certificate_id', 'assignedBy', 'verifiedBy'];
      const transformed = transformDocumentsId(plainUserCertificates, populatedFields);
      
      // Log transformed data for debugging
      if (transformed.length > 0) {
        console.log('📋 Transformed userCertificate:', JSON.stringify(transformed[0], null, 2));
        console.log('📋 Transformed user_id type:', typeof transformed[0].user_id);
        console.log('📋 Transformed user_id value:', transformed[0].user_id);
        console.log('📋 Transformed certificate_id type:', typeof transformed[0].certificate_id);
        console.log('📋 Transformed certificate_id value:', transformed[0].certificate_id);
      }
      
      return {
        data: transformed,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error finding user certificates with pagination:', error);
      throw error;
    }
  }

  // Find user certificates by department
  async getByDepartment(departmentId, filters = {}, options = {}) {
    try {
      const User = require('../models/user');
      
      // Get all users in the department
      const departmentUsers = await User.find({ 
        department_id: departmentId 
      }).select('_id').lean();
      
      const userIds = departmentUsers.map(u => u._id);
      
      if (userIds.length === 0) {
        return {
          data: [],
          pagination: {
            current: options.page || 1,
            pages: 0,
            total: 0,
            limit: options.limit || 10
          }
        };
      }

      // Build query with user filter
      const queryFilters = {
        ...filters,
        user_id: { $in: userIds }
      };

      return await this.getAll(queryFilters, options);
    } catch (error) {
      console.error('Error finding user certificates by department:', error);
      throw error;
    }
  }

  // Find user certificates by user ID
  async getByUserId(userId, filters = {}, options = {}) {
    try {
      const queryFilters = {
        ...filters,
        user_id: userId
      };
      return await this.getAll(queryFilters, options);
    } catch (error) {
      console.error('Error finding user certificates by user ID:', error);
      throw error;
    }
  }

  // Find user certificates by certificate ID
  async getByCertificateId(certificateId, filters = {}, options = {}) {
    try {
      const queryFilters = {
        ...filters,
        certificate_id: certificateId
      };
      return await this.getAll(queryFilters, options);
    } catch (error) {
      console.error('Error finding user certificates by certificate ID:', error);
      throw error;
    }
  }

  // Check if certificate is already assigned to user
  // For personal certificates, we check by certificateName and userId
  async isAssigned(certificateId, userId, tenantId = null) {
    try {
      // If certificateId is provided, check by certificate_id (for backward compatibility)
      if (certificateId) {
        const filter = {
          certificate_id: certificateId,
          user_id: userId
        };
        if (tenantId) {
          filter.tenant_id = tenantId;
        }
        const existing = await UserCertificate.findOne(filter);
        return !!existing;
      }
      // For personal certificates (certificateId is null), we don't check duplicates
      // as multiple users can have the same certificate name
      return false;
    } catch (error) {
      console.error('Error checking if certificate is assigned:', error);
      throw error;
    }
  }

  // Count user certificates
  async count(filter = {}) {
    try {
      return await UserCertificate.countDocuments(filter);
    } catch (error) {
      console.error('Error counting user certificates:', error);
      throw error;
    }
  }
}

module.exports = new UserCertificateRepository();

