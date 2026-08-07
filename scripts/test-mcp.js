/**
 * Test MCP Server Launch and Protocol Initialization
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('🚀 Launching Stitch MCP Server in testing mode...');

// Initialize JSON-RPC 2.0 Request according to the Model Context Protocol specification
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'Stitch-MCP-Verifier',
      version: '1.0.0'
    }
  }
};

const child = spawn('npx', ['-y', '@_davideast/stitch-mcp', 'proxy'], {
  env: { ...process.env },
  shell: true
});

let outputData = '';
let errorData = '';

child.stdout.on('data', (data) => {
  outputData += data.toString();
  console.log(`[Stdout] Received chunk of length ${data.length}`);
  try {
    // Try to parse stdout as JSON-RPC response
    const lines = outputData.trim().split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        const response = JSON.parse(line.trim());
        if (response.id === 1 && response.result) {
          console.log('\n✅ Stitch MCP Server responded to initialization successfully!');
          console.log('Capabilities:', JSON.stringify(response.result.capabilities, null, 2));
          console.log('Server Info:', response.result.serverInfo);
          cleanupAndExit(0);
        }
      }
    }
  } catch (e) {
    // Incomplete JSON or multiple lines, wait for more chunks
  }
});

child.stderr.on('data', (data) => {
  errorData += data.toString();
  console.warn(`[Stderr] ${data.toString().trim()}`);
});

child.on('error', (err) => {
  console.error('❌ Failed to spawn process:', err);
  process.exit(1);
});

// Set a timeout of 15 seconds to prevent hanging
const timeout = setTimeout(() => {
  console.error('\n❌ Initialization timed out. Server did not respond within 15 seconds.');
  if (errorData) {
    console.error('Stderr logs:\n', errorData);
  }
  cleanupAndExit(1);
}, 15000);

function cleanupAndExit(code) {
  clearTimeout(timeout);
  child.kill();
  process.exit(code);
}

// Write the JSON-RPC request to stdin
console.log('Sending "initialize" request to stdio...');
child.stdin.write(JSON.stringify(initializeRequest) + '\n');
