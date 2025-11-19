const mongoose = require('mongoose');

const projectNotificationSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'MILESTONE_REACHED', 'DEADLINE_APPROACHING', 'COMMENT_ADDED', 'FILE_UPLOADED'],
    default: 'INFO'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: Date,
  action_url: String,
  action_text: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expires_at: Date,
  is_archived: {
    type: Boolean,
    default: false
  },
  archived_at: Date
}, {
  timestamps: true
});

// Indexes for better performance
projectNotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
projectNotificationSchema.index({ project_id: 1 });
projectNotificationSchema.index({ type: 1 });
projectNotificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Virtual for user name
projectNotificationSchema.virtual('user_name').get(function() {
  return this.user_id?.full_name || this.user_id?.username || 'Unknown User';
});

module.exports = mongoose.model('ProjectNotification', projectNotificationSchema);
