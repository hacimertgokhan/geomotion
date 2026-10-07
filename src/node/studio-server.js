#!/usr/bin/env node
// Tiny zero-dependency static server for the geomotion studio.
//   npm run studio            → http://localhost:5199
//   PORT=8080 npm run studio
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.PORT ?? 5199);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.md': 'text/plain; charset=utf-8',
};

http
  .createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.normalize(path.join(root, p));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) {
        // Same behaviour as GitHub Pages: /studio → /studio/ → /studio/index.html
        if (!p.endsWith('/')) { res.writeHead(301, { location: p + '/' }).end(); return; }
        file = path.join(file, 'index.html');
        st = fs.existsSync(file) ? fs.statSync(file) : null;
      }
      if ((err && !st) || !st?.isFile()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(port, () => console.log(`geomotion studio → http://localhost:${port}`));
