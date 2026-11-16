// Zero-dependency static preview server. Run: node preview-server.js
// (ES modules + import maps need http://, they will not load from file://)
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};
http.createServer((req, res) => {
  let relative;
  try { relative = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (relative === '/') relative = '/index.html';
  const file = path.resolve(root, '.' + relative);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173/'));
