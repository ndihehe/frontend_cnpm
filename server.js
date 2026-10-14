const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Tự động nạp biến môi trường từ file .env (nếu có)
function loadEnv() {
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
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      console.log('[server] Loaded environment variables from .env');
    } catch (e) {
      console.warn('[server] Error reading .env:', e.message);
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqUrl = decodeURI(req.url.split('?')[0]);

  // Nạp cấu hình API_BASE_URL động từ .env hoặc Render Environment Variables
  if (reqUrl === '/js/config.js' || reqUrl === '/config.js') {
    const apiBaseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:8080/api';
    const body = `/* APP CONFIGURATION (LOADED DYNAMICALLY FROM ENVIRONMENT .env) */
const APP_CONFIG = {
  API_BASE_URL: ${JSON.stringify(apiBaseUrl)},
  STORAGE_TOKEN_KEY: 'auth_access_token',
  STORAGE_USER_KEY: 'auth_current_user',
  STORAGE_ROLE_KEY: 'auth_user_role'
};
window.APP_CONFIG = APP_CONFIG;
`;
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(body);
    return;
  }

  // API endpoint kiểm tra config hiện tại
  if (reqUrl === '/api/config') {
    const apiBaseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:8080/api';
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      apiBaseUrl: apiBaseUrl,
      port: PORT
    }));
    return;
  }

  if (reqUrl === '/' || reqUrl === '/login' || reqUrl === '/login.html' || 
      reqUrl === '/admin' || reqUrl === '/admin/' || reqUrl === '/admin/login' || reqUrl === '/admin/login.html' ||
      reqUrl === '/pages/auth/admin-login.html') {
    reqUrl = '/pages/auth/login.html';
  }

  let filePath = path.join(ROOT, reqUrl);

  // If not found directly, check alternative paths
  if (!fs.existsSync(filePath)) {
    const pagesPath = path.join(ROOT, 'pages', reqUrl);
    const strippedPagesPath = reqUrl.startsWith('/pages/') ? path.join(ROOT, reqUrl.replace(/^\/pages\//, '')) : null;

    if (fs.existsSync(pagesPath)) {
      filePath = pagesPath;
    } else if (strippedPagesPath && fs.existsSync(strippedPagesPath)) {
      filePath = strippedPagesPath;
    } else if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(pagesPath + '.html')) {
      filePath = pagesPath + '.html';
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(path.join(filePath, 'dashboard.html'))) {
      filePath = path.join(filePath, 'dashboard.html');
    } else if (fs.existsSync(path.join(filePath, 'schedule.html'))) {
      filePath = path.join(filePath, 'schedule.html');
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + reqUrl);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Server Error: ' + err.message);
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Frontend server is running at http://localhost:${PORT}/`);
  console.log(`Direct login URL: http://localhost:${PORT}/pages/auth/login.html`);
});
