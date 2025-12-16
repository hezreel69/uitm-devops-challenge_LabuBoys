// Complete login flow test
const fetch = require('node-fetch');

const TEST_EMAIL = 'admin@rentverse.com';
const TEST_PASSWORD = 'admin123'; // Default password - change if different

async function testCompleteLoginFlow() {
  console.log('🧪 Testing Complete Login Flow\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Test check-email endpoint
    console.log('\n1️⃣  Testing /api/auth/check-email');
    console.log(`   Email: ${TEST_EMAIL}`);
    
    const checkEmailResponse = await fetch('http://localhost:3000/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });
    
    const checkEmailResult = await checkEmailResponse.json();
    console.log(`   Status: ${checkEmailResponse.status}`);
    console.log(`   Response:`, JSON.stringify(checkEmailResult, null, 2));
    
    if (!checkEmailResult.success || !checkEmailResult.data.exists) {
      console.log('   ❌ User does not exist!');
      return;
    }
    
    console.log('   ✅ User exists');
    
    // Step 2: Test login endpoint
    console.log('\n2️⃣  Testing /api/auth/login');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    
    const loginResult = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Response:`, JSON.stringify(loginResult, null, 2));
    
    if (!loginResult.success) {
      console.log(`   ❌ Login failed: ${loginResult.message}`);
      if (loginResult.message?.includes('password')) {
        console.log('\n   💡 TIP: The default password might be wrong.');
        console.log('      Try these common passwords:');
        console.log('      - password123');
        console.log('      - admin123');
        console.log('      - Admin@123');
        console.log('      Or create a new account at /auth/signup');
      }
      return;
    }
    
    if (loginResult.data.mfaRequired) {
      console.log('   ✅ Login successful - MFA required');
      console.log(`   Session Token: ${loginResult.data.sessionToken.substring(0, 20)}...`);
      console.log(`   Expires At: ${loginResult.data.expiresAt}`);
      console.log('\n   ⏳ CHECK BACKEND CONSOLE FOR OTP CODE');
    } else {
      console.log('   ✅ Login successful - No MFA');
      console.log(`   Token: ${loginResult.data.token.substring(0, 20)}...`);
      console.log(`   User: ${loginResult.data.user.firstName} ${loginResult.data.user.lastName}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ LOGIN FLOW TEST COMPLETE\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend is not running on port 3000!');
      console.log('   Start it with: cd rentverse-backend && pnpm run dev');
    }
  }
}

testCompleteLoginFlow();
