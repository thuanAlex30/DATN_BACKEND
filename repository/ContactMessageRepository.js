const ContactMessage = require('../models/contactMessage');

class ContactMessageRepository {
  async create(data) {
    try {
      const contactMessage = new ContactMessage(data);
      return await contactMessage.save();
    } catch (error) {
      console.error('Error creating contact message:', error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query = {};

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [messages, total] = await Promise.all([
        ContactMessage.find(query)
          .populate('repliedBy', 'username email full_name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        ContactMessage.countDocuments(query)
      ]);

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error finding contact messages:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await ContactMessage.findById(id)
        .populate('repliedBy', 'username email full_name')
        .lean();
    } catch (error) {
      console.error('Error finding contact message by ID:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      return await ContactMessage.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('repliedBy', 'username email full_name');
    } catch (error) {
      console.error('Error updating contact message:', error);
      throw error;
    }
  }

  async markAsRead(id) {
    try {
      return await ContactMessage.findByIdAndUpdate(
        id,
        { $set: { status: 'read' } },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking contact message as read:', error);
      throw error;
    }
  }

  async markAsReplied(id, replyData) {
    try {
      return await ContactMessage.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'replied',
            repliedAt: new Date(),
            replyMessage: replyData.replyMessage,
            repliedBy: replyData.repliedBy
          }
        },
        { new: true }
      ).populate('repliedBy', 'username email full_name');
    } catch (error) {
      console.error('Error marking contact message as replied:', error);
      throw error;
    }
  }

  async archive(id) {
    try {
      return await ContactMessage.findByIdAndUpdate(
        id,
        { $set: { status: 'archived' } },
        { new: true }
      );
    } catch (error) {
      console.error('Error archiving contact message:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await ContactMessage.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting contact message:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      return await ContactMessage.countDocuments({ status: 'new' });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = new ContactMessageRepository();

