const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let apiBaseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL;

// Read from .env if not found in process.env
if (!apiBaseUrl) {
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) {
    try {
      const lines = fs.readFileSync(envFile, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (key === 'API_BASE_URL' || key === 'BACKEND_URL') {
            apiBaseUrl = val;
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[build-config] Could not read .env:', e.message);
    }
  }
}

// Fallback default
if (!apiBaseUrl) {
  apiBaseUrl = 'http://localhost:8080/api';
}

const configContent = `/* APP CONFIGURATION (GENERATED FROM ENVIRONMENT .env) */
const APP_CONFIG = {
  API_BASE_URL: ${JSON.stringify(apiBaseUrl)},
  STORAGE_TOKEN_KEY: 'auth_access_token',
  STORAGE_USER_KEY: 'auth_current_user',
  STORAGE_ROLE_KEY: 'auth_user_role'
};
window.APP_CONFIG = APP_CONFIG;
`;

const configPath = path.join(ROOT, 'js', 'config.js');
fs.writeFileSync(configPath, configContent, 'utf8');
console.log(`[build-config] Generated js/config.js with API_BASE_URL: ${apiBaseUrl}`);
