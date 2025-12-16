🧪 Testing MFA - Step by Step
Step 1: Apply Database Migration
First, you need to update the database schema:

cd rentverse-backend
npx prisma migrate dev --name add_mfa_support
Step 2: Restart Backend Server
npm run dev
Step 3: Login to Get Your Auth Token
Login normally to get your authentication token. After logging in, you can find it in:

Browser DevTools → Application → Local Storage → authToken
Or in the Network tab after login
Step 4: Enable MFA via API
You can enable MFA using curl or a tool like Postman:

Using PowerShell:

$token = "YOUR_AUTH_TOKEN_HERE"
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/mfa/enable" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body "{}"
Using curl:

curl -X POST http://localhost:3000/api/auth/mfa/enable \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -H "Content-Type: application/json"
You should see: "MFA has been enabled for your account"

Step 5: Log Out
Click logout or clear your local storage.

Step 6: Test MFA Login
Go to http://localhost:3001
Click Log in
Enter your email and password
After submitting, you should see the OTP verification screen 🎉
Step 7: Find Your OTP Code
Check your backend terminal console. You'll see something like:

[MFA] OTP for test@example.com: 123456
Step 8: Enter the OTP
Enter the 6-digit code in the OTP screen and click Verify Code.

📌 Quick Reference
Action	Command/Endpoint
Enable MFA	POST /api/auth/mfa/enable with auth token
Disable MFA	POST /api/auth/mfa/disable with auth token + password
View OTP	Check backend console logs