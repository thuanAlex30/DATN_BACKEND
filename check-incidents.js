const mongoose = require('mongoose');
require('dotenv').config();

const Incident = require('./models/incident');
const User = require('./models/user');

const tenantId = '693762336890b8984d135585';

async function checkIncidents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    console.log(`🔍 Checking incidents for tenant: ${tenantId}\n`);

    const allIncidents = await Incident.find({ tenant_id: tenantObjectId })
      .populate('createdBy', 'full_name email department_id')
      .populate('assignedTo', 'full_name email department_id')
      .lean();

    console.log(`📊 Total incidents found: ${allIncidents.length}\n`);

    if (allIncidents.length === 0) {
      console.log('❌ No incidents found for this tenant');
      
      const totalIncidents = await Incident.countDocuments({});
      console.log(`\n📋 Total incidents in database (all tenants): ${totalIncidents}`);
      
      if (totalIncidents > 0) {
        console.log('\n🔍 All incidents in database:');
        const allIncidentsInDB = await Incident.find({})
          .select('incidentId title tenant_id createdAt createdBy assignedTo')
          .populate('createdBy', 'full_name email department_id')
          .populate('assignedTo', 'full_name email department_id')
          .lean();
        
        allIncidentsInDB.forEach((inc, index) => {
          console.log(`\n${index + 1}. Incident ID: ${inc.incidentId || inc._id}`);
          console.log(`   Title: ${inc.title}`);
          console.log(`   Tenant ID: ${inc.tenant_id}`);
          console.log(`   Created: ${inc.createdAt}`);
          console.log(`   Created By: ${inc.createdBy?.full_name || 'N/A'} (${inc.createdBy?.email || 'N/A'})`);
          console.log(`   Created By Department: ${inc.createdBy?.department_id?._id || inc.createdBy?.department_id || 'N/A'}`);
          if (inc.assignedTo) {
            console.log(`   Assigned To: ${inc.assignedTo?.full_name || 'N/A'} (${inc.assignedTo?.email || 'N/A'})`);
            console.log(`   Assigned To Department: ${inc.assignedTo?.department_id?._id || inc.assignedTo?.department_id || 'N/A'}`);
          }
        });

        const tenantBreakdown = {};
        allIncidentsInDB.forEach(inc => {
          const tid = inc.tenant_id?.toString() || 'unknown';
          tenantBreakdown[tid] = (tenantBreakdown[tid] || 0) + 1;
        });

        console.log('\n📊 Breakdown by tenant:');
        for (const [tid, count] of Object.entries(tenantBreakdown)) {
          console.log(`   Tenant ${tid}: ${count} incidents`);
        }
      }
    } else {
      console.log('📋 Incidents details:\n');
      allIncidents.forEach((incident, index) => {
        console.log(`${index + 1}. Incident ID: ${incident.incidentId || incident._id}`);
        console.log(`   Title: ${incident.title}`);
        console.log(`   Status: ${incident.status}`);
        console.log(`   Severity: ${incident.severity}`);
        console.log(`   Location: ${incident.location || 'N/A'}`);
        console.log(`   Created: ${incident.createdAt}`);
        
        const createdBy = incident.createdBy;
        if (createdBy) {
          console.log(`   Created By: ${createdBy.full_name} (${createdBy.email})`);
          console.log(`   Created By Department: ${createdBy.department_id?._id || createdBy.department_id || 'N/A'}`);
        } else {
          console.log(`   Created By: N/A`);
        }
        
        const assignedTo = incident.assignedTo;
        if (assignedTo) {
          console.log(`   Assigned To: ${assignedTo.full_name} (${assignedTo.email})`);
          console.log(`   Assigned To Department: ${assignedTo.department_id?._id || assignedTo.department_id || 'N/A'}`);
        } else {
          console.log(`   Assigned To: Not assigned`);
        }
        
        console.log('');
      });

      const departmentBreakdown = {};
      allIncidents.forEach(incident => {
        const deptId = incident.createdBy?.department_id?._id?.toString() || 
                      incident.createdBy?.department_id?.toString() || 
                      'unknown';
        departmentBreakdown[deptId] = (departmentBreakdown[deptId] || 0) + 1;
      });

      console.log('\n📊 Breakdown by department:');
      for (const [deptId, count] of Object.entries(departmentBreakdown)) {
        console.log(`   Department ${deptId}: ${count} incidents`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkIncidents();

