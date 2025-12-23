const mongoose = require('mongoose');

const CONTACT_MESSAGE_STATUS = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
  ARCHIVED: 'archived'
};

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(CONTACT_MESSAGE_STATUS),
    default: CONTACT_MESSAGE_STATUS.NEW,
    index: true
  },
  repliedAt: {
    type: Date
  },
  replyMessage: {
    type: String,
    trim: true
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'contact_messages'
});

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ createdAt: -1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

module.exports = ContactMessage;
module.exports.CONTACT_MESSAGE_STATUS = CONTACT_MESSAGE_STATUS;

