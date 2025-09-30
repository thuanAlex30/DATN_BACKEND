const mongoose = require('mongoose');
const Project = require('../models/project');
const User = require('../models/user');
const Site = require('../models/site');

// Use the same connection string as in your app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thuandh30:admin@safetymanagementsystem.0gssvfl.mongodb.net/safety_management_system?retryWrites=true&w=majority';

const debugProjectData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get raw project data
    const rawProject = await Project.findOne();
    console.log('Raw project (no populate):', JSON.stringify(rawProject, null, 2));
    
    // Get project with populate
    const populatedProject = await Project.findOne()
      .populate('leader_id', 'full_name email phone')
      .populate('site_id', 'site_name address');
    console.log('Populated project:', JSON.stringify(populatedProject, null, 2));
    
    // Check if leader_id and site_id exist
    const leader = await User.findById(rawProject.leader_id);
    const site = await Site.findById(rawProject.site_id);
    
    console.log('Leader found:', leader ? 'Yes' : 'No');
    console.log('Site found:', site ? 'Yes' : 'No');
    
    if (leader) {
      console.log('Leader data:', JSON.stringify(leader, null, 2));
    }
    
    if (site) {
      console.log('Site data:', JSON.stringify(site, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
};

debugProjectData();
