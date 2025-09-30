const { transformDocumentId, POPULATED_FIELDS } = require('../utils/transformId');

// Test data similar to what we get from database
const testProject = {
  "_id": "68d17c5d54aac2c88d9ae006",
  "project_name": "siueue",
  "description": "ưed",
  "status": "active",
  "leader_id": {
    "_id": "68d043e69a5eaf99e6a763af",
    "email": "employee@safety.com",
    "full_name": "Test Employee",
    "phone": "0987654321"
  },
  "site_id": {
    "_id": "68cf01c404db3289751c3ee6",
    "site_name": "đà nẵng",
    "address": "đà nẵng"
  },
  "progress": 0,
  "budget": 0,
  "priority": "medium"
};

console.log('Original data:');
console.log(JSON.stringify(testProject, null, 2));

console.log('\nTransforming...');
const transformed = transformDocumentId(testProject, POPULATED_FIELDS.PROJECT);

console.log('\nTransformed data:');
console.log(JSON.stringify(transformed, null, 2));