const mongoose = require('mongoose');

const projectMeetingSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  meeting_date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  meeting_type: {
    type: String,
    enum: ['IN_PERSON', 'VIRTUAL', 'HYBRID'],
    default: 'VIRTUAL'
  },
  meeting_link: String,
  meeting_password: String,
  attendees: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['ORGANIZER', 'ATTENDEE', 'OBSERVER'],
      default: 'ATTENDEE'
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE'],
      default: 'PENDING'
    },
    response_at: Date,
    notes: String
  }],
  agenda: [{
    item: String,
    duration: Number, // in minutes
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    order: Number
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'],
    default: 'SCHEDULED'
  },
  meeting_notes: String,
  action_items: [{
    item: String,
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    due_date: Date,
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    original_name: String,
    file_path: String,
    file_size: Number,
    mime_type: String,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurrence_pattern: {
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
    },
    interval: {
      type: Number,
      default: 1
    },
    days_of_week: [Number], // 0-6 (Sunday-Saturday)
    end_date: Date,
    occurrences: Number
  },
  parent_meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectMeeting'
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectMeetingSchema.index({ project_id: 1, meeting_date: 1 });
projectMeetingSchema.index({ created_by: 1 });
projectMeetingSchema.index({ 'attendees.user_id': 1 });
projectMeetingSchema.index({ status: 1 });
projectMeetingSchema.index({ meeting_date: 1 });

// Virtual for meeting duration in hours
projectMeetingSchema.virtual('duration_hours').get(function() {
  return this.duration / 60;
});

// Virtual for meeting end time
projectMeetingSchema.virtual('end_time').get(function() {
  return new Date(this.meeting_date.getTime() + (this.duration * 60000));
});

// Pre-save middleware
projectMeetingSchema.pre('save', function(next) {
  // Set end time based on duration
  if (this.isModified('meeting_date') || this.isModified('duration')) {
    this.end_time = new Date(this.meeting_date.getTime() + (this.duration * 60000));
  }
  next();
});

module.exports = mongoose.model('ProjectMeeting', projectMeetingSchema);
