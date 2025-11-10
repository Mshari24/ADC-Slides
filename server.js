// Minimal static server with SPA fallback to index.html
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = __dirname;
const port = process.env.PORT ? Number(process.env.PORT) : 5173;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, data, headers = {}) {
  res.writeHead(status, headers);
  res.end(data);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let safePath = decodeURIComponent(parsed.pathname || '/');
  if (safePath.endsWith('/')) safePath += 'index.html';
  safePath = safePath.replace(/^\/+/, '');
  if (!safePath) safePath = 'index.html';

  const normalizedPath = path.normalize(safePath);
  const basePath = path.join(root, normalizedPath);
  const candidates = [];

  if (!path.extname(normalizedPath)) {
    candidates.push(`${basePath}.html`);
  }
  candidates.push(basePath);

  const attemptServe = (index) => {
    if (index >= candidates.length) {
      const indexPath = path.join(root, 'index.html');
      return fs.readFile(indexPath, (e, data) => {
        if (e) return send(res, 404, 'Not Found');
        send(res, 200, data, { 'Content-Type': 'text/html; charset=utf-8' });
      });
    }

    const candidate = candidates[index];

    if (!candidate.startsWith(root)) {
      return send(res, 403, 'Forbidden');
    }

    fs.stat(candidate, (err, stat) => {
      if (!err && stat.isFile()) {
        const ext = path.extname(candidate).toLowerCase();
        fs.readFile(candidate, (e, data) => {
          if (e) return send(res, 500, 'Internal Server Error');
          send(res, 200, data, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        });
      } else {
        attemptServe(index + 1);
      }
    });
  };

  attemptServe(0);
});

const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => {
  console.log(`Dev server running at http://${host}:${port}`);
});


