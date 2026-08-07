/**
 * Verify Stitch Configuration and Environment Setup
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No .env file found at root. Using system/process environment.');
}

const errors = [];
const warnings = [];

// 1. Check API Key
const apiKey = process.env.STITCH_API_KEY;
if (!apiKey) {
  errors.push('❌ STITCH_API_KEY is not defined in the environment.');
} else if (apiKey.includes('your_') || apiKey.includes('YOUR_')) {
  warnings.push('⚠️ STITCH_API_KEY appears to contain placeholder text.');
} else {
  console.log('✅ STITCH_API_KEY is configured.');
}

// 2. Check Project ID
const projectId = process.env.STITCH_PROJECT_ID;
if (!projectId) {
  errors.push('❌ STITCH_PROJECT_ID is not defined in the environment.');
} else if (projectId.includes('your_') || projectId.includes('YOUR_')) {
  warnings.push('⚠️ STITCH_PROJECT_ID appears to contain placeholder text.');
} else {
  console.log(`✅ STITCH_PROJECT_ID is configured: "${projectId}"`);
}

// 3. Check Workspace ID (optional)
const workspaceId = process.env.STITCH_WORKSPACE_ID;
if (workspaceId) {
  if (workspaceId.includes('your_') || workspaceId.includes('YOUR_')) {
    warnings.push('⚠️ STITCH_WORKSPACE_ID appears to contain placeholder text.');
  } else {
    console.log(`ℹ️ STITCH_WORKSPACE_ID is configured: "${workspaceId}"`);
  }
}

// Summary
console.log('\n--- Stitch Configuration Diagnostics ---');
if (errors.length > 0) {
  console.error('\nErrors found:');
  errors.forEach(e => console.error(e));
  console.log('\nPlease fix the errors in your environment configuration before running Stitch.');
  process.exit(1);
} else {
  if (warnings.length > 0) {
    console.warn('\nWarnings:');
    warnings.forEach(w => console.warn(w));
  }
  console.log('\n🎉 Stitch environment configuration validation succeeded!');
}
