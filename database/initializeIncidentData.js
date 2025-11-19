const mongoose = require('mongoose');
const Incident = require('../models/incident');
const User = require('../models/user');
const Project = require('../models/project');

const initializeIncidentData = async () => {
    try {
        console.log('Initializing incident sample data...');

        // Check if incident data already exists
        const existingIncidents = await Incident.countDocuments();
        if (existingIncidents > 0) {
            console.log('Incident data already exists, skipping initialization');
            return;
        }

        // Get a user to be the creator
        const user = await User.findOne();
        if (!user) {
            console.log('No users found, skipping incident initialization');
            return;
        }

        // Get a project to associate with incidents
        const project = await Project.findOne();
        const projectId = project ? project._id : null;

        // Create sample incidents
        const incidents = [
            {
                title: 'Sự cố trượt ngã tại khu vực thi công',
                description: 'Công nhân trượt ngã do sàn ướt tại khu vực thi công tầng 3. Cần kiểm tra hệ thống thoát nước và đảm bảo sàn khô ráo.',
                location: 'Tầng 3 - Khu vực thi công chính',
                severity: 'nặng',
                status: 'Mới ghi nhận',
                images: [],
                project_id: projectId,
                createdBy: user._id,
                assignedTo: null,
                notified: false,
                histories: [
                    {
                        action: 'created',
                        description: 'Sự cố được ghi nhận',
                        timestamp: new Date(),
                        user: user._id
                    }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Thiết bị bảo hộ bị hỏng',
                description: 'Mũ bảo hiểm của công nhân bị nứt sau khi va chạm với vật thể rơi từ trên cao. Cần thay thế ngay lập tức.',
                location: 'Khu vực kho vật tư',
                severity: 'nhẹ',
                status: 'Đang xử lý',
                images: [],
                project_id: projectId,
                createdBy: user._id,
                assignedTo: user._id,
                notified: true,
                histories: [
                    {
                        action: 'created',
                        description: 'Sự cố được ghi nhận',
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                        user: user._id
                    },
                    {
                        action: 'assigned',
                        description: 'Sự cố được phân công xử lý',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                        user: user._id
                    }
                ],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Rò rỉ khí gas tại khu vực bếp ăn',
                description: 'Phát hiện mùi khí gas tại khu vực bếp ăn công trường. Cần kiểm tra hệ thống gas và sơ tán khu vực.',
                location: 'Khu vực bếp ăn công trường',
                severity: 'rất nghiêm trọng',
                status: 'Đã đóng',
                images: [],
                project_id: projectId,
                createdBy: user._id,
                assignedTo: user._id,
                notified: true,
                histories: [
                    {
                        action: 'created',
                        description: 'Sự cố được ghi nhận',
                        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                        user: user._id
                    },
                    {
                        action: 'assigned',
                        description: 'Sự cố được phân công xử lý',
                        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
                        user: user._id
                    },
                    {
                        action: 'investigated',
                        description: 'Đã điều tra và khắc phục sự cố',
                        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                        user: user._id
                    },
                    {
                        action: 'closed',
                        description: 'Sự cố đã được đóng',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                        user: user._id
                    }
                ],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Công nhân không tuân thủ quy định an toàn',
                description: 'Công nhân làm việc trên cao không đeo dây an toàn. Cần nhắc nhở và đào tạo lại về quy định an toàn.',
                location: 'Tầng 5 - Khu vực thi công',
                severity: 'nặng',
                status: 'Đang điều tra',
                images: [],
                project_id: projectId,
                createdBy: user._id,
                assignedTo: user._id,
                notified: true,
                histories: [
                    {
                        action: 'created',
                        description: 'Sự cố được ghi nhận',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                        user: user._id
                    },
                    {
                        action: 'assigned',
                        description: 'Sự cố được phân công điều tra',
                        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                        user: user._id
                    }
                ],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
            },
            {
                title: 'Máy móc thiết bị hoạt động bất thường',
                description: 'Máy cắt gạch phát ra tiếng động bất thường và có mùi khét. Cần kiểm tra và bảo trì.',
                location: 'Khu vực thi công tầng 2',
                severity: 'nhẹ',
                status: 'Mới ghi nhận',
                images: [],
                project_id: projectId,
                createdBy: user._id,
                assignedTo: null,
                notified: false,
                histories: [
                    {
                        action: 'created',
                        description: 'Sự cố được ghi nhận',
                        timestamp: new Date(),
                        user: user._id
                    }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await Incident.insertMany(incidents);
        console.log('Sample incidents created successfully');

    } catch (error) {
        console.error('Error initializing incident data:', error);
        throw error;
    }
};

module.exports = initializeIncidentData;
