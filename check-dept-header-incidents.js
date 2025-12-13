const mongoose = require('mongoose');
require('dotenv').config();

const Incident = require('./models/incident');
const User = require('./models/user');
const Department = require('./models/department');

const tenantId = '692f1ab190adce349220ffb3';
const deptHeaderUsername = 'thuandept';

async function checkDeptHeaderIncidents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    console.log(`🔍 Checking Department Header: ${deptHeaderUsername}\n`);

    const deptHeader = await User.findOne({ 
      username: deptHeaderUsername,
      tenant_id: tenantObjectId 
    }).lean();

    if (!deptHeader) {
      console.log('❌ Department Header not found');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Department Header Information:');
    console.log(`   Username: ${deptHeader.username}`);
    console.log(`   Full Name: ${deptHeader.full_name}`);
    console.log(`   Email: ${deptHeader.email}`);
    console.log(`   Department ID: ${deptHeader.department_id || 'N/A'}`);
    
    if (deptHeader.department_id) {
      const dept = await Department.findById(deptHeader.department_id).lean();
      console.log(`   Department Name: ${dept?.department_name || 'N/A'}`);
      console.log(`   Department ID: ${dept?._id || deptHeader.department_id}`);
    }
    console.log('');

    console.log('📊 All Incidents in Tenant:\n');

    const allIncidents = await Incident.find({ tenant_id: tenantObjectId })
      .select('incidentId title status severity createdBy assignedTo createdAt')
      .lean();

    console.log(`Total incidents: ${allIncidents.length}\n`);

    for (const incident of allIncidents) {
      console.log(`Incident: ${incident.incidentId || incident._id}`);
      console.log(`  Title: ${incident.title}`);
      console.log(`  Status: ${incident.status}`);
      console.log(`  Severity: ${incident.severity}`);
      
      if (incident.createdBy) {
        const creator = await User.findById(incident.createdBy)
          .select('full_name email department_id')
          .lean();
        if (creator) {
          console.log(`  Created By: ${creator.full_name} (${creator.email})`);
          console.log(`  Creator Department ID: ${creator.department_id || 'N/A'}`);
          
          if (creator.department_id) {
            const creatorDept = await Department.findById(creator.department_id).lean();
            console.log(`  Creator Department Name: ${creatorDept?.department_name || 'N/A'}`);
          }
        }
      }
      
      if (incident.assignedTo) {
        const assignee = await User.findById(incident.assignedTo)
          .select('full_name email department_id')
          .lean();
        if (assignee) {
          console.log(`  Assigned To: ${assignee.full_name} (${assignee.email})`);
          console.log(`  Assignee Department ID: ${assignee.department_id || 'N/A'}`);
          
          if (assignee.department_id) {
            const assigneeDept = await Department.findById(assignee.department_id).lean();
            console.log(`  Assignee Department Name: ${assigneeDept?.department_name || 'N/A'}`);
          }
        }
      } else {
        console.log(`  Assigned To: Not assigned`);
      }
      
      const deptHeaderDeptId = deptHeader.department_id?.toString() || '';
      const creatorDeptId = incident.createdBy ? (await User.findById(incident.createdBy).select('department_id').lean())?.department_id?.toString() : '';
      const assigneeDeptId = incident.assignedTo ? (await User.findById(incident.assignedTo).select('department_id').lean())?.department_id?.toString() : '';
      
      const shouldSee = deptHeaderDeptId === creatorDeptId || deptHeaderDeptId === assigneeDeptId;
      console.log(`  Should Department Header see this? ${shouldSee ? '✅ YES' : '❌ NO'}`);
      console.log('');
    }

    console.log('\n🔍 Filter Logic Check:');
    console.log(`Department Header Department ID: ${deptHeader.department_id || 'N/A'}`);
    
    const filteredIncidents = [];
    for (const incident of allIncidents) {
      let creatorDeptId = null;
      let assigneeDeptId = null;
      
      if (incident.createdBy) {
        const creator = await User.findById(incident.createdBy).select('department_id').lean();
        creatorDeptId = creator?.department_id?.toString() || null;
      }
      
      if (incident.assignedTo) {
        const assignee = await User.findById(incident.assignedTo).select('department_id').lean();
        assigneeDeptId = assignee?.department_id?.toString() || null;
      }
      
      const deptHeaderDeptId = deptHeader.department_id?.toString() || '';
      
      if (deptHeaderDeptId === creatorDeptId || deptHeaderDeptId === assigneeDeptId) {
        filteredIncidents.push(incident);
      }
    }
    
    console.log(`\n📊 Incidents visible to Department Header: ${filteredIncidents.length}`);
    if (filteredIncidents.length > 0) {
      filteredIncidents.forEach(inc => {
        console.log(`  - ${inc.incidentId || inc._id}: ${inc.title}`);
      });
    } else {
      console.log('  ❌ No incidents match the department filter');
      console.log('\n💡 Reason: Department Header belongs to a different department than the incidents');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDeptHeaderIncidents();

