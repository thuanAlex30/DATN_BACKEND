/**
 * Test script for PPE confirmation functionality
 * Tests the complete flow: Manager issues PPE -> Employee confirms -> Status updates
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const MANAGER_TOKEN = 'your_manager_token_here';
const EMPLOYEE_TOKEN = 'your_employee_token_here';

// Test data
const testData = {
  managerId: 'your_manager_id',
  employeeId: 'your_employee_id',
  ppeItemId: 'your_ppe_item_id'
};

async function testPPEConfirmationFlow() {
  console.log('🧪 Testing PPE Confirmation Flow...\n');

  try {
    // Step 1: Manager issues PPE to Employee
    console.log('📤 Step 1: Manager issues PPE to Employee');
    const issueResponse = await axios.post(`${BASE_URL}/ppe/issuances/to-employee`, {
      user_id: testData.employeeId,
      item_id: testData.ppeItemId,
      quantity: 1,
      issued_date: new Date().toISOString(),
      expected_return_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      notes: 'Test PPE issuance for confirmation flow'
    }, {
      headers: {
        'Authorization': `Bearer ${MANAGER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (issueResponse.data.success) {
      console.log('✅ PPE issued successfully');
      console.log('   Issuance ID:', issueResponse.data.data.issuance._id);
      console.log('   Status:', issueResponse.data.data.issuance.status);
      
      const issuanceId = issueResponse.data.data.issuance._id;
      
      // Step 2: Check initial status (should be pending_confirmation)
      console.log('\n📋 Step 2: Checking initial status');
      if (issueResponse.data.data.issuance.status === 'pending_confirmation') {
        console.log('✅ Status is correct: pending_confirmation');
      } else {
        console.log('❌ Status is incorrect:', issueResponse.data.data.issuance.status);
        return;
      }

      // Step 3: Employee confirms receiving PPE
      console.log('\n✅ Step 3: Employee confirms receiving PPE');
      const confirmResponse = await axios.post(`${BASE_URL}/ppe/issuances/${issuanceId}/confirm-received`, {
        confirmation_notes: 'PPE received in good condition'
      }, {
        headers: {
          'Authorization': `Bearer ${EMPLOYEE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (confirmResponse.data.success) {
        console.log('✅ PPE confirmed successfully');
        console.log('   Confirmed Date:', confirmResponse.data.data.issuance.confirmed_date);
        console.log('   New Status:', confirmResponse.data.data.issuance.status);
        
        // Step 4: Verify status change
        console.log('\n🔍 Step 4: Verifying status change');
        if (confirmResponse.data.data.issuance.status === 'issued') {
          console.log('✅ Status updated correctly: issued');
        } else {
          console.log('❌ Status not updated correctly:', confirmResponse.data.data.issuance.status);
        }

        // Step 5: Check WebSocket notification data
        console.log('\n📡 Step 5: WebSocket notification data');
        console.log('   Manager notified:', !!confirmResponse.data.data.manager);
        console.log('   Employee notified:', !!confirmResponse.data.data.employee);
        console.log('   Confirmation notes:', confirmResponse.data.data.issuance.confirmation_notes);

        console.log('\n🎉 PPE Confirmation Flow Test Completed Successfully!');
        
      } else {
        console.log('❌ PPE confirmation failed:', confirmResponse.data.message);
      }

    } else {
      console.log('❌ PPE issuance failed:', issueResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n🧪 Testing Error Cases...\n');

  try {
    // Test 1: Try to confirm PPE that doesn't exist
    console.log('📋 Test 1: Confirming non-existent PPE');
    try {
      await axios.post(`${BASE_URL}/ppe/issuances/invalid_id/confirm-received`, {
        confirmation_notes: 'Test'
      }, {
        headers: {
          'Authorization': `Bearer ${EMPLOYEE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent PPE');
      } else {
        console.log('❌ Wrong error:', error.response?.status);
      }
    }

    // Test 2: Try to confirm PPE with wrong user
    console.log('\n📋 Test 2: Confirming PPE with wrong user');
    // This would need a different employee token
    console.log('⚠️  This test requires a different employee token');

  } catch (error) {
    console.error('❌ Error case test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting PPE Confirmation Tests\n');
  console.log('⚠️  Note: Update the tokens and IDs in the script before running\n');
  
  // Check if tokens are set
  if (MANAGER_TOKEN === 'your_manager_token_here' || EMPLOYEE_TOKEN === 'your_employee_token_here') {
    console.log('❌ Please update the tokens and IDs in the script before running');
    return;
  }

  await testPPEConfirmationFlow();
  await testErrorCases();
  
  console.log('\n🏁 All tests completed!');
}

// Export for use in other scripts
module.exports = {
  testPPEConfirmationFlow,
  testErrorCases,
  runTests
};

// Run if called directly
if (require.main === module) {
  runTests();
}
