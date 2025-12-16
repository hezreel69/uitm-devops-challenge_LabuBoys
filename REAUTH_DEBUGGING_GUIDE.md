# RE-AUTHENTICATION DEBUGGING GUIDE

## 🔍 Issue: Re-authentication not triggering

You reported:
1. ✅ Set `RE_AUTH_WINDOW` to 10 seconds in `reauth.js`
2. ❌ No verification happening when making payment
3. ❌ No verification after waiting >10 seconds

---

## 🛠️ DEBUGGING STEPS

### **Step 1: Check Backend Logs**

I've added detailed logging to `reauth.js`. When you try to create a booking, you should see:

```
[RE_AUTH] Checking authentication for user: xxx-xxx-xxx
[RE_AUTH] User xxx:
  - Last login: 2024-12-16T12:00:00.000Z
  - Time since login: 15 seconds (0 minutes)
  - Window limit: 10 seconds
  - Expired: true
[RE_AUTH] ❌ Session expired - requiring re-authentication
```

**What to do:**
1. Open your backend terminal
2. Try creating a booking
3. Check if you see `[RE_AUTH]` logs
4. If NO logs appear → Middleware isn't being called
5. If logs show "✅ Authentication valid" → Time hasn't expired yet

---

### **Step 2: Verify Middleware is Applied**

**Check:** `rentverse-backend/src/modules/bookings/bookings.routes.js`

Line 117 should have:
```javascript
router.post(
  '/',
  auth,
  authorize('USER', 'ADMIN'),
  requireRecentAuth,  // ← This must be here
  [validations...],
  bookingsController.createBooking
);
```

**What to check:**
- ✅ `requireRecentAuth` is imported at top (line 4)
- ✅ `requireRecentAuth` is in middleware chain (line 117)
- ✅ Order is: `auth` → `authorize` → `requireRecentAuth`

---

### **Step 3: Test the 10-Second Window**

1. **Login to your app** (creates new login history entry)

2. **Immediately try booking** (< 10 seconds)
   - **Expected:** ✅ Booking succeeds
   - **Backend log:** `[RE_AUTH] ✅ Authentication valid - Xs since login`

3. **Wait 11+ seconds, then try booking**
   - **Expected:** ❌ 403 error with `requireReAuth: true`
   - **Backend log:** `[RE_AUTH] ❌ Session expired - requiring re-authentication`

4. **Check frontend network tab**
   - Status: `403 Forbidden`
   - Response body: `{ "requireReAuth": true, "error": "RE_AUTH_REQUIRED" }`

---

### **Step 4: Check LoginHistory Table**

Run this in your database to verify login tracking works:

```sql
-- Check recent logins for your user
SELECT 
  id, 
  "userId", 
  success, 
  "createdAt",
  NOW() - "createdAt" AS time_since_login
FROM "login_history"
WHERE "userId" = 'YOUR_USER_ID'  -- Replace with your actual user ID
  AND success = true
ORDER BY "createdAt" DESC
LIMIT 5;
```

**What to verify:**
- ✅ Login entry exists when you log in
- ✅ `createdAt` timestamp is recent
- ✅ `success` is `true`

---

### **Step 5: Check if Frontend Handles Response**

**Problem:** Frontend might not show re-auth modal even if backend returns `requireReAuth: true`

**Frontend check:** Find where you make the booking API call

Should look something like:
```javascript
try {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  // Check if re-auth required
  if (data.requireReAuth) {
    // Show re-auth modal here
    console.log('RE-AUTH REQUIRED:', data.message);
    // setShowReAuthModal(true);
  }
} catch (error) {
  console.error(error);
}
```

---

## 🧪 QUICK TEST

### **Test 1: Console Test (Backend)**

Add this to your backend terminal:

```javascript
// Test the time calculation
const lastLogin = new Date('2024-12-16T12:00:00.000Z');
const now = Date.now();
const diff = now - lastLogin.getTime();
console.log('Time since login:', diff / 1000, 'seconds');
console.log('Expired?', diff > 10000); // 10 seconds
```

