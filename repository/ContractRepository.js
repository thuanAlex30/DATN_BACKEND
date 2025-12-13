const Contract = require('../models/contract');

class ContractRepository {
  static async create(contractData) {
    try {
      const contract = new Contract(contractData);
      return await contract.save();
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      return await Contract.findById(id)
        .populate('tenantId', 'name tenant_code')
        .populate('userId', 'username email full_name')
        .populate('orderId', 'orderId planType amount');
    } catch (error) {
      throw error;
    }
  }

  static async findByContractId(contractId) {
    try {
      return await Contract.findOne({ contractId })
        .populate('tenantId', 'name tenant_code')
        .populate('userId', 'username email full_name')
        .populate('orderId', 'orderId planType amount');
    } catch (error) {
      throw error;
    }
  }

  static async findByTenant(tenantId, options = {}) {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        sort_by = 'createdAt',
        sort_order = 'desc'
      } = options;

      const filter = { tenantId };
      if (status) {
        filter.status = status;
      }

      const sort = {};
      sort[sort_by] = sort_order === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const contracts = await Contract.find(filter)
        .populate('userId', 'username email full_name')
        .populate('orderId', 'orderId planType amount')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Contract.countDocuments(filter);

      return {
        contracts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async getLatestContract(tenantId) {
    try {
      return await Contract.findOne({ tenantId })
        .populate('userId', 'username email full_name')
        .populate('orderId', 'orderId planType amount')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  static async findByOrderId(orderId) {
    try {
      return await Contract.findOne({ orderId })
        .populate('tenantId', 'name tenant_code')
        .populate('userId', 'username email full_name');
    } catch (error) {
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      return await Contract.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('tenantId', 'name tenant_code')
        .populate('userId', 'username email full_name')
        .populate('orderId', 'orderId planType amount');
    } catch (error) {
      throw error;
    }
  }

  static async updateByContractId(contractId, updateData) {
    try {
      return await Contract.findOneAndUpdate(
        { contractId },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('tenantId', 'name tenant_code')
        .populate('userId', 'username email full_name')
        .populate('orderId', 'orderId planType amount');
    } catch (error) {
      throw error;
    }
  }

  static async cancel(id, reason) {
    try {
      return await Contract.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason
          }
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  static async findExpiredContracts() {
    try {
      return await Contract.find({
        status: 'active',
        endDate: { $lt: new Date() }
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateExpiredContracts() {
    try {
      const result = await Contract.updateMany(
        {
          status: 'active',
          endDate: { $lt: new Date() }
        },
        {
          $set: {
            status: 'expired'
          }
        }
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ContractRepository;

