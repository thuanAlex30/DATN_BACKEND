const mongoose = require('mongoose');

const backupRecordSchema = new mongoose.Schema({
  backup_type: {
    type: String,
    required: true,
    enum: ['FULL', 'DATABASE', 'FILES', 'CONFIG']
  },
  storage_location: {
    type: String,
    required: true,
    trim: true
  },
  file_path: {
    type: String,
    trim: true
  },
  file_size: {
    type: Number,
    default: 0, // bytes
    min: 0
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'IN_PROGRESS'],
    default: 'IN_PROGRESS'
  },
  error_message: {
    type: String,
    trim: true
  },
  started_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completed_at: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'backup_records'
});

backupRecordSchema.index({ status: 1 });
backupRecordSchema.index({ created_at: -1 });
backupRecordSchema.index({ backup_type: 1 });

backupRecordSchema.set('toJSON', {
  virtuals: true,
  transform: function transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('BackupRecord', backupRecordSchema);

