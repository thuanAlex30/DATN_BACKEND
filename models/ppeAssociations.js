const PPECategory = require('./ppeCategory');
const PPEItem = require('./ppeItem');
const PPEIssuance = require('./ppeIssuance');
const Site = require('./site');
<<<<<<< HEAD
const User = require('./user'); // Note: using 'users' as per your existing model
=======
const User = require('./user');
>>>>>>> origin/main

// Mongoose doesn't need explicit associations like Sequelize
// Relationships are defined in the schemas using ref and populate
// This file just exports all models for easy importing

module.exports = {
  PPECategory,
  PPEItem,
  PPEIssuance,
  Site,
  User
<<<<<<< HEAD
};
=======
};

// Export individual models for direct use
module.exports.PPECategory = PPECategory;
module.exports.PPEItem = PPEItem;
module.exports.PPEIssuance = PPEIssuance;
module.exports.Site = Site;
module.exports.User = User;
>>>>>>> origin/main
