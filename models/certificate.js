const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const certificateSchema = new mongoose.Schema({
    // Tenant isolation
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        default: getDefaultTenantObjectId
    },
    
    // Thông tin cơ bản
    certificateName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    certificateCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    
    // Phân loại theo nhóm
    category: {
        type: String,
        required: true,
        enum: [
            'SAFETY',           // An toàn lao động
            'TECHNICAL',        // Kỹ thuật
            'MANAGEMENT',        // Quản lý
            'QUALITY',          // Chất lượng
            'ENVIRONMENTAL',     // Môi trường
            'HEALTH',           // Sức khỏe
            'OTHER'             // Khác
        ],
        default: 'SAFETY'
    },
    subCategory: {
        type: String,
        trim: true,
        maxlength: 100
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    
    // Thông tin pháp lý
    issuingAuthority: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    legalBasis: {
        type: String,
        trim: true,
        maxlength: 500
    },
    applicableRegulations: [{
        type: String,
        trim: true
    }],
    
    // Thời gian hiệu lực
    validityPeriod: {
        type: Number,
        required: true,
        min: 1,
        max: 120, // tối đa 120 tháng (10 năm)
        default: 12 // 12 tháng
    },
    validityPeriodUnit: {
        type: String,
        enum: ['MONTHS', 'YEARS'],
        default: 'MONTHS'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    lastRenewalDate: {
        type: Date
    },
    renewalNotes: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    
    // Thông tin gia hạn
    renewalRequired: {
        type: Boolean,
        default: true
    },
    renewalProcess: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    renewalDocuments: [{
        type: String,
        trim: true
    }],
    
    // Thông tin chi phí
    cost: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        default: 'VND',
        maxlength: 3
    },
    
    // Thông tin liên hệ
    contactInfo: {
        organization: {
            type: String,
            trim: true,
            maxlength: 200
        },
        address: {
            type: String,
            trim: true,
            maxlength: 500
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 20
        },
        email: {
            type: String,
            trim: true,
            maxlength: 100
        },
        website: {
            type: String,
            trim: true,
            maxlength: 200
        }
    },
    
    // Trạng thái
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'],
        default: 'ACTIVE'
    },
    
    // Thông tin nhắc nhở
    reminderSettings: {
        enabled: {
            type: Boolean,
            default: true
        },
        reminderDays: [{
            type: Number,
            min: 1,
            max: 365
        }], // Số ngày trước khi hết hạn để nhắc nhở
        notificationMethods: [{
            type: String,
            enum: ['EMAIL', 'SMS', 'SYSTEM']
        }],
        recipients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    
    // Thông tin đính kèm
    attachments: [{
        fileName: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    
    // Thông tin người tạo và cập nhật
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Metadata
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    notes: {
        type: String,
        trim: true,
        maxlength: 2000
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
certificateSchema.index({ tenant_id: 1 });
certificateSchema.index({ certificateCode: 1 });
certificateSchema.index({ tenant_id: 1, certificateCode: 1 }, { unique: true });
certificateSchema.index({ category: 1, subCategory: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ createdBy: 1 });
certificateSchema.index({ tags: 1 });
certificateSchema.index({ createdAt: -1 });
certificateSchema.index({ tenant_id: 1, status: 1 });

// Virtual fields
certificateSchema.virtual('validityPeriodInMonths').get(function() {
    if (this.validityPeriodUnit === 'YEARS') {
        return this.validityPeriod * 12;
    }
    return this.validityPeriod;
});

certificateSchema.virtual('isExpiringSoon').get(function() {
    if (!this.reminderSettings || !this.reminderSettings.enabled || !this.reminderSettings.reminderDays || !this.reminderSettings.reminderDays.length) {
        return false;
    }
    
    if (!this.expiryDate) {
        return false;
    }
    
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return this.reminderSettings.reminderDays.some(day => daysUntilExpiry <= day && daysUntilExpiry > 0);
});

// Pre-save middleware
certificateSchema.pre('save', function(next) {
    // Tự động tạo mã chứng chỉ nếu chưa có
    if (!this.certificateCode) {
        const prefix = this.category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.certificateCode = `${prefix}-${timestamp}`;
    }
    
    // Validate reminder days
    if (this.reminderSettings.reminderDays) {
        this.reminderSettings.reminderDays = [...new Set(this.reminderSettings.reminderDays)].sort((a, b) => b - a);
    }
    
    next();
});

// Static methods
certificateSchema.statics.findByCategory = function(category) {
    return this.find({ category, status: 'ACTIVE' });
};

certificateSchema.statics.findExpiringSoon = function(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    const now = new Date();
    
    return this.find({
        status: 'ACTIVE',
        expiryDate: {
            $gte: now,
            $lte: cutoffDate
        }
    });
};

certificateSchema.statics.findByTags = function(tags) {
    return this.find({ 
        tags: { $in: tags },
        status: 'ACTIVE' 
    });
};

// Instance methods
certificateSchema.methods.isExpired = function() {
    if (!this.expiryDate) {
        return false;
    }
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    return now > expiry;
};

certificateSchema.methods.getDaysUntilExpiry = function() {
    if (!this.expiryDate) {
        return null;
    }
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

certificateSchema.methods.addAttachment = function(attachmentData) {
    this.attachments.push(attachmentData);
    return this.save();
};

certificateSchema.methods.removeAttachment = function(attachmentId) {
    this.attachments = this.attachments.filter(att => att._id.toString() !== attachmentId);
    return this.save();
};

module.exports = mongoose.model('Certificate', certificateSchema);
