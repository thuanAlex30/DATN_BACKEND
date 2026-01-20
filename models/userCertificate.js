const mongoose = require('mongoose');
const { getDefaultTenantObjectId } = require('../utils/tenancy');

const userCertificateSchema = new mongoose.Schema({
    // Tenant isolation
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        default: getDefaultTenantObjectId
    },
    
    // Relationship - certificate_id is now optional (for backward compatibility)
    // Personal certificates are independent and don't need to reference company certificates
    certificate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate',
        required: false // Changed to optional - personal certificates are independent
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Personal certificate information (independent from company certificates)
    certificateName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    certificateCode: {
        type: String,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    category: {
        type: String,
        enum: ['SAFETY', 'TECHNICAL', 'MANAGEMENT', 'QUALITY', 'ENVIRONMENTAL', 'HEALTH', 'OTHER'],
        default: 'OTHER'
    },
    issuingAuthority: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    
    // Assignment info
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    assignmentType: {
        type: String,
        enum: ['ORGANIZATIONAL', 'PERSONAL', 'TEAM'],
        default: 'PERSONAL'
    },
    
    // Personal certificate details
    certificateNumber: {
        type: String,
        trim: true,
        maxlength: 100
    },
    issueDate: {
        type: Date
    },
    expiryDate: {
        type: Date
    },
    
    // Level (mức độ) - e.g., "Nhóm 1", "Nhóm 2", "Nhóm 3", "Cơ bản", "Nâng cao", "Chuyên sâu"
    level: {
        type: String,
        trim: true,
        maxlength: 50
    },
    
    // Duration (thời hạn) - số tháng
    duration: {
        type: Number,
        min: 1,
        max: 120 // tối đa 120 tháng (10 năm)
    },
    
    // Status
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    
    // Documents
    personalDocuments: [{
        fileName: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number
        },
        mimeType: {
            type: String
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        documentType: {
            type: String,
            enum: ['CERTIFICATE', 'RENEWAL', 'OTHER'],
            default: 'CERTIFICATE'
        },
        notes: {
            type: String,
            maxlength: 500
        }
    }],
    
    // Renewal
    renewalRequestedAt: {
        type: Date
    },
    renewalRequestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    renewalStatus: {
        type: String,
        enum: ['NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
        default: 'NOT_REQUESTED'
    },
    renewalNotes: {
        type: String,
        maxlength: 2000
    },
    requestedExpiryDate: {
        type: Date
    },
    
    // Verification
    verified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    verificationNotes: {
        type: String,
        maxlength: 1000
    },
    
    // Metadata
    notes: {
        type: String,
        maxlength: 2000
    },
    tags: [{
        type: String,
        maxlength: 50
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
userCertificateSchema.index({ tenant_id: 1, user_id: 1 });
userCertificateSchema.index({ tenant_id: 1, certificate_id: 1 }); // Optional index for backward compatibility
userCertificateSchema.index({ tenant_id: 1, user_id: 1, status: 1 });
userCertificateSchema.index({ tenant_id: 1, user_id: 1, expiryDate: 1 });
userCertificateSchema.index({ renewalStatus: 1, renewalRequestedAt: 1 });
userCertificateSchema.index({ tenant_id: 1, user_id: 1, certificateName: 1 }); // Index for personal certificate name

// Virtual for days until expiry
userCertificateSchema.virtual('daysUntilExpiry').get(function() {
    const expiryDate = this.expiryDate || this.personalExpiryDate; // Support both old and new field names
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Pre-save middleware to update updatedAt
userCertificateSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Method to check if certificate is expiring soon
userCertificateSchema.methods.isExpiringSoon = function(days = 30) {
    const expiryDate = this.expiryDate || this.personalExpiryDate; // Support both old and new field names
    if (!expiryDate) return false;
    const daysUntilExpiry = this.daysUntilExpiry;
    return daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= days;
};

// Method to check if certificate is expired
userCertificateSchema.methods.isExpired = function() {
    const expiryDate = this.expiryDate || this.personalExpiryDate; // Support both old and new field names
    if (!expiryDate) return false;
    const daysUntilExpiry = this.daysUntilExpiry;
    return daysUntilExpiry !== null && daysUntilExpiry <= 0;
};

const UserCertificate = mongoose.model('UserCertificate', userCertificateSchema);

module.exports = UserCertificate;

