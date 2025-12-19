const mongoose = require('mongoose');

const taskProgressLogSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  report_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  progress_percentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  hours_worked: {
    type: Number,
    min: 0,
    required: true
  },
  work_description: {
    type: String,
    required: true,
    trim: true
  },
  issues_encountered: {
    type: String,
    trim: true
  },
  next_steps: {
    type: String,
    trim: true
  },
  attachments: [{
    file_name: String,
    file_path: String,
    file_type: String,
    file_size: Number,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    type: String, // Cloudinary URL
    required: false
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
taskProgressLogSchema.index({ task_id: 1, report_date: -1 });
taskProgressLogSchema.index({ user_id: 1, report_date: -1 });
taskProgressLogSchema.index({ report_date: -1 });

module.exports = mongoose.model('TaskProgressLog', taskProgressLogSchema);
