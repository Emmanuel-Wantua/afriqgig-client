// Deterministic env for tests. Nothing here points at real infrastructure —
// every outbound call (Mongo, Swychr, mail) is mocked at the module boundary.
process.env.MONGODB_URI = "mongodb://localhost:27017/afriqgig-test";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
process.env.NEXT_PUBLIC_URL = "https://test.afriqgig.com";
process.env.NEXT_PUBLIC_APP_URL = "https://test.afriqgig.com";
process.env.SWYCHR_WEBHOOK_SECRET = "test-secret-value";
process.env.SWYCHR_ADMIN_EMAIL = "test@swychr.local";
process.env.SWYCHR_ADMIN_PASSWORD = "test-password";

// Keep test output readable — routes log heavily by design.
if (!process.env.TEST_VERBOSE) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}
