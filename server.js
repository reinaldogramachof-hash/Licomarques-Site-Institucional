const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT = process.cwd();

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function serveFile(req, res, filePath, stat) {
  const ext = path.extname(filePath).toLowerCase();
  const type = TYPES[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', type);

  const range = req.headers.range;
  if (range) {
    const match = String(range).match(/bytes=(\d+)-(\d*)/);
    let start = match ? parseInt(match[1], 10) : 0;
    let end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
    if (isNaN(start)) start = 0;
    if (isNaN(end) || end >= stat.size) end = stat.size - 1;
    const chunkSize = (end - start) + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunkSize)
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Length', String(stat.size));
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const reqPath = decodeURI(req.url.split('?')[0]);
  let filePath = path.join(ROOT, reqPath);

  if (reqPath === '/' || reqPath === '/index.html') {
    filePath = path.join(ROOT, 'index.html');
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (err2, stat2) => {
        if (err2) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        serveFile(req, res, indexPath, stat2);
      });
      return;
    }
    serveFile(req, res, filePath, stat);
  });
});

server.listen(PORT, () => {
  console.log(`Preview on http://localhost:${PORT}/`);
});