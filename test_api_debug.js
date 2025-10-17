const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🔐 Testing Manager Login...');
    
    // 1. Login as manager
    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: 'manager_hr',
      password: 'Manager123!'
    });
    
    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.data && loginResponse.data.data.data.tokens && loginResponse.data.data.data.tokens.accessToken) {
      const token = loginResponse.data.data.data.tokens.accessToken;
      console.log('✅ Token received:', token.substring(0, 20) + '...');
      
      // 2. Test getDepartmentEmployeesPPE
      console.log('\n📋 Testing getDepartmentEmployeesPPE...');
      const ppeResponse = await makeRequest(`${API_BASE}/ppe/issuances/department-employees-ppe`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Department Employees PPE Response:', {
        status: ppeResponse.status,
        success: ppeResponse.data.success,
        message: ppeResponse.data.message,
        fullResponse: JSON.stringify(ppeResponse.data, null, 2)
      });
    } else {
      console.log('❌ Login failed or no token received');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
