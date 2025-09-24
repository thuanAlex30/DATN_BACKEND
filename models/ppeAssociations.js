const PPECategory = require('./ppeCategory');
const PPEItem = require('./ppeItem');
const PPEIssuance = require('./ppeIssuance');
const Site = require('./site');
const User = require('./user'); // Note: using 'users' as per your existing model

// Mongoose doesn't need explicit associations like Sequelize
// Relationships are defined in the schemas using ref and populate
// This file just exports all models for easy importing

module.exports = {
  PPECategory,
  PPEItem,
  PPEIssuance,
  Site,
  User
};