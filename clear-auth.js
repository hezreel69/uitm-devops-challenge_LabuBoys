// Clear localStorage and test login
// Run this in browser console (F12)

// Clear all auth data
localStorage.removeItem('authToken');
localStorage.removeItem('authUser');
document.cookie.split(";").forEach((c) => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✅ All auth data cleared!');
console.log('Now try logging in again.');
