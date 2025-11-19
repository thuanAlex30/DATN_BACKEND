const mongoose = require('mongoose');

const projectMessageSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  message_type: {
    type: String,
    enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'],
    default: 'TEXT'
  },
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectMessage',
    default: null
  },
  attachments: [{
    filename: String,
    original_name: String,
    file_path: String,
    file_size: Number,
    mime_type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  is_edited: {
    type: Boolean,
    default: false
  },
  edited_at: Date,
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: Date,
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  read_by: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read_at: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
projectMessageSchema.index({ project_id: 1, created_at: -1 });
projectMessageSchema.index({ sender_id: 1 });
projectMessageSchema.index({ reply_to: 1 });

// Virtual for sender name
projectMessageSchema.virtual('sender_name').get(function() {
  return this.sender_id?.full_name || this.sender_id?.username || 'Unknown User';
});

// Pre-save middleware
projectMessageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.is_edited = true;
    this.edited_at = new Date();
  }
  next();
});

module.exports = mongoose.model('ProjectMessage', projectMessageSchema);
