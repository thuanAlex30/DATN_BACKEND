const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('../models/department');
const User = require('../models/user');
const Role = require('../models/role');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://thuandh30:admin@safetymanagementsystem.0gssvfl.mongodb.net/safety_management_system?retryWrites=true&w=majority';

// Department data
const departments = [
  {
    department_name: 'Phòng An toàn Lao động',
    description: 'Quản lý toàn bộ hệ thống an toàn, PPE, báo cáo sự cố và đào tạo an toàn lao động',
    code: 'SAFETY'
  },
  {
    department_name: 'Phòng Sản xuất & Thi công',
    description: 'Quản lý hoạt động sản xuất và thi công tại công trường, phân công công việc cho công nhân',
    code: 'PRODUCTION'
  },
  {
    department_name: 'Phòng Quản lý Dự án',
    description: 'Quản lý các dự án xây dựng từ đầu đến cuối, lập kế hoạch và theo dõi tiến độ',
    code: 'PROJECT'
  },
  {
    department_name: 'Phòng Nhân sự',
    description: 'Quản lý nhân sự và đào tạo, tuyển dụng và quản lý thông tin nhân viên',
    code: 'HR'
  },
  {
    department_name: 'Phòng Kỹ thuật',
    description: 'Hỗ trợ kỹ thuật và bảo trì thiết bị, kiểm tra kỹ thuật định kỳ',
    code: 'TECHNICAL'
  },
  {
    department_name: 'Phòng Vật tư & Kho',
    description: 'Quản lý vật tư, nguyên liệu và kho bãi, kiểm tra chất lượng vật tư',
    code: 'MATERIALS'
  }
];

// Manager data for each department
const managers = [
  {
    username: 'manager_safety',
    email: 'manager.safety@safety.com',
    full_name: 'Nguyễn Văn An Toàn',
    phone: '0901234001',
    department_code: 'SAFETY',
    position: 'Trưởng phòng An toàn Lao động'
  },
  {
    username: 'manager_production',
    email: 'manager.production@safety.com',
    full_name: 'Trần Thị Sản Xuất',
    phone: '0901234002',
    department_code: 'PRODUCTION',
    position: 'Trưởng phòng Sản xuất & Thi công'
  },
  {
    username: 'manager_project',
    email: 'manager.project@safety.com',
    full_name: 'Lê Văn Dự Án',
    phone: '0901234003',
    department_code: 'PROJECT',
    position: 'Trưởng phòng Quản lý Dự án'
  },
  {
    username: 'manager_hr',
    email: 'manager.hr@safety.com',
    full_name: 'Phạm Thị Nhân Sự',
    phone: '0901234004',
    department_code: 'HR',
    position: 'Trưởng phòng Nhân sự'
  },
  {
    username: 'manager_technical',
    email: 'manager.technical@safety.com',
    full_name: 'Hoàng Văn Kỹ Thuật',
    phone: '0901234005',
    department_code: 'TECHNICAL',
    position: 'Trưởng phòng Kỹ thuật'
  },
  {
    username: 'manager_materials',
    email: 'manager.materials@safety.com',
    full_name: 'Vũ Thị Vật Tư',
    phone: '0901234006',
    department_code: 'MATERIALS',
    position: 'Trưởng phòng Vật tư & Kho'
  }
];

// Vietnamese names for employees
const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
  'Vũ Thị Phương', 'Đặng Văn Giang', 'Bùi Thị Hoa', 'Phan Văn Inh', 'Ngô Thị Kim',
  'Dương Văn Long', 'Lý Thị Mai', 'Võ Văn Nam', 'Đinh Thị Oanh', 'Tôn Văn Phúc',
  'Hồ Thị Quỳnh', 'Lưu Văn Rồng', 'Chu Thị Sinh', 'Tạ Văn Thành', 'Lâm Thị Uyên',
  'Nguyễn Văn Việt', 'Trần Thị Xuân', 'Lê Văn Yên', 'Phạm Thị Zin', 'Hoàng Văn Anh',
  'Vũ Thị Bảo', 'Đặng Văn Công', 'Bùi Thị Dung', 'Phan Văn Em', 'Ngô Thị Phương'
];

// Function to generate random Vietnamese names
function generateEmployeeNames(departmentCode, count) {
  const names = [];
  for (let i = 1; i <= count; i++) {
    const randomName = vietnameseNames[Math.floor(Math.random() * vietnameseNames.length)];
    const firstName = randomName.split(' ')[0];
    const lastName = randomName.split(' ')[1];
    
    names.push({
      username: `emp_${departmentCode.toLowerCase()}_${i.toString().padStart(3, '0')}`,
      email: `emp.${departmentCode.toLowerCase()}.${i}@safety.com`,
      full_name: `${firstName} ${lastName}`,
      phone: `0901234${(100 + i).toString().padStart(3, '0')}`,
      department_code: departmentCode,
      position: 'Nhân viên'
    });
  }
  return names;
}

// Function to hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Main function to create departments and users
async function createDepartmentsAndUsers() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully!');

    // Get roles
    const managerRole = await Role.findOne({ role_name: 'manager' });
    const employeeRole = await Role.findOne({ role_name: 'employee' });

    if (!managerRole) {
      console.error('❌ Manager role not found!');
      return;
    }

    if (!employeeRole) {
      console.error('❌ Employee role not found!');
      return;
    }

    console.log('✅ Found roles:', { manager: managerRole.role_name, employee: employeeRole.role_name });

    // Create departments
    console.log('\n🏗️ Creating departments...');
    const createdDepartments = [];
    
    for (const deptData of departments) {
      const existingDept = await Department.findOne({ department_name: deptData.department_name });
      if (existingDept) {
        console.log(`⚠️  Department "${deptData.department_name}" already exists`);
        createdDepartments.push(existingDept);
        continue;
      }

      const department = new Department({
        department_name: deptData.department_name,
        description: deptData.description
      });

      const savedDept = await department.save();
      createdDepartments.push(savedDept);
      console.log(`✅ Created department: ${deptData.department_name}`);
    }

    // Create managers
    console.log('\n👨‍💼 Creating managers...');
    const createdManagers = [];
    
    for (let i = 0; i < managers.length; i++) {
      const managerData = managers[i];
      const department = createdDepartments[i];

      const existingManager = await User.findOne({ username: managerData.username });
      if (existingManager) {
        console.log(`⚠️  Manager "${managerData.username}" already exists`);
        createdManagers.push(existingManager);
        continue;
      }

      const passwordHash = await hashPassword('Manager123!');

      const manager = new User({
        username: managerData.username,
        password_hash: passwordHash,
        email: managerData.email,
        full_name: managerData.full_name,
        phone: managerData.phone,
        role_id: managerRole._id,
        department_id: department._id,
        is_active: true
      });

      const savedManager = await manager.save();
      createdManagers.push(savedManager);

      // Update department with manager
      department.manager_id = savedManager._id;
      await department.save();

      console.log(`✅ Created manager: ${managerData.full_name} (${managerData.username})`);
    }

    // Create employees
    console.log('\n👷 Creating employees...');
    let totalEmployeesCreated = 0;

    for (let i = 0; i < departments.length; i++) {
      const department = createdDepartments[i];
      const departmentCode = departments[i].code;
      
      console.log(`\n📁 Creating employees for ${department.department_name}...`);
      
      const employees = generateEmployeeNames(departmentCode, 30);
      
      for (const empData of employees) {
        const existingEmployee = await User.findOne({ username: empData.username });
        if (existingEmployee) {
          console.log(`⚠️  Employee "${empData.username}" already exists`);
          continue;
        }

        const passwordHash = await hashPassword('Employee123!');

        const employee = new User({
          username: empData.username,
          password_hash: passwordHash,
          email: empData.email,
          full_name: empData.full_name,
          phone: empData.phone,
          role_id: employeeRole._id,
          department_id: department._id,
          is_active: true
        });

        await employee.save();
        totalEmployeesCreated++;
      }
      
      console.log(`✅ Created 30 employees for ${department.department_name}`);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Departments created: ${createdDepartments.length}`);
    console.log(`✅ Managers created: ${createdManagers.length}`);
    console.log(`✅ Employees created: ${totalEmployeesCreated}`);
    console.log(`✅ Total users created: ${createdManagers.length + totalEmployeesCreated}`);

    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('\nManagers:');
    managers.forEach(manager => {
      console.log(`  ${manager.full_name}: ${manager.username} / Manager123!`);
    });
    console.log('\nEmployees:');
    console.log('  Format: emp_[department]_[number] / Employee123!');
    console.log('  Example: emp_safety_001 / Employee123!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the script
if (require.main === module) {
  createDepartmentsAndUsers();
}

module.exports = { createDepartmentsAndUsers };
