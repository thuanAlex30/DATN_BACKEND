const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Tenant = require('../models/tenant');
const Role = require('../models/role');
const User = require('../models/user');
const Department = require('../models/department');
const Position = require('../models/position');
const Project = require('../models/project');
const { ROLE_DEFINITIONS, ROLE_CODES } = require('../config/roleMatrix');
const HashUtils = require('../utils/hash');

const DEFAULT_PASSWORD = process.env.DEFAULT_TENANT_BOOTSTRAP_PASSWORD || 'ChangeMe123!';

// Tenant 1: Production Tenant (Thật)
const PRODUCTION_TENANT = {
  tenant_code: 'acme-corporation',
  name: 'ACME Corporation',
  status: 'active',
  subscription: {
    plan: 'enterprise',
    seats: 200,
    expires_at: new Date('2025-12-31'),
    auto_renew: true
  },
  contact: {
    name: 'John Smith',
    email: 'admin@acme-corp.com',
    phone: '+1-555-0100'
  }
};

// Tenant 2: Demo Tenant
const DEMO_TENANT = {
  tenant_code: 'demo-company',
  name: 'Demo Construction Company',
  status: 'active',
  subscription: {
    plan: 'standard',
    seats: 50,
    expires_at: new Date('2024-12-31'),
    auto_renew: false
  },
  contact: {
    name: 'Demo Admin',
    email: 'admin@demo-company.com',
    phone: '+1-555-0200'
  }
};

// Department definitions
const DEPARTMENTS = [
  { name: 'Engineering', description: 'Engineering and Design Department' },
  { name: 'Construction', description: 'Construction Operations' },
  { name: 'Safety', description: 'Safety and Compliance' },
  { name: 'HR', description: 'Human Resources' },
  { name: 'Finance', description: 'Finance and Accounting' },
  { name: 'Procurement', description: 'Procurement and Supply Chain' },
  { name: 'Quality Control', description: 'Quality Assurance and Control' },
  { name: 'Maintenance', description: 'Equipment Maintenance' }
];

// Position definitions
const POSITIONS = [
  { name: 'Senior Engineer', level: 8 },
  { name: 'Engineer', level: 6 },
  { name: 'Junior Engineer', level: 4 },
  { name: 'Site Manager', level: 7 },
  { name: 'Foreman', level: 5 },
  { name: 'Safety Officer', level: 6 },
  { name: 'HR Manager', level: 7 },
  { name: 'Accountant', level: 5 },
  { name: 'Warehouse Staff', level: 3 },
  { name: 'Maintenance Technician', level: 4 }
];

// User definitions per tenant
const USER_TEMPLATES = [
  { username: 'company.admin', email: 'admin@tenant.local', full_name: 'Company Admin', role_code: ROLE_CODES.COMPANY_ADMIN },
  { username: 'dept.header.eng', email: 'dept.header.eng@tenant.local', full_name: 'Engineering Department Header', role_code: ROLE_CODES.DEPARTMENT_HEADER, dept: 'Engineering' },
  { username: 'dept.header.safety', email: 'dept.header.safety@tenant.local', full_name: 'Safety Department Header', role_code: ROLE_CODES.DEPARTMENT_HEADER, dept: 'Safety' },
  { username: 'manager.construction', email: 'manager.construction@tenant.local', full_name: 'Construction Manager', role_code: ROLE_CODES.MANAGER, dept: 'Construction' },
  { username: 'trainer.safety', email: 'trainer.safety@tenant.local', full_name: 'Safety Trainer', role_code: ROLE_CODES.TRAINER, dept: 'Safety' },
  { username: 'safety.officer', email: 'safety.officer@tenant.local', full_name: 'Safety Officer', role_code: ROLE_CODES.SAFETY_OFFICER, dept: 'Safety' },
  { username: 'warehouse.staff', email: 'warehouse.staff@tenant.local', full_name: 'Warehouse Staff', role_code: ROLE_CODES.WAREHOUSE_STAFF, dept: 'Procurement' },
  { username: 'maintenance.staff', email: 'maintenance.staff@tenant.local', full_name: 'Maintenance Staff', role_code: ROLE_CODES.MAINTENANCE_STAFF, dept: 'Maintenance' },
  { username: 'employee.1', email: 'employee.1@tenant.local', full_name: 'Employee One', role_code: ROLE_CODES.EMPLOYEE, dept: 'Engineering' },
  { username: 'employee.2', email: 'employee.2@tenant.local', full_name: 'Employee Two', role_code: ROLE_CODES.EMPLOYEE, dept: 'Construction' },
  { username: 'employee.3', email: 'employee.3@tenant.local', full_name: 'Employee Three', role_code: ROLE_CODES.EMPLOYEE, dept: 'Safety' }
];

