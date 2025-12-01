const mongoose = require('mongoose');

const DEFAULT_TENANT_CODE = process.env.DEFAULT_TENANT_CODE || 'default_tenant';
const DEFAULT_TENANT_NAME = process.env.DEFAULT_TENANT_NAME || 'Default Tenant';

const getDefaultTenantObjectId = () => {
  const value = process.env.DEFAULT_TENANT_ID;
  if (!value) {
    return undefined;
  }

  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    console.warn('[tenancy] DEFAULT_TENANT_ID is invalid, skipping automatic assignment');
    return undefined;
  }
};

module.exports = {
  DEFAULT_TENANT_CODE,
  DEFAULT_TENANT_NAME,
  getDefaultTenantObjectId
};