### **Test 2: Force Re-Auth (Backend)**

Temporarily change `reauth.js` line 9:

```javascript
const RE_AUTH_WINDOW = 1 * 1000; // 1 second (for testing)
```

Then:
1. Login
2. Wait 2 seconds
3. Try booking
4. Should get re-auth error

---

## 🔴 COMMON ISSUES

### **Issue 1: No Logs Appearing**

**Cause:** Middleware not being called

**Fix:**
1. Check if route exists in `app.js`:
   ```javascript
   app.use('/api/bookings', bookingsRoutes);
   ```

2. Verify you're calling the correct endpoint:
   - ✅ `POST http://localhost:3000/api/bookings`
   - ❌ `POST http://localhost:3000/bookings` (missing /api)

### **Issue 2: Always Says "Authentication Valid"**

**Cause:** Login timestamp is being updated on every request

**Fix:** Check if login history is only created on actual `/api/auth/login` calls, not on every authenticated request

### **Issue 3: Frontend Not Showing Modal**

**Cause:** Frontend not checking for `requireReAuth` in response

**Fix:** Add error handling in booking submission:
```javascript
if (response.status === 403) {
  const data = await response.json();
  if (data.requireReAuth) {
    alert('Re-authentication required!'); // Temporary test
    // Later: Show proper modal
  }
}
```

---

## 📝 TESTING CHECKLIST

Run through these tests:

**Backend Tests:**
- [ ] `[RE_AUTH]` logs appear in console when creating booking
- [ ] Login creates entry in `login_history` table with `success=true`
- [ ] Middleware shows correct time calculation in logs
- [ ] Response returns `requireReAuth: true` after 10 seconds

**Frontend Tests:**
- [ ] Network tab shows 403 status after 10 seconds
- [ ] Response body contains `{ "requireReAuth": true }`
- [ ] Console logs the error/response
- [ ] Modal appears (or alert if using temporary test)

**Database Tests:**
- [ ] `login_history` table has recent entry
- [ ] `riskScore` column is removed (if migration ran)
- [ ] No database errors in backend logs

---

## 🎯 EXPECTED BEHAVIOR

### **Timeline:**
```
0s  → Login (creates login_history entry)
5s  → Create booking → ✅ SUCCESS (< 10s)
12s → Create booking → ❌ 403 RE_AUTH_REQUIRED (> 10s)
```

### **Backend Response (after 10s):**
```json
{
  "success": false,
  "error": "RE_AUTH_REQUIRED",
  "message": "Your session has expired for this sensitive action. Please log in again.",
  "requireReAuth": true,
  "lastLogin": "2024-12-16T12:00:00.000Z",
  "sessionExpiredSeconds": 12,
  "windowSeconds": 10
}
```

---

## 🚀 NEXT STEPS

1. **Restart backend** to load new logging
2. **Login** to create fresh login history
3. **Open browser DevTools** → Network tab
4. **Try booking immediately** → Should work
5. **Wait 15 seconds** → Try again → Should fail with 403
6. **Check backend logs** for `[RE_AUTH]` messages
7. **Report back** what you see

---

## 💡 Quick Debug Command

Run this in backend console to test manually:

```javascript
// In Node REPL or add to test file
const { prisma } = require('./src/config/database');

async function testReAuth(userId) {
  const lastLogin = await prisma.loginHistory.findFirst({
    where: { userId, success: true },
    orderBy: { createdAt: 'desc' }
  });
  
  const diff = Date.now() - new Date(lastLogin.createdAt).getTime();
  console.log('Last login:', lastLogin.createdAt);
  console.log('Seconds ago:', diff / 1000);
  console.log('Expired (>10s)?', diff > 10000);
}

// Run with your user ID
testReAuth('your-user-id-here');
```

---

**Let me know what you see in the logs when you try creating a booking!** 🔍
