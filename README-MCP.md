# Google Stitch MCP Integration Guide

This guide describes how to configure, authenticate, run, and troubleshoot the **Google Stitch Model Context Protocol (MCP)** server for the MedNova project. This integration allows AI coding agents (such as Claude Code, Cursor, Windsurf, or Gemini) to interact directly with your design system and screens in Google Stitch.

---

## 📂 Directory Structure

The MCP integration is organized as follows:

```text
d:\MedNova/
├── .mcp/
│   ├── config.json       # MCP Client server registration template
│   ├── stitch.json       # Workspace and project settings
│   └── auth.json         # Reference detailing authentication models
├── scripts/
│   ├── verify-stitch.js  # Environment diagnostics validation script
│   └── test-mcp.js       # End-to-end JSON-RPC initialization verifier
├── .env.example          # Environment variables template
└── README-MCP.md         # This documentation
```

---

## 🛠️ Prerequisites

1. **Node.js** (v18 or higher recommended).
2. **NPM** (v9 or higher).
3. **Google Stitch Account** with an active project and API access enabled.
4. **Google Cloud CLI** (`gcloud`) *[Optional]*: Required only if you authenticate via Application Default Credentials (ADC) instead of a static API key.

---

## 🔑 Authentication Setup

Stitch MCP supports two principal authentication methods:

### Method A: Static API Key (Recommended)
1. Generate an API Key in your **Google Stitch Settings** > **API Keys**.
2. Configure it in your environment:
   ```bash
   STITCH_API_KEY="your-actual-api-key"
   ```
3. Set the key inside your `.env` or MCP configuration client file.

### Method B: Google Cloud ADC (Application Default Credentials)
If `STITCH_API_KEY` is not present, the Stitch MCP server will automatically attempt authentication using local GCP credentials.
1. Install the Google Cloud CLI.
2. Authenticate on your terminal:
   ```bash
   gcloud auth application-default login
   ```
3. The server will dynamically pick up these credentials during runtime.

### Method C: Service Account JSON
For headless environments or CI/CD pipelines, configure the path to your service account key:
```bash
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

---

## ⚙️ MCP Client Configuration

To register the Stitch MCP server in your preferred client environment:

### VS Code / Cursor / Windsurf
Add the following to your MCP settings file (typically `.cursor/mcp.json`, `.vscode/settings.json`, or the editor's UI settings):

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": [
        "-y",
        "@_davideast/stitch-mcp",
        "proxy"
      ],
      "env": {
        "STITCH_API_KEY": "YOUR_STITCH_API_KEY_HERE",
        "STITCH_PROJECT_ID": "YOUR_STITCH_PROJECT_ID_HERE"
      }
    }
  }
}
```

---

## 🧪 Verification & Connection Tests

We have included automated testing scripts to verify the configuration and protocol handshake:

### Step 1: Validate Environment Configuration
Run the diagnostics script to check if environment variables are correctly loaded and do not contain placeholder text:

```bash
node scripts/verify-stitch.js
```

### Step 2: Test Protocol Handshake
Run the MCP test script to spawn the server, transmit a Model Context Protocol `initialize` handshake, and confirm it responds correctly:

```bash
node scripts/test-mcp.js
```

---

## 🚨 Troubleshooting & Error Handling

### 1. Error: `STITCH_API_KEY is not defined`
* **Fix**: Ensure your environment variables are set in a `.env` file or export them in your active shell before executing scripts.

### 2. Error: `gcloud: command not found`
* **Fix**: If using OAuth/ADC, you must install the Google Cloud SDK. Alternatively, use a **Static API Key** (`STITCH_API_KEY`) to bypass the `gcloud` requirement completely.

### 3. Error: `ModuleNotFoundError: No module named 'dotenv'` (when running scripts)
* **Fix**: If you get node dependency errors when executing test scripts, run:
  ```bash
  npm install dotenv
  ```

### 4. Error: `Initialization timed out`
* **Fix**: Check your network connection. Ensure you have authorized the `@_davideast/stitch-mcp` package to run, or check firewall rules blocking Google API endpoints (`stitch.googleapis.com`).

---

## 💡 Best Practices

* **Do Not Commit Secrets**: Never check `.env` or files containing real API keys into git. Keep them listed under `.gitignore`.
* **Use `-y` flag**: When registering the command, use `npx -y @_davideast/stitch-mcp proxy` to prevent interactive prompt hangs in daemon configurations.
* **Keep Updated**: Periodically clear npm cache or update the package:
  ```bash
  npx @_davideast/stitch-mcp@latest doctor
  ```
