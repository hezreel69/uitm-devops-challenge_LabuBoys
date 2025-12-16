// Test to verify user data is correct
const fetch = require('node-fetch');

const TEST_EMAIL = 'admin@rentverse.com';
const TEST_PASSWORD = 'Admin@2024'; // Update this if different

async function testUserData() {
  console.log('🧪 Testing User Data Flow\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Login
    console.log('\n1️⃣  Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    
    const loginResult = await loginResponse.json();
    console.log('Status:', loginResponse.status);
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.message);
      console.log('\n💡 Try updating TEST_PASSWORD in the script');
      return;
    }
    
    if (loginResult.data.mfaRequired) {
      console.log('⏳ MFA Required - Check backend console for OTP');
      console.log('   (Skipping MFA test for now)');
      return;
    }
    
    const token = loginResult.data.token;
    const user = loginResult.data.user;
    
    console.log('\n✅ Login successful!');
    console.log('\n📦 User data from login:');
    console.log(JSON.stringify(user, null, 2));
    
    // Step 2: Test /me endpoint
    console.log('\n2️⃣  Testing /api/auth/me endpoint...');
    const meResponse = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const meResult = await meResponse.json();
    console.log('Status:', meResponse.status);
    
    if (meResult.success) {
      console.log('\n✅ /me endpoint working!');
      console.log('\n📦 User data from /me:');
      console.log(JSON.stringify(meResult.data, null, 2));
      
      // Compare data
      console.log('\n🔍 Data Comparison:');
      console.log('Login firstName:', user.firstName);
      console.log('/me firstName:  ', meResult.data.firstName);
      console.log('Login lastName: ', user.lastName);
      console.log('/me lastName:   ', meResult.data.lastName);
      console.log('Login name:     ', user.name);
      console.log('/me name:       ', meResult.data.name);
      
      if (user.name === meResult.data.name) {
        console.log('\n✅ User data matches!');
      } else {
        console.log('\n⚠️  User data MISMATCH!');
      }
    } else {
      console.log('❌ /me endpoint failed:', meResult.message);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testUserData();
