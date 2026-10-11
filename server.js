const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

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
