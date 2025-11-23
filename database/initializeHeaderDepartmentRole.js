const mongoose = require('mongoose');
const dbConfig = require('../config/database');
const Role = require('../models/role');
const { ROLE_DEFINITIONS, ROLE_CODES } = require('../config/roleMatrix');

async function init() {
  try {
    await dbConfig();

    const headerDefinition = ROLE_DEFINITIONS.find(
      (role) => role.role_code === ROLE_CODES.DEPARTMENT_HEADER
    );

    if (!headerDefinition) {
      throw new Error('Department Header role definition missing from roleMatrix');
    }

    let role = await Role.findOne({ role_code: headerDefinition.role_code });

    if (!role) {
      role = await Role.create(headerDefinition);
      console.log(`✅ Created role '${headerDefinition.role_code}' with id:`, role._id.toString());
    } else {
      await Role.updateOne({ _id: role._id }, headerDefinition);
      console.log(`ℹ️ Role '${headerDefinition.role_code}' already exists, definition refreshed.`);
    }
  } catch (err) {
    console.error('❌ Error initializing header_department role:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

init();
