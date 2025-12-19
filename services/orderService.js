const Order = require('../models/order');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  /**
   * Tạo đơn hàng mới
   * @param {Object} orderData - Dữ liệu đơn hàng
   * @param {string} orderData.planType - Loại gói
   * @param {number} orderData.amount - Số tiền
   * @param {Object} orderData.companyInfo - Thông tin công ty
   * @param {Object} orderData.contactPerson - Thông tin người liên hệ
   * @param {string} orderData.userId - User ID (optional - nếu có thì là khách hàng cũ)
   * @param {string} orderData.tenantId - Tenant ID (optional - nếu có userId)
   */
  async createOrder(orderData) {
    try {
      const orderId = `ORDER-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
      
      // Tính ngày hết hạn (15 phút)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const order = new Order({
        orderId,
        planType: orderData.planType,
        amount: orderData.amount,
        companyInfo: orderData.companyInfo,
        contactPerson: orderData.contactPerson,
        userId: orderData.userId || null,
        tenantId: orderData.tenantId || null,
        expiresAt
      });

      await order.save();
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Cập nhật đơn hàng
   */
  async updateOrder(orderId, updateData) {
    try {
      // orderId có thể là ObjectId hoặc string
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error(`Order not found with ID: ${orderId}`);
      }

      Object.assign(order, updateData);
      await order.save();
      return order;
    } catch (error) {
      console.error('Error updating order:', error);
      console.error('Order ID:', orderId);
      console.error('Update data:', updateData);
      throw error;
    }
  }

  /**
   * Tìm đơn hàng theo orderId
   */
  async getOrderByOrderId(orderId) {
    try {
      return await Order.findByOrderId(orderId);
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  /**
   * Tìm đơn hàng theo ID
   */
  async getOrderById(id) {
    try {
      return await Order.findById(id);
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  }

  /**
   * Tìm đơn hàng theo paymentOrderCode (PayOS orderCode)
   */
  async getOrderByPaymentCode(paymentOrderCode) {
    try {
      return await Order.findOne({ paymentOrderCode });
    } catch (error) {
      console.error('Error getting order by payment code:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu đơn hàng đã thanh toán
   */
  async markOrderAsPaid(orderId, transactionData) {
    try {
      const order = await this.getOrderByOrderId(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      return await order.markAsPaid(transactionData);
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu đơn hàng thất bại
   */
  async markOrderAsFailed(orderId) {
    try {
      const order = await this.getOrderByOrderId(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      return await order.markAsFailed();
    } catch (error) {
      console.error('Error marking order as failed:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();

