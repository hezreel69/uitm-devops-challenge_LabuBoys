// Test script to check database and auth endpoints
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Check if database is connected
    await prisma.$connect();
    console.log('✅ Database connected\n');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}\n`);
    
    // Get first 5 users (without passwords)
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('   You need to create a user first.');
      console.log('   Try registering at: http://localhost:3001/auth/signup\n');
    } else {
      console.log('👥 Sample users:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   MFA: ${user.mfaEnabled ? 'Enabled' : 'Disabled'}`);
      });
    }
    
    console.log('\n\n🧪 Testing check-email endpoint...');
    if (users.length > 0) {
      const testEmail = users[0].email;
      console.log(`Testing with: ${testEmail}`);
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:3000/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const result = await response.json();
      console.log('Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
