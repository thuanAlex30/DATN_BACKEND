const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Tenant = require('../models/tenant');
const Role = require('../models/role');
const User = require('../models/user');
const Department = require('../models/department');
const Project = require('../models/project');
const { TrainingSession } = require('../models/trainingSession');
const PPEItem = require('../models/ppeItem');
const Incident = require('../models/incident');
const HashUtils = require('../utils/hash');
const { ROLE_DEFINITIONS, ROLE_CODES } = require('../config/roleMatrix');
const { DEFAULT_TENANT_CODE, DEFAULT_TENANT_NAME } = require('../utils/tenancy');

const DEFAULT_PASSWORD = process.env.DEFAULT_TENANT_BOOTSTRAP_PASSWORD || 'ChangeMe123!';

async function ensureDefaultTenant() {
  let tenant = await Tenant.findOne({ tenant_code: DEFAULT_TENANT_CODE });
  if (!tenant) {
    tenant = await Tenant.create({
      tenant_code: DEFAULT_TENANT_CODE,
      name: DEFAULT_TENANT_NAME,
      status: 'active',
      subscription: {
        plan: 'enterprise',
        seats: 100
      }
    });
    console.log(`✅ Created default tenant "${DEFAULT_TENANT_NAME}" (${tenant._id})`);
  } else {
    console.log(`ℹ️ Default tenant already exists (${tenant._id})`);
  }

  return tenant;
}

async function seedRoles() {
  const results = [];
  for (const definition of ROLE_DEFINITIONS) {
    const result = await Role.findOneAndUpdate(
      { role_code: definition.role_code },
      { $set: definition },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(result);
  }

  console.log(`✅ Upserted ${results.length} role definitions`);
  return results;
}

async function backfillTenantIds(tenantId) {
  const collections = [
    { model: User, name: 'users' },
    { model: Department, name: 'departments' },
    { model: Project, name: 'projects' },
    { model: TrainingSession, name: 'training_sessions' },
    { model: PPEItem, name: 'ppe_items' },
    { model: Incident, name: 'incidents' }
  ];

  for (const { model, name } of collections) {
    const result = await model.updateMany(
      { $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] },
      { $set: { tenant_id: tenantId } }
    );
    if (result.modifiedCount > 0) {
      console.log(`🔧 Backfilled ${result.modifiedCount} ${name} with tenant_id`);
    } else {
      console.log(`ℹ️ No ${name} needed tenant backfill`);
    }
  }
}

async function ensureDefaultDepartment(tenantId) {
  let department = await Department.findOne({ tenant_id: tenantId });
  if (!department) {
    department = await Department.create({
      tenant_id: tenantId,
      department_name: 'Default Operations',
      description: 'Auto-generated department for bootstrapping Department Header'
    });
    console.log(`✅ Created default department (${department._id}) for tenant ${tenantId}`);
  }
  return department;
}

async function ensureBootstrapUsers(tenantId, roleMap, departmentId) {
  const bootstrapUsers = [
    {
      username: 'company.admin',
      email: 'company.admin@default-tenant.local',
      full_name: 'Default Company Admin',
      role_code: ROLE_CODES.COMPANY_ADMIN
    },
    {
      username: 'department.header',
      email: 'dept.header@default-tenant.local',
      full_name: 'Default Department Header',
      role_code: ROLE_CODES.DEPARTMENT_HEADER,
      department_id: departmentId
    }
  ];

  const password_hash = await HashUtils.hashPassword(DEFAULT_PASSWORD);

  for (const userDef of bootstrapUsers) {
    const role = roleMap[userDef.role_code];
    if (!role) {
      console.warn(`⚠️ Role ${userDef.role_code} not found, skip user seeding`);
      continue;
    }

    const existing = await User.findOne({ role_id: role._id, tenant_id: tenantId });
    if (existing) {
      console.log(`ℹ️ User with role ${userDef.role_code} already exists (${existing.username})`);
      continue;
    }

    const created = await User.create({
      tenant_id: tenantId,
      username: userDef.username,
      email: userDef.email,
      full_name: userDef.full_name,
      password_hash,
      role_id: role._id,
      department_id: userDef.department_id || null,
      is_active: true
    });
    console.log(`✅ Created bootstrap user "${created.username}" with role ${userDef.role_code}`);
  }

  console.log(`🔐 Bootstrap users created/verified. Default password: ${DEFAULT_PASSWORD}`);
}

async function runSeed() {
  await connectDB();

  try {
    const tenant = await ensureDefaultTenant();
    const roles = await seedRoles();

    await backfillTenantIds(tenant._id);

    const roleMap = roles.reduce((acc, role) => {
      acc[role.role_code] = role;
      return acc;
    }, {});

    const defaultDepartment = await ensureDefaultDepartment(tenant._id);
    await ensureBootstrapUsers(tenant._id, roleMap, defaultDepartment._id);

    console.log('\n🎯 Priority 1 seed completed successfully.');
    console.log(`➡️ Remember to set DEFAULT_TENANT_ID=${tenant._id.toString()} in your environment.`);
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

runSeed();