async function ensureRoles() {
  const roles = [];
  for (const definition of ROLE_DEFINITIONS) {
    const role = await Role.findOneAndUpdate(
      { role_code: definition.role_code },
      { $set: definition },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    roles.push(role);
  }
  console.log(`✅ Ensured ${roles.length} roles exist`);
  return roles.reduce((acc, role) => {
    acc[role.role_code] = role;
    return acc;
  }, {});
}

async function createTenant(tenantData) {
  let tenant = await Tenant.findOne({ tenant_code: tenantData.tenant_code });
  if (tenant) {
    console.log(`ℹ️ Tenant "${tenantData.name}" already exists (${tenant._id})`);
    return tenant;
  }

  tenant = await Tenant.create(tenantData);
  console.log(`✅ Created tenant "${tenantData.name}" (${tenant._id})`);
  return tenant;
}

async function createDepartments(tenantId, roleMap) {
  const departments = [];
  const deptMap = {};

  for (const deptData of DEPARTMENTS) {
    let dept = await Department.findOne({ 
      tenant_id: tenantId, 
      department_name: deptData.name 
    });

    if (!dept) {
      dept = await Department.create({
        tenant_id: tenantId,
        department_name: deptData.name,
        description: deptData.description,
        is_active: true
      });
      console.log(`  ✅ Created department: ${deptData.name}`);
    } else {
      console.log(`  ℹ️ Department already exists: ${deptData.name}`);
    }

    departments.push(dept);
    deptMap[deptData.name] = dept;
  }

  return { departments, deptMap };
}

async function createPositions(tenantId) {
  const positions = [];
  const posMap = {};

  for (const posData of POSITIONS) {
    let position = await Position.findOne({ 
      tenant_id: tenantId,
      position_name: posData.name 
    });

    if (!position) {
      position = await Position.create({
        tenant_id: tenantId,
        position_name: posData.name,
        level: posData.level,
        is_active: true
      });
      console.log(`  ✅ Created position: ${posData.name} (level ${posData.level})`);
    } else {
      console.log(`  ℹ️ Position already exists: ${posData.name}`);
    }

    positions.push(position);
    posMap[posData.name] = position;
  }

  return { positions, posMap };
}

async function createUsers(tenantId, roleMap, deptMap, tenantCode) {
  const password_hash = await HashUtils.hashPassword(DEFAULT_PASSWORD);
  const users = [];

  for (const userTemplate of USER_TEMPLATES) {
    const email = userTemplate.email.replace('@tenant.local', `@${tenantCode}.local`);
    const username = `${tenantCode}.${userTemplate.username}`;

    let user = await User.findOne({ 
      tenant_id: tenantId,
      $or: [{ username }, { email }]
    });

    if (user) {
      console.log(`  ℹ️ User already exists: ${username}`);
      users.push(user);
      continue;
    }

    const role = roleMap[userTemplate.role_code];
    if (!role) {
      console.warn(`  ⚠️ Role ${userTemplate.role_code} not found, skipping user ${username}`);
      continue;
    }

    const department = userTemplate.dept ? deptMap[userTemplate.dept] : null;

    user = await User.create({
      tenant_id: tenantId,
      username,
      email,
      full_name: userTemplate.full_name,
      password_hash,
      role_id: role._id,
      department_id: department ? department._id : null,
      is_active: true
    });

    console.log(`  ✅ Created user: ${username} (${role.role_name})`);
    users.push(user);
  }

  return users;
}

async function seedTenant(tenantData, roleMap) {
  console.log(`\n📦 Seeding tenant: ${tenantData.name}...`);

  const tenant = await createTenant(tenantData);
  const { departments, deptMap } = await createDepartments(tenant._id, roleMap);
  const { positions, posMap } = await createPositions(tenant._id);
  const users = await createUsers(tenant._id, roleMap, deptMap, tenantData.tenant_code);

  console.log(`✅ Completed seeding tenant "${tenantData.name}"`);
  console.log(`   - Departments: ${departments.length}`);
  console.log(`   - Positions: ${positions.length}`);
  console.log(`   - Users: ${users.length}`);

  return {
    tenant,
    departments,
    positions,
    users
  };
}

async function runSeed() {
  await connectDB();

  try {
    console.log('🌱 Starting full tenant seed...\n');

    // Ensure all roles exist
    const roleMap = await ensureRoles();

    // Seed Production Tenant
    const productionData = await seedTenant(PRODUCTION_TENANT, roleMap);

    // Seed Demo Tenant
    const demoData = await seedTenant(DEMO_TENANT, roleMap);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Production Tenant: ${PRODUCTION_TENANT.name}`);
    console.log(`     - ID: ${productionData.tenant._id}`);
    console.log(`     - Users: ${productionData.users.length}`);
    console.log(`     - Departments: ${productionData.departments.length}`);
    console.log(`\n   Demo Tenant: ${DEMO_TENANT.name}`);
    console.log(`     - ID: ${demoData.tenant._id}`);
    console.log(`     - Users: ${demoData.users.length}`);
    console.log(`     - Departments: ${demoData.departments.length}`);
    console.log(`\n🔐 Default password for all users: ${DEFAULT_PASSWORD}`);
    console.log('\n📝 Example login credentials:');
    console.log(`   Production Tenant:`);
    console.log(`     - Company Admin: ${PRODUCTION_TENANT.tenant_code}.company.admin@${PRODUCTION_TENANT.tenant_code}.local`);
    console.log(`   Demo Tenant:`);
    console.log(`     - Company Admin: ${DEMO_TENANT.tenant_code}.company.admin@${DEMO_TENANT.tenant_code}.local`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };

