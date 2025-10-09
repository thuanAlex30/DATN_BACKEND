const mongoose = require('mongoose');
const Project = require('../models/project');
const ProjectMilestone = require('../models/projectMilestone');
const ProjectResource = require('../models/projectResource');
const User = require('../models/user');

const initializeProjectData = async () => {
    try {
        console.log('Initializing project sample data...');

        // Check if project data already exists
        const existingProjects = await Project.countDocuments();
        if (existingProjects === 0) {
            console.log('No projects found, skipping project data initialization');
            return;
        }

        // Get the first project to add sample data
        const project = await Project.findOne().sort({ created_at: -1 });
        if (!project) {
            console.log('No project found to initialize data for');
            return;
        }

        console.log(`Initializing data for project: ${project.project_name} (${project._id})`);

        // Check if milestones already exist for this project
        const existingMilestones = await ProjectMilestone.countDocuments({ project_id: project._id });
        if (existingMilestones > 0) {
            console.log('Milestones already exist for this project, skipping milestone initialization');
        } else {
            // Get a user to assign as responsible
            const user = await User.findOne();
            if (!user) {
                console.log('No users found, cannot create milestones');
                return;
            }

            // Create sample milestones
            const milestones = [
                {
                    project_id: project._id,
                    milestone_name: 'Khởi động dự án',
                    description: 'Hoàn thành các công việc chuẩn bị và khởi động dự án',
                    planned_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    milestone_type: 'PHASE_COMPLETION',
                    completion_criteria: 'Hoàn thành việc chuẩn bị nhân lực và thiết bị',
                    responsible_user_id: user._id,
                    status: 'PENDING',
                    is_critical: true
                },
                {
                    project_id: project._id,
                    milestone_name: 'Hoàn thành giai đoạn 1',
                    description: 'Hoàn thành giai đoạn đầu tiên của dự án',
                    planned_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    milestone_type: 'PHASE_COMPLETION',
                    completion_criteria: 'Hoàn thành 25% công việc dự án',
                    responsible_user_id: user._id,
                    status: 'PENDING',
                    is_critical: false
                },
                {
                    project_id: project._id,
                    milestone_name: 'Kiểm tra chất lượng',
                    description: 'Thực hiện kiểm tra chất lượng công trình',
                    planned_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                    milestone_type: 'REVIEW',
                    completion_criteria: 'Đạt tiêu chuẩn chất lượng theo quy định',
                    responsible_user_id: user._id,
                    status: 'PENDING',
                    is_critical: true
                },
                {
                    project_id: project._id,
                    milestone_name: 'Hoàn thành dự án',
                    description: 'Hoàn thành toàn bộ dự án và bàn giao',
                    planned_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                    milestone_type: 'DELIVERY',
                    completion_criteria: 'Hoàn thành 100% công việc và bàn giao cho khách hàng',
                    responsible_user_id: user._id,
                    status: 'PENDING',
                    is_critical: true
                }
            ];

            await ProjectMilestone.insertMany(milestones);
            console.log('Sample milestones created');
        }

        // Check if resources already exist for this project
        const existingResources = await ProjectResource.countDocuments({ project_id: project._id });
        if (existingResources > 0) {
            console.log('Resources already exist for this project, skipping resource initialization');
        } else {
            // Create sample resources
            const resources = [
                {
                    project_id: project._id,
                    resource_type: 'PERSONNEL',
                    resource_name: 'Kỹ sư xây dựng',
                    description: 'Kỹ sư có kinh nghiệm trong lĩnh vực xây dựng',
                    planned_quantity: 5,
                    unit_measure: 'người',
                    unit_cost: 15000000, // 15 triệu VND
                    required_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                    status: 'PLANNED',
                    location: 'Công trường chính'
                },
                {
                    project_id: project._id,
                    resource_type: 'EQUIPMENT',
                    resource_name: 'Máy đào',
                    description: 'Máy đào đất công suất lớn',
                    planned_quantity: 2,
                    unit_measure: 'chiếc',
                    unit_cost: 500000000, // 500 triệu VND
                    required_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                    status: 'PLANNED',
                    location: 'Kho thiết bị'
                },
                {
                    project_id: project._id,
                    resource_type: 'MATERIAL',
                    resource_name: 'Xi măng',
                    description: 'Xi măng chất lượng cao',
                    planned_quantity: 100,
                    unit_measure: 'tấn',
                    unit_cost: 2000000, // 2 triệu VND per ton
                    required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    status: 'PLANNED',
                    location: 'Kho vật liệu'
                },
                {
                    project_id: project._id,
                    resource_type: 'TOOL',
                    resource_name: 'Búa máy',
                    description: 'Búa máy phá dỡ công trình',
                    planned_quantity: 3,
                    unit_measure: 'chiếc',
                    unit_cost: 50000000, // 50 triệu VND
                    required_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
                    status: 'PLANNED',
                    location: 'Kho dụng cụ'
                },
                {
                    project_id: project._id,
                    resource_type: 'VEHICLE',
                    resource_name: 'Xe tải',
                    description: 'Xe tải chở vật liệu',
                    planned_quantity: 4,
                    unit_measure: 'chiếc',
                    unit_cost: 800000000, // 800 triệu VND
                    required_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                    status: 'PLANNED',
                    location: 'Bãi xe'
                },
                {
                    project_id: project._id,
                    resource_type: 'SUBCONTRACTOR',
                    resource_name: 'Công ty điện lực',
                    description: 'Nhà thầu phụ thi công hệ thống điện',
                    planned_quantity: 1,
                    unit_measure: 'công ty',
                    unit_cost: 1000000000, // 1 tỷ VND
                    required_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
                    status: 'PLANNED',
                    location: 'Văn phòng công ty'
                }
            ];

            await ProjectResource.insertMany(resources);
            console.log('Sample resources created');
        }

        console.log('Project data initialization completed successfully');
    } catch (error) {
        console.error('Error initializing project data:', error);
        throw error;
    }
};

module.exports = initializeProjectData;
