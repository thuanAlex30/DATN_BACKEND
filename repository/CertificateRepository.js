const Certificate = require('../models/certificate');
const { transformDocumentId, transformDocumentsId } = require('../utils/transformId');

class CertificateRepository {
  // Create new certificate
  async create(certificateData) {
    try {
      const certificate = new Certificate(certificateData);
      await certificate.save();
      return transformDocumentId(certificate);
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  }

  // Find certificate by ID
  async getById(id) {
    try {
      const certificate = await Certificate.findById(id);
      return certificate ? transformDocumentId(certificate) : null;
    } catch (error) {
      console.error('Error finding certificate by ID:', error);
      throw error;
    }
  }

  // Update certificate by ID
  async updateById(id, updateData) {
    try {
      const certificate = await Certificate.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      return certificate ? transformDocumentId(certificate) : null;
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  }

  // Delete certificate by ID
  async deleteById(id) {
    try {
      const result = await Certificate.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  }

  // Find certificate by name
  async findByName(name) {
    try {
      const certificate = await Certificate.findOne({ certificateName: name });
      return certificate ? transformDocumentId(certificate) : null;
    } catch (error) {
      console.error('Error finding certificate by name:', error);
      throw error;
    }
  }

  // Find certificate by code
  async findByCode(code) {
    try {
      const certificate = await Certificate.findOne({ certificateCode: code });
      return certificate ? transformDocumentId(certificate) : null;
    } catch (error) {
      console.error('Error finding certificate by code:', error);
      throw error;
    }
  }

  // Find certificates with pagination and filters
  async getAll(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 }
      } = options;

      const skip = (page - 1) * limit;

      const certificates = await Certificate.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Certificate.countDocuments(filters);

      return {
        data: transformDocumentsId(certificates),
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error finding certificates with pagination:', error);
      throw error;
    }
  }

  // Find all certificates
  async getAllCertificates(filter = {}) {
    try {
      const certificates = await Certificate.find(filter).lean();
      return transformDocumentsId(certificates);
    } catch (error) {
      console.error('Error finding all certificates:', error);
      throw error;
    }
  }

  // Find active certificates
  async getActive(filter = {}) {
    try {
      const certificates = await Certificate.find({ 
        ...filter, 
        status: 'ACTIVE' 
      }).lean();
      return transformDocumentsId(certificates);
    } catch (error) {
      console.error('Error finding active certificates:', error);
      throw error;
    }
  }

  // Find certificates by category
  async getByCategory(category, subCategory = null) {
    try {
      const filter = { category };
      if (subCategory) {
        filter.subCategory = subCategory;
      }
      
      const certificates = await Certificate.find(filter).lean();
      return transformDocumentsId(certificates);
    } catch (error) {
      console.error('Error finding certificates by category:', error);
      throw error;
    }
  }

  // Find expiring certificates
  async getExpiring(days = 30) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const certificates = await Certificate.find({
        status: 'ACTIVE',
        expiryDate: { $lte: expiryDate }
      }).lean();

      return transformDocumentsId(certificates);
    } catch (error) {
      console.error('Error finding expiring certificates:', error);
      throw error;
    }
  }

  // Count certificates
  async count(filter = {}) {
    try {
      return await Certificate.countDocuments(filter);
    } catch (error) {
      console.error('Error counting certificates:', error);
      throw error;
    }
  }

  // Count active certificates
  async countActive(filter = {}) {
    try {
      return await Certificate.countDocuments({ 
        ...filter, 
        status: 'ACTIVE' 
      });
    } catch (error) {
      console.error('Error counting active certificates:', error);
      throw error;
    }
  }

  // Search certificates
  async search(query, filters = {}, options = {}) {
    try {
      const searchFilter = {
        $or: [
          { certificateName: { $regex: query, $options: 'i' } },
          { certificateCode: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ],
        ...filters
      };

      return await this.getAll(searchFilter, options);
    } catch (error) {
      console.error('Error searching certificates:', error);
      throw error;
    }
  }

  // Get statistics
  async getStats() {
    try {
      const total = await this.count();
      const active = await this.countActive();
      const inactive = await this.count({ status: 'INACTIVE' });
      const expired = await this.count({ status: 'EXPIRED' });
      const expiring = await this.count({
        status: 'ACTIVE',
        expiryDate: { 
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gte: new Date()
        }
      });

      // Get category statistics
      const categoryStats = await Certificate.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        overview: {
          total,
          active,
          inactive,
          expired,
          expiring
        },
        byCategory: categoryStats
      };
    } catch (error) {
      console.error('Error getting certificate statistics:', error);
      throw error;
    }
  }
}

module.exports = new CertificateRepository();
