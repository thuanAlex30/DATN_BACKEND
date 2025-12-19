const mongoose = require('mongoose');
require('dotenv').config();

const Tenant = require('./models/tenant');
const User = require('./models/user');
const Role = require('./models/role');
const Department = require('./models/department');

const tenantId = '692f1ab190adce349220ffb3';

async function checkTenant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    console.log(`🔍 Checking tenant: ${tenantId}\n`);

    const tenant = await Tenant.findById(tenantObjectId).lean();

    if (!tenant) {
      console.log('❌ Tenant not found');
    } else {
      console.log('📋 Tenant Information:');
      console.log(`   ID: ${tenant._id}`);
      console.log(`   Name: ${tenant.tenant_name || 'N/A'}`);
      console.log(`   Code: ${tenant.tenant_code || 'N/A'}`);
      console.log(`   Email: ${tenant.email || 'N/A'}`);
      console.log(`   Phone: ${tenant.phone || 'N/A'}`);
      console.log(`   Address: ${tenant.address || 'N/A'}`);
      console.log(`   Status: ${tenant.is_active ? 'Active' : 'Inactive'}`);
      console.log(`   Created: ${tenant.created_at || tenant.createdAt || 'N/A'}`);
      console.log('');
    }

    console.log('👥 Users in this tenant:\n');

    const users = await User.find({ tenant_id: tenantObjectId })
      .select('username email full_name phone role_id department_id is_active created_at')
      .lean();

    for (let user of users) {
      if (user.role_id) {
        const role = await Role.findById(user.role_id).select('role_name role_code role_level').lean();
        user.role_id = role;
      }
      if (user.department_id) {
        const dept = await Department.findById(user.department_id).select('department_name').lean();
        user.department_id = dept;
      }
    }

    console.log(`📊 Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found for this tenant');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Full Name: ${user.full_name || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Role: ${user.role_id?.role_name || 'N/A'} (${user.role_id?.role_code || 'N/A'})`);
        console.log(`   Role Level: ${user.role_id?.role_level || 'N/A'}`);
        console.log(`   Department: ${user.department_id?.department_name || 'N/A'} (${user.department_id?._id || 'N/A'})`);
        console.log(`   Status: ${user.is_active ? 'Active' : 'Inactive'}`);
        console.log(`   Created: ${user.created_at || 'N/A'}`);
        console.log('');
      });

      const roleBreakdown = {};
      const departmentBreakdown = {};
      
      users.forEach(user => {
        const roleName = user.role_id?.role_name || 'Unknown';
        roleBreakdown[roleName] = (roleBreakdown[roleName] || 0) + 1;
        
        const deptName = user.department_id?.department_name || 'No Department';
        departmentBreakdown[deptName] = (departmentBreakdown[deptName] || 0) + 1;
      });

      console.log('📊 Breakdown by Role:');
      for (const [role, count] of Object.entries(roleBreakdown)) {
        console.log(`   ${role}: ${count} users`);
      }

      console.log('\n📊 Breakdown by Department:');
      for (const [dept, count] of Object.entries(departmentBreakdown)) {
        console.log(`   ${dept}: ${count} users`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTenant();

